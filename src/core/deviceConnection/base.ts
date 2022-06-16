import { EventEmitter } from 'events';
import SerialPort from 'serialport';
import * as uuid from 'uuid';

import { logger } from '../../utils';
import { IConnectionInfo } from '../types';
import { closeConnection, openConnection } from '../utils';

export interface BaseDeviceConnectionOptions {
  autoOpen?: boolean;
}

export class BaseDeviceConnection extends EventEmitter {
  public port: string;
  public deviceState: string;
  public inBootloader: boolean;
  public hardwareVersion: string;
  public serial?: string;
  public connectionId: string;
  protected sequenceNumber: number;

  protected connection: SerialPort;

  private autoOpen: boolean;

  constructor(params: IConnectionInfo, options?: BaseDeviceConnectionOptions) {
    super();
    this.port = params.port.path;
    this.deviceState = params.deviceState;
    this.inBootloader = params.inBootloader;
    this.hardwareVersion = params.hardwareVersion;
    this.serial = params.serial;
    this.autoOpen = options?.autoOpen || false;

    this.connectionId = uuid.v4();
    this.sequenceNumber = 0;

    this.connection = new SerialPort(
      this.port,
      {
        baudRate: 115200,
        autoOpen: this.autoOpen
      },
      this.onSerialPortError.bind(this)
    );
  }

  protected onSerialPortError(error: any) {
    logger.error('Error in serialport');
    logger.error(error);
  }

  protected getSequenceNumber() {
    return ++this.sequenceNumber;
  }

  /**
   * Returns if the device is connected or not
   */
  public isConnected() {
    return this.connection && !this.connection.destroyed;
  }

  /**
   * Returns if the device connection is open, i.e., if it's ready to communicate.
   */
  public isOpen() {
    return this.isConnected() && this.connection.isOpen;
  }

  /**
   * Open the device connection
   */
  public open() {
    if (this.isOpen()) {
      return;
    }

    logger.info('Connection open');
    return openConnection(this.connection);
  }

  /**
   * Close the device connection
   */
  public close() {
    logger.info('Connection closed');
    return closeConnection(this.connection);
  }

  /**
   * Run this function before starting every operation on the device.
   */
  public async beforeOperation() {
    await this.open();
  }

  /**
   * Run this function after every operation on the device.
   */
  public async afterOperation() {
    if (!this.autoOpen) {
      await this.close();
    }
  }

  /**
   * Writes a given data string (in hex) to the device.
   */
  public write(data: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log({ msg: 'Writing data', data });
        this.connection.write(Buffer.from(data, 'hex'), error => {
          if (error) {
            return reject(error);
          }

          // Wait for the write to be completed
          this.connection.drain(err => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
