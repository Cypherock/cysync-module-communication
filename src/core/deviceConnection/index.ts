import * as uuid from 'uuid';
import { EventEmitter } from 'events';
import SerialPort from 'serialport';
import { xmodemDecode, createAckPacket, DecodedPacketData } from '../../xmodem';
import { PacketVersionMap, PacketVersion } from '../../utils/versions';
import { commands } from '../../config';
import { openConnection, closeConnection } from './utils';
import { logger } from '../../utils';
import { PacketData, DeviceConnectionInterface } from './types';
import { sendData } from './sendData';
import { receiveCommand } from './receiveData';

export class DeviceConnection
  extends EventEmitter
  implements DeviceConnectionInterface
{
  public connection: SerialPort;
  public isListening: boolean = false;
  private packetVersion?: PacketVersion;
  private poolData: PacketData[] = [];
  private usableCommands = commands.v1;

  constructor(port: string) {
    super();
    this.connection = new SerialPort(port, {
      baudRate: 115200,
      autoOpen: true
    });
    this.setupListeners();
  }

  public isConnected() {
    return this.connection && !this.connection.destroyed;
  }

  public isOpen() {
    return this.isConnected() && this.connection.isOpen;
  }

  public open() {
    console.log('Opening connection');
    return openConnection(this.connection);
  }

  public close() {
    console.log('Closing connection');
    return closeConnection(this.connection);
  }

  public destroy() {
    this.removeListeners();
    return this.connection.destroy();
  }

  private setupListeners() {
    console.log('Setting up listeners');
    this.isListening = true;
    this.packetVersion = PacketVersionMap.v2;

    this.connection.addListener('data', this.onData.bind(this));
    this.connection.addListener('close', this.onClose.bind(this));
  }

  private removeListeners() {
    console.log('Removing listeners');
    if (this.connection) {
      this.connection.removeAllListeners();
    }

    this.packetVersion = undefined;
    this.isListening = false;
  }

  private onClose(error: any) {
    this.emit('close', error);
  }

  private async onData(packet: any) {
    console.log('Received data');
    if (this.packetVersion) {
      const data = xmodemDecode(packet, this.packetVersion);
      console.log(data);

      for (const packet of data) {
        await this.processPacket(packet);
      }
    }
  }

  public isInfoPacket(packet: DecodedPacketData) {
    return [
      this.usableCommands.ACK_PACKET,
      this.usableCommands.NACK_PACKET
    ].includes(packet.commandType);
  }

  private async processPacket(packet: DecodedPacketData) {
    return new Promise<void>((resolve, _reject) => {
      console.log('Processing packet');
      try {
        const newPacket: PacketData = { ...packet, id: uuid.v4() };
        if (
          this.packetVersion &&
          this.connection &&
          this.connection.isOpen &&
          !this.connection.destroyed
        ) {
          if (this.isInfoPacket(newPacket)) {
            console.log('Broadcasting ACK or NACK');
            this.broadcastPacket(newPacket);
          } else {
            if (newPacket.errorList.length <= 0) {
              console.log('Sending ACK');
              const ackPacket = createAckPacket(
                this.usableCommands.ACK_PACKET,
                `0x${newPacket.currentPacketNumber.toString(16)}`,
                this.packetVersion
              );
              this.connection.write(Buffer.from(ackPacket, 'hex'), error => {
                if (error) {
                  logger.error('Error in sending ACK');
                  logger.error(error);
                }
                console.log('Adding to Pool');
                this.poolData.push(newPacket);
                this.broadcastPacket(newPacket);
                resolve();
              });
            } else {
              console.log('Sending NACK');
              const nackPacket = createAckPacket(
                this.usableCommands.NACK_PACKET,
                `0x${newPacket.currentPacketNumber.toString(16)}`,
                this.packetVersion
              );
              this.connection.write(Buffer.from(nackPacket, 'hex'), error => {
                if (error) {
                  logger.error('Error in sending NACK');
                  logger.error(error);
                }
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

  private broadcastPacket(packet: PacketData) {
    if (this.isInfoPacket(packet)) {
      this.emit('ack', packet);
    } else {
      this.emit('data', packet);
    }
  }

  public onPacketUse(packetId: string) {
    console.log('Paket used: ' + packetId);
    console.log('Before pool size: ' + this.poolData.length);
    this.poolData = this.poolData.filter(elem => elem.id !== packetId);
    console.log('After pool size: ' + this.poolData.length);
  }

  public getPacketsFromPool(commandTypes: number[]) {
    const packets: PacketData[] = [];
    console.log('Pool Size: ' + this.poolData.length);
    console.log(this.poolData);

    for (const packet of this.poolData) {
      if (commandTypes.includes(packet.commandType)) {
        packets.push(packet);
      }
    }

    console.log('Packet from pool');
    console.log(packets);
    return packets;
  }

  public sendData(command: number, data: string, maxTries?: number) {
    return sendData(this, command, data, this.packetVersion || 'v2', maxTries);
  }

  public receiveData(commands: number[], timeout?: number) {
    return receiveCommand(this, commands, this.packetVersion || 'v2', timeout);
  }
}
