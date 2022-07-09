import * as uuid from 'uuid';

import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { isSDKSupported, SDK_TO_PACKET_VERSION } from '../../utils/sdkVersions';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { formatSDKVersion, RawData, StatusData } from '../../xmodem';
import {
  createAckPacket,
  LegacyDecodedPacketData,
  xmodemDecode
} from '../../xmodem/legacy';
import * as operations from '../operations';
import * as legacyCommands from '../operations/legacy';
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
  private tempPacketVersion?: PacketVersion;
  private useTempPacketVersion: boolean = false;
  private poolData: PacketData[] = [];
  private usableCommands = commands.v1;

  constructor(params: IConnectionInfo, options?: DeviceConnectionOptions) {
    super(params, options);

    this.startListening();
  }

  /**
   * Starts listening to all the events
   */
  private startListening() {
    this.isListening = true;

    this.connection.addListener('data', this.onData.bind(this));
    this.connection.addListener('close', this.onClose.bind(this));
    this.connection.addListener('error', this.onSerialPortError.bind(this));
  }

  /**
   * Stop listening to all the events
   */
  private stopListening() {
    if (this.connection) {
      this.connection.removeListener('data', this.onData.bind(this));
      this.connection.removeListener('close', this.onClose.bind(this));
      this.connection.removeListener(
        'error',
        this.onSerialPortError.bind(this)
      );
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
    if (this.useTempPacketVersion) {
      pVersion = this.getTempPacketVersion();
    } else {
      pVersion = this.getPacketVersion();
    }

    /**
     * Packets are processed globally only for legacy
     * packet versions: v1 and v2.
     *
     * Other packets are just broadcasted as it is
     */
    if (pVersion === PacketVersionMap.v3) {
      this.broadcastRawPacket(packet);
      return;
    }

    const data = xmodemDecode(packet, pVersion);

    for (const p of data) {
      try {
        await this.processPacket(p, pVersion);
      } catch (error) {
        logger.error('Error in processing packet');
        logger.error(error);
      }
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
    packet: LegacyDecodedPacketData,
    pVersion: PacketVersion
  ) {
    return new Promise<void>((resolve, reject) => {
      try {
        const newPacket: PacketData = { ...packet, id: uuid.v4() };

        // Ignore the packet if connection is not open
        if (!this.isOpen()) {
          return reject(new DeviceError(DeviceErrorType.CONNECTION_NOT_OPEN));
        }

        // Broadcast if it's an info packet
        if (this.isInfoPacket(newPacket)) {
          this.broadcastPacket(newPacket);
          return resolve();
        }

        // Send nack if packet has errors
        if (newPacket.errorList.length > 0) {
          const nackPacket = createAckPacket(
            this.usableCommands.NACK_PACKET,
            `0x${newPacket.currentPacketNumber.toString(16)}`,
            pVersion
          );
          this.write(nackPacket)
            .then(() => {
              resolve();
            })
            .catch(error => {
              logger.error('Error in sending NACK');
              logger.error(error);
              reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
            });
        } else {
          const ackPacket = createAckPacket(
            this.usableCommands.ACK_PACKET,
            `0x${newPacket.currentPacketNumber.toString(16)}`,
            pVersion
          );
          this.write(ackPacket)
            .then(() => {
              this.poolData.push(newPacket);
              this.broadcastPacket(newPacket);
              resolve();
            })
            .catch(error => {
              logger.error('Error in sending ACK');
              logger.error(error);

              // Add packet to pool even of ACK was not sent
              this.poolData.push(newPacket);
              this.broadcastPacket(newPacket);

              reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
            });
        }
      } catch (error) {
        reject(error);
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
   * Gets the temp packet version.
   * This is used when we are predicting the best packet version to
   * communicate with the device.
   */
  private getTempPacketVersion() {
    if (!this.tempPacketVersion) {
      throw new Error('No test packet version found.');
    }

    return this.tempPacketVersion;
  }

  private async getSDKVersion() {
    let retries = 0;
    const maxTries = 2;
    let firstError: Error = new Error('Could not get SDK version');
    this.tempPacketVersion = PacketVersionMap.v1;
    this.useTempPacketVersion = true;

    while (retries < maxTries) {
      try {
        await legacyCommands.sendData(this, 88, '00', PacketVersionMap.v1, 2);

        const sdkVersionData = await legacyCommands.receiveCommand(
          this,
          [88],
          5000
        );

        const sdkVersion = formatSDKVersion(sdkVersionData.data);

        this.tempPacketVersion = undefined;
        this.useTempPacketVersion = false;

        return sdkVersion;
      } catch (error) {
        retries++;
        firstError = error as Error;
      }
    }

    this.tempPacketVersion = undefined;
    this.useTempPacketVersion = false;
    throw firstError;
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
  public isInfoPacket(packet: LegacyDecodedPacketData) {
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
    return this.poolData.filter(packet =>
      commandTypes.includes(packet.commandType)
    );
  }

  /**
   * @deprecated
   * Sends the data with the specific command type to the device
   */
  public async sendData(command: number, data: string, maxTries?: number) {
    return legacyCommands.sendData(
      this,
      command,
      data,
      this.getPacketVersion(),
      maxTries
    );
  }

  /**
   * @deprecated
   * Use only when the device is in bootloader mode.
   * Sends the data with the specific command type to the device.
   */
  public async sendStmData(
    data: string,
    onProgress: (progress: number) => void
  ) {
    return legacyCommands.stmUpdateSendData(this, data, onProgress);
  }

  /**
   * @deprecated
   * Receive a specific set of commands from the device.
   */
  public async receiveData(
    commandTypes: number[],
    timeout?: number
  ): Promise<{ commandType: number; data: string }> {
    return legacyCommands.receiveCommand(this, commandTypes, timeout);
  }

  public async sendCommand(params: {
    commandType: number;
    data: string;
    sequenceNumber: number;
    maxTries?: number;
  }): Promise<void> {
    const version = this.getPacketVersion();

    if (version !== PacketVersionMap.v3) {
      throw new Error('Only v3 packets are supported');
    }

    await operations.sendCommand({
      connection: this,
      data: params.data,
      commandType: params.commandType,
      sequenceNumber: params.sequenceNumber,
      version: this.getPacketVersion(),
      maxTries: params.maxTries
    });
  }

  public async getStatus(params?: { maxTries?: number }): Promise<StatusData> {
    const version = this.getPacketVersion();

    if (version !== PacketVersionMap.v3) {
      throw new Error('Only v3 packets are supported');
    }

    const resp = await operations.getStatus({
      connection: this,
      version: this.getPacketVersion(),
      maxTries: params?.maxTries
    });

    if (!resp) {
      throw new Error('Did not receive the expected data');
    }

    return resp;
  }

  public async getCommandOutput(
    sequenceNumber: number
  ): Promise<StatusData | RawData> {
    const version = this.getPacketVersion();

    if (version !== PacketVersionMap.v3) {
      throw new Error('Only v3 packets are supported');
    }

    const resp = await operations.getCommandOutput({
      connection: this,
      sequenceNumber,
      version: this.getPacketVersion()
    });

    if (!resp) {
      throw new Error('Did not receive the expected data');
    }

    return resp;
  }

  public async waitForCommandOutput(params: {
    sequenceNumber: operations.IWaitForCommandOutputParams['sequenceNumber'];
    expectedCommandTypes: operations.IWaitForCommandOutputParams['expectedCommandTypes'];
    onStatus: operations.IWaitForCommandOutputParams['onStatus'];
    maxTries?: operations.IWaitForCommandOutputParams['maxTries'];
    options?: operations.IWaitForCommandOutputParams['options'];
  }) {
    const version = this.getPacketVersion();

    if (version !== PacketVersionMap.v3) {
      throw new Error('Only v3 packets are supported');
    }

    const resp = await operations.waitForCommandOutput({
      connection: this,
      version,
      ...params
    });

    return resp;
  }

  public async sendAbort(sequenceNumber: number) {
    const version = this.getPacketVersion();

    if (version !== PacketVersionMap.v3) {
      throw new Error('Only v3 packets are supported');
    }

    const resp = await operations.sendAbort({
      connection: this,
      version,
      sequenceNumber
    });

    return resp;
  }

  public async isDeviceSupported() {
    const sdkVersion = await this.getSDKVersion();

    if (SDK_TO_PACKET_VERSION[sdkVersion]) {
      this.workingPacketVersion = SDK_TO_PACKET_VERSION[sdkVersion];
    }

    const { isSupported, isNewer } = isSDKSupported(sdkVersion);

    return { sdkVersion, isSupported, isNewer };
  }
}
