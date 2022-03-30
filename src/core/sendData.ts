import SerialPort from 'serialport';

import { byteStuffing, intToUintByte } from '../bytes';
import { commands, constants, radix } from '../config';
import { DeviceError, DeviceErrorType } from '../errors';
import { logger } from '../utils';
import { PacketVersion, PacketVersionMap } from '../utils/versions';
import { xmodemDecode, xmodemEncode } from '../xmodem';

import { crc16 } from './crc';

/**
 * Writes the packet to the SerialPort on the given connection,
 * and rejects the promise if there is no acknowledgment from the device
 *
 *
 * @param connection - SerialPort connection instance
 * @param packet - packet to send to the hardware
 * @return
 */
const writePacket = (
  connection: SerialPort,
  packet: any,
  version: PacketVersion
) => {
  let usableConstants = constants.v1;
  const usableCommands = commands.v1;

  if (!connection.isOpen || connection.destroyed) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  if (version === PacketVersionMap.v2) {
    usableConstants = constants.v2;
  }

  /**
   * Be sure to remove all listeners and timeout.
   */
  return new Promise((resolve, reject) => {
    let timeout: NodeJS.Timeout;

    /**
     * Ensure is listener is activated first before writing
     */
    function dataListener(ePacket: any) {
      const data = xmodemDecode(ePacket, version);
      data.forEach(d => {
        const { commandType } = d;
        if (Number(commandType) === usableCommands.ACK_PACKET) {
          if (timeout) {
            clearTimeout(timeout);
          }
          resolve(true);
          connection.removeListener('data', dataListener);
          connection.removeListener('close', onClose);
        }
      });
    }

    function onClose(error: any) {
      if (timeout) {
        clearTimeout(timeout);
      }
      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      if (error) {
        logger.error(error);
      }
      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    connection.addListener('data', dataListener);
    connection.addListener('close', onClose);

    connection.write(Buffer.from(packet, 'hex'), (err: any) => {
      if (err) {
        if (timeout) {
          clearTimeout(timeout);
        }
        connection.removeListener('data', dataListener);
        connection.removeListener('close', onClose);
        logger.error(err);
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
        return;
      }
    });

    timeout = setTimeout(() => {
      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
    }, usableConstants.ACK_TIME);
  });
};

/**
 * Sends data to the hardware on the given connection instance.
 * It takes in string
 *
 * @example
 * ```typescript
 * import {createPort, sendData} from '@cypherock/communication'
 *
 * const connection = await createPort();
 *
 * await sendData(connection, 21, "102030");
 * ```
 *
 * @param connection - SerialPort connection instance
 * @param command - command number for the message
 * @param data - data in hex format
 * @return
 */
const sendData = async (
  connection: SerialPort,
  command: number,
  data: string,
  version: PacketVersion,
  maxTries = 5
) => {
  const packetsList = xmodemEncode(data, command, version);
  logger.info(
    `Sending command ${command} : containing ${packetsList.length} packets.`
  );
  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map(d => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      let _maxTries = maxTries;
      if (command === 255) _maxTries = 1;

      let lastError: Error | undefined;
      while (tries <= _maxTries) {
        try {
          await writePacket(connection, d, version);
          resolve(true);
          return;
        } catch (e) {
          // Don't retry if connection closed
          if (e instanceof DeviceError) {
            if (
              [
                DeviceErrorType.CONNECTION_CLOSED,
                DeviceErrorType.CONNECTION_NOT_OPEN,
                DeviceErrorType.NOT_CONNECTED
              ].includes(e.errorType)
            ) {
              tries = _maxTries;
            }
          }

          lastError = e as Error;
          logger.warn('Error in sending data', e);
        }
        tries++;
      }

      if (lastError) {
        reject(lastError);
      } else {
        reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
      }
    };
  });

  for (const i of dataList) {
    try {
      await new Promise((res, rej) => {
        i(res, rej);
      });
    } catch (e) {
      if (e) {
        throw e;
      }

      throw new DeviceError(DeviceErrorType.WRITE_TIMEOUT);
    }
  }
  logger.info(`Sent command ${command} : ${data}`);
};

/**
 * Returns the acknowledgement packet for a specified command number and packet number.
 *
 * @param commandType - command Number
 * @param packetNumber - packet Number
 * @return
 */
const ackData = (
  commandType: number,
  packetNumber: string,
  version: PacketVersion
) => {
  let usableConstants = constants.v1;
  let usableRadix = radix.v1;

  if (version === PacketVersionMap.v2) {
    usableConstants = constants.v2;
    usableRadix = radix.v2;
  }

  const { START_OF_FRAME } = usableConstants;

  const currentPacketNumber = intToUintByte(
    packetNumber,
    usableRadix.currentPacketNumber
  );

  const totalPacket = intToUintByte(0, usableRadix.totalPacket);
  const dataChunk = '00000000';
  const commData = currentPacketNumber + totalPacket + dataChunk;
  const crc = crc16(Buffer.from(commData, 'hex')).toString(16).padStart(4, '0');
  const temp = commData + crc;
  const stuffedData = byteStuffing(Buffer.from(temp, 'hex'), version).toString(
    'hex'
  );

  const commHeader =
    START_OF_FRAME +
    intToUintByte(commandType, usableRadix.commandType) +
    intToUintByte(stuffedData.length / 2, usableRadix.dataSize);

  return commHeader + stuffedData;
};

export { ackData, sendData };
