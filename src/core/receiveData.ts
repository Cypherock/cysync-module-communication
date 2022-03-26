import SerialPort from 'serialport';

import { commands } from '../config';
import { DeviceError, DeviceErrorType } from '../errors';
import { logger } from '../utils';
import { PacketVersion, PacketVersionMap } from '../utils/versions';
import { xmodemDecode } from '../xmodem';

import { ackData } from './sendData';

const DEFAULT_RECEIVE_TIMEOUT = 15000;

/**
 * waits for the hardware to send a message with the specified command number
 *
 * @example
 * ```typescript
 * import {createPort, receiveCommand} from '@cypherock/communication'
 *
 * const connection = await createPort();
 *
 * const data = receiveCommand(connection, 10);
 * ```
 *
 * @param connection - SerialPort connection instance
 * @param command - command number whose message to return
 * @return timeout - Timeout in ms
 */
export const receiveCommand = (
  connection: SerialPort,
  command: number,
  version: PacketVersion,
  timeout: number = DEFAULT_RECEIVE_TIMEOUT
) => {
  const usableCommands = commands.v1;

  /**
   * Be sure to remove all listeners and timeout.
   *
   * Using functions for listeners to be able to refer to them before declaration
   * in setTimeout.
   *
   * Using onClose hooks to check if the connection has been closed. If this is not
   * present then the function will wait for the command even after the device has been
   * disconneced.
   */
  const resData: any = [];
  return new Promise((resolve, reject) => {
    if (!connection.isOpen) {
      reject(new DeviceError(DeviceErrorType.CONNECTION_NOT_OPEN));
      return;
    }

    let timeoutIdentifier: NodeJS.Timeout | null = null;

    if (timeout) {
      timeoutIdentifier = setTimeout(() => {
        connection.removeListener('data', eListener);
        connection.removeListener('close', onClose);
        reject(new DeviceError(DeviceErrorType.READ_TIMEOUT));
      }, timeout);
    }

    function eListener(packet: any) {
      const data = xmodemDecode(packet, version);
      // When fetching logs
      if (data.length > 0 && data[0].commandType === 38) {
        resolve(data[0].dataChunk);
        if (timeoutIdentifier) {
          clearTimeout(timeoutIdentifier);
        }
        connection.removeListener('close', onClose);
        connection.removeListener('data', eListener);
        logger.info(`Received command (38)`);
        return;
      }

      data.forEach(d => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        if (commandType === command) {
          resData[currentPacketNumber - 1] = dataChunk;
          const ackPacket = ackData(
            usableCommands.ACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`,
            version
          );
          connection.write(Buffer.from(ackPacket, 'hex'), error => {
            if (error) {
              logger.error('Error in sending ACK');
              logger.error(error);
            }
            if (currentPacketNumber === totalPacket) {
              // If the command contains Xpub don't log in production
              if (command === 49) {
                logger.info(`Received command (${command})`);
                logger.debug(
                  `Received command (${command}) : ${resData.join('')}`
                );
              } else {
                logger.info(
                  `Received command (${command}) : ${resData.join('')}`
                );
              }
              resolve(resData.join(''));
              if (timeoutIdentifier) {
                clearTimeout(timeoutIdentifier);
              }
              connection.removeListener('data', eListener);
              connection.removeListener('close', onClose);
            }
          });
        } else {
          if (version !== PacketVersionMap.v1) {
            // Send NACK if invalid command.
            const nackPacket = ackData(
              usableCommands.NACK_PACKET,
              `0x${currentPacketNumber.toString(16)}`,
              version
            );
            connection.write(Buffer.from(nackPacket, 'hex'), error => {
              if (error) {
                logger.error('Error in sending NACK');
                logger.error(error);
              }
            });
          }
        }
      });
    }

    function onClose(err: any) {
      if (timeoutIdentifier) {
        clearTimeout(timeoutIdentifier);
      }
      connection.removeListener('data', eListener);
      connection.removeListener('close', onClose);

      if (err) {
        logger.error(err);
      }

      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    connection.on('data', eListener);
    connection.on('close', onClose);
  });
};

/**
 * waits for the hardware to send a message and returns a object with command number and data in hex
 *
 * @example
 * ```typescript
 * import {createPort, receiveData} from '@cypherock/communication'
 *
 * const connection = await createPort();
 *
 * const data = receiveData(connection, 10);
 * ```
 */
export const receiveData = (connection: SerialPort, version: PacketVersion) => {
  const usableCommands = commands.v1;

  const resData: any = [];
  return new Promise(resolve => {
    const eListener = (packet: any) => {
      const data = xmodemDecode(packet, version);
      data.forEach(d => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        resData[currentPacketNumber - 1] = dataChunk;
        const ackPacket = ackData(
          usableCommands.ACK_PACKET,
          `0x${currentPacketNumber.toString(16)}`,
          version
        );
        connection.write(Buffer.from(ackPacket, 'hex'), error => {
          if (error) {
            logger.error('Error in sending ACK');
            logger.error(error);
          }

          if (currentPacketNumber === totalPacket) {
            logger.info(
              `Received command (${commandType}) : ${resData.join('')}`
            );
            resolve({ commandType, data: resData.join('') });

            /**
             * We don't have to remove listener for this this one as this
             * one is for internal usages, global listener
             * in case need to test listener uncomment line below
             */
            // connection.removeListener('data', eListener)
          }
        });
      });
    };
    connection.on('data', eListener);
  });
};

/**
 * waits for the hardware to send a message with one of the specified command numbers and returns the data in hex
 *
 * @example
 * ```typescript
 * import {createPort, receiveAnyCommand} from '@cypherock/communication'
 *
 * const connection = await createPort();
 *
 * const data = receiveAnyCommand(connection, [10, 12]);
 * ```
 *
 * @param connection - SerialPort connection instance
 * @param allAcceptableCommands - list of command numbers to listen to.
 * @return data
 */
export const receiveAnyCommand = (
  connection: SerialPort,
  allAcceptableCommands: number[],
  version: PacketVersion,
  timeout: number = DEFAULT_RECEIVE_TIMEOUT
) => {
  const usableCommands = commands.v1;

  const resData: any = [];
  return new Promise((resolve, reject) => {
    if (!connection.isOpen) {
      reject(new DeviceError(DeviceErrorType.CONNECTION_NOT_OPEN));
      return;
    }

    let timeoutIdentifier: NodeJS.Timeout | null = null;

    if (timeout) {
      timeoutIdentifier = setTimeout(() => {
        connection.removeListener('data', eListener);
        connection.removeListener('close', onClose);
        reject(new DeviceError(DeviceErrorType.READ_TIMEOUT));
      }, timeout);
    }

    function eListener(packet: any) {
      const data = xmodemDecode(packet, version);
      data.forEach(d => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        if (allAcceptableCommands.includes(commandType)) {
          resData[currentPacketNumber - 1] = dataChunk;
          const ackPacket = ackData(
            usableCommands.ACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`,
            version
          );
          connection.write(Buffer.from(ackPacket, 'hex'), error => {
            if (error) {
              logger.error('Error in sending ACK');
              logger.error(error);
            }

            if (currentPacketNumber === totalPacket) {
              if (commandType === 49) {
                logger.info(`Received command (${commandType})`);
                logger.debug(
                  `Received command (${commandType}) : ${resData.join('')}`
                );
              } else {
                logger.info(
                  `Received command (${commandType}) : ${resData.join('')}`
                );
              }
              resolve({ commandType, data: resData.join('') });
              if (timeoutIdentifier) {
                clearTimeout(timeoutIdentifier);
              }
              connection.removeListener('data', eListener);
              connection.removeListener('close', onClose);
            }
          });
        } else {
          if (version !== PacketVersionMap.v1) {
            // Send NACK if invalid command.
            const nackPacket = ackData(
              usableCommands.NACK_PACKET,
              `0x${currentPacketNumber.toString(16)}`,
              version
            );
            connection.write(Buffer.from(nackPacket, 'hex'), error => {
              if (error) {
                logger.error('Error in sending NACK');
                logger.error(error);
              }
            });
          }
        }
      });
    }

    function onClose(err: any) {
      if (timeoutIdentifier) {
        clearTimeout(timeoutIdentifier);
      }

      connection.removeListener('data', eListener);
      connection.removeListener('close', onClose);

      if (err) {
        logger.error(err);
      }

      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    connection.on('data', eListener);
    connection.on('close', onClose);
  });
};
