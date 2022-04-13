import SerialPort from 'serialport';
import { EventEmitter } from 'events';
import { DecodedPacketData } from '../../xmodem';

export interface PacketData extends DecodedPacketData {
  id: string;
}

export interface DeviceConnectionInterface {
  connection: SerialPort;
  getPacketsFromPool(_commandTypes: number[]): PacketData[];
  onPacketUse(packetId: string): void;
  isOpen(): boolean;
  isConnected(): boolean;
  addListener: EventEmitter['addListener'];
  removeListener: EventEmitter['removeListener'];
  removeAllListeners: EventEmitter['removeAllListeners'];
}
