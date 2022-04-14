import * as uuid from 'uuid';

import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionList } from '../../utils/versions';
import { createAckPacket, DecodedPacketData, xmodemDecode } from '../../xmodem';
import { receiveCommand } from '../receiveData';
import { sendData } from '../sendData';
import { stmUpdateSendData } from '../stmSendData';
import {
  DeviceConnectionInterface,
  IConnectionInfo,
  PacketData
} from '../types';

import { BaseDeviceConnection, BaseDeviceConnectionOptions } from './base';

export interface DeviceConnectionOptions extends BaseDeviceConnectionOptions {}

export class DeviceConnection
  extends BaseDeviceConnection
  implements DeviceConnectionInterface
{
  public isListening: boolean = false;

  private workingPacketVersion?: PacketVersion;
  private testPacketVersion?: PacketVersion;
  private isTestingPacketVersion: boolean = false;
  private poolData: PacketData[] = [];
  private usableCommands = commands.v1;

  constructor(params: IConnectionInfo, options?: DeviceConnectionOptions) {
    super(params, options);

    this.startListening();
  }

  /**
   * Starts listening to all the events
   */
  public startListening() {
    this.isListening = true;

    this.connection.addListener('data', this.onData.bind(this));
    this.connection.addListener('close', this.onClose.bind(this));
  }

  /**
   * Stop listening to all the events
   */
  public stopListening() {
    if (this.connection) {
      this.connection.removeListener('data', this.onData.bind(this));
      this.connection.removeListener('close', this.onClose.bind(this));
      this.connection.removeAllListeners();
    }

    this.isListening = false;
  }

  /**
   * Listens for device onClose event, and broadcast it.
   */
  private onClose(error: any) {
    this.emit('close', error);
  }

  /**
   * Listens to data from device.
   *
   * Does the following:
   * - If the device is in bootloader mode, just broadcast the raw packet.
   * - Else:
   *   - Decode the packets
   *   - Process each packet individually
   */
  private async onData(packet: any) {
    if (this.inBootloader) {
      this.broadcastRawPacket(packet);
      return;
    }

    let pVersion: PacketVersion;
    if (this.isTestingPacketVersion) {
      pVersion = this.getTestingPacketVersion();
    } else {
      pVersion = this.getPacketVersion();
    }

    const data = xmodemDecode(packet, pVersion);

    for (const p of data) {
      await this.processPacket(p, pVersion);
    }
  }

  /**
   * Process the received packet from device.
   *
   * Does the following:
   * - Assign a unique ID to the packet
   * - If the connection to device is not open, ignore the packet
   * - If it's an info packet (ACK or NACK), broadcast it
   * - If it's a data packet.
   *   - If invalid packet send NACK.
   *   - If valid packet
   *     - Send ACK.
   *     - Add to pool
   *     - Broadcast packet
   */
  private async processPacket(
    packet: DecodedPacketData,
    pVersion: PacketVersion
  ) {
    return new Promise<void>((resolve, _reject) => {
      try {
        const newPacket: PacketData = { ...packet, id: uuid.v4() };
        if (this.isOpen()) {
          if (this.isInfoPacket(newPacket)) {
            this.broadcastPacket(newPacket);
          } else {
            if (newPacket.errorList.length <= 0) {
              const ackPacket = createAckPacket(
                this.usableCommands.ACK_PACKET,
                `0x${newPacket.currentPacketNumber.toString(16)}`,
                pVersion
              );
              this.write(ackPacket)
                .then(() => {})
                .catch(error => {
                  logger.error('Error in sending ACK');
                  logger.error(error);
                })
                .finally(() => {
                  this.poolData.push(newPacket);
                  this.broadcastPacket(newPacket);
                  resolve();
                });
            } else {
              const nackPacket = createAckPacket(
                this.usableCommands.NACK_PACKET,
                `0x${newPacket.currentPacketNumber.toString(16)}`,
                pVersion
              );
              this.write(nackPacket)
                .then(() => {})
                .catch(error => {
                  logger.error('Error in sending NACK');
                  logger.error(error);
                })
                .finally(() => {
                  resolve();
                });
            }
          }
        }
      } catch (error) {
        logger.error('Error in adding packet to pool');
        logger.error(error);
      }
    });
  }

  /**
   * Broadcast the raw packet to the listeners
   */
  private broadcastRawPacket(packet: any) {
    this.emit('data', packet);
  }

  /**
   * Broadcast the packet to the listeners
   */
  private broadcastPacket(packet: PacketData) {
    if (this.isInfoPacket(packet)) {
      this.emit('ack', packet);
    } else {
      this.emit('data', packet);
    }
  }

  /**
   * Gets the best packet version that works with the device.
   * This returns the already predicted value from `selectPacketVersion`.
   */
  public getPacketVersion() {
    if (!this.workingPacketVersion) {
      throw new Error('No working packet version found.');
    }

    return this.workingPacketVersion;
  }

  /**
   * Gets the test packet version.
   * This is used when we are predicting the best packet version to
   * communicate with the device.
   */
  private getTestingPacketVersion() {
    if (!this.testPacketVersion) {
      throw new Error('No test packet version found.');
    }

    return this.testPacketVersion;
  }

  /**
   * Tests a particular packet version and returns if it works.
   */
  private checkPacketVersion(version: PacketVersion) {
    return new Promise<boolean>(async resolve => {
      try {
        logger.info(`Checking if packet version ${version} works`);

        await sendData(this, 41, '00', version, 2);
        receiveCommand(this, [42], version, 2000)
          .then(() => {
            resolve(true);
          })
          .catch(error => {
            if (error) {
              resolve(false);
            }
          });
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Tests all possible packet versions and returns the working one.
   */
  private getWorkingPacketVersion() {
    return new Promise<PacketVersion | undefined>(async (resolve, reject) => {
      this.isTestingPacketVersion = true;
      try {
        if (!this.isConnected()) {
          throw new Error('Connection was destroyed');
        }

        let workingPacketVersion: PacketVersion | undefined;

        const versionList = [...PacketVersionList].reverse();

        for (const packet of versionList) {
          this.testPacketVersion = packet;
          const isWorking = await this.checkPacketVersion(packet);
          if (isWorking) {
            workingPacketVersion = packet;
            break;
          }
        }

        resolve(workingPacketVersion);
      } catch (error) {
        reject(error);
      } finally {
        this.testPacketVersion = undefined;
        this.isTestingPacketVersion = false;
      }
    });
  }

  /**
   * Computes the best possible packet version to communicate with the device.
   */
  public async selectPacketVersion() {
    this.workingPacketVersion = await this.getWorkingPacketVersion();
    if (!this.workingPacketVersion) {
      throw new DeviceError(DeviceErrorType.NO_WORKING_PACKET_VERSION);
    }

    return this.workingPacketVersion;
  }

  /**
   * Destroyes the connection and stop listening to the data.
   */
  public destroy() {
    logger.info('Connection destroyed');
    this.stopListening();
    this.close();
    return this.connection.destroy();
  }

  /**
   * Checks if the packet is an info packet.
   * Info packets are: ACK, or NACK
   */
  public isInfoPacket(packet: DecodedPacketData) {
    return [
      this.usableCommands.ACK_PACKET,
      this.usableCommands.NACK_PACKET
    ].includes(packet.commandType);
  }

  /**
   * Marks the packet as used and removes it from pool.
   */
  public onPacketUse(packetId: string) {
    this.poolData = this.poolData.filter(elem => elem.id !== packetId);
  }

  /**
   * Get the unused packets from the pool.
   */
  public getPacketsFromPool(commandTypes: number[]) {
    const packets: PacketData[] = [];

    for (const packet of this.poolData) {
      if (commandTypes.includes(packet.commandType)) {
        packets.push(packet);
      }
    }

    return packets;
  }

  /*
   * In future if we want to run a specific some code before or after running an
   * operation, we can do it here.
   *
   * For example:
   * - Open the connection before running any operation.
   * - Closing the connection after every operation.
   * - etc
   */
  private async runOperation<T>(callback: () => Promise<T>): Promise<T> {
    try {
      const resp = await callback();
      return resp;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sends the data with the specific command type to the device
   */
  public async sendData(command: number, data: string, maxTries?: number) {
    return this.runOperation(() => {
      return sendData(this, command, data, this.getPacketVersion(), maxTries);
    });
  }

  /**
   * Use only when the device is in bootloader mode.
   * Sends the data with the specific command type to the device.
   */
  public async sendStmData(data: string) {
    return this.runOperation(() => {
      return stmUpdateSendData(this, data);
    });
  }

  /**
   * Receive a specific set of commands from the device.
   */
  public async receiveData(
    commandTypes: number[],
    timeout?: number
  ): Promise<{ commandType: number; data: string }> {
    return this.runOperation(() => {
      return receiveCommand(
        this,
        commandTypes,
        this.getPacketVersion(),
        timeout
      );
    });
  }
}
