import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { commands, constants } from '../../config';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { xmodemEncode } from '../../xmodem';
import { DeviceConnectionInterface, PacketData } from './types';

/**
 * Writes the packet to the SerialPort on the given connection,
 * and rejects the promise if there is no acknowledgment from the device
 *
 *
 * @param connection - SerialPort connection instance
 * @param packet - packet to send to the hardware
 * @return
 */
export const writePacket = (
  connection: DeviceConnectionInterface,
  packet: any,
  version: PacketVersion
) => {
  let usableConstants = constants.v1;
  const usableCommands = commands.v1;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  if (version === PacketVersionMap.v2) {
    usableConstants = constants.v2;
  }

  /**
   * Be sure to remove all listeners and timeout.
   */
  return new Promise<void>((resolve, reject) => {
    let timeout: NodeJS.Timeout;

    function dataListener(ePacket: PacketData) {
      if (timeout) {
        clearTimeout(timeout);
      }
      connection.removeListener('ack', dataListener);
      connection.removeListener('close', onClose);

      if (ePacket.commandType === usableCommands.ACK_PACKET) {
        resolve();
      } else if (ePacket.commandType === usableCommands.NACK_PACKET) {
        logger.warn("Received NACK");
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
      }
    }

    function onClose(err: any) {
      if (timeout) {
        clearTimeout(timeout);
      }

      connection.removeListener('ack', dataListener);
      connection.removeListener('close', onClose);

      if (err) {
        logger.error(err);
      }

      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    connection.addListener('ack', dataListener);
    connection.addListener('close', onClose);

    connection.connection.write(Buffer.from(packet, 'hex'), (err: any) => {
      if (err) {
        if (timeout) {
          clearTimeout(timeout);
        }
        connection.removeListener('ack', dataListener);
        connection.removeListener('close', onClose);
        logger.error(err);
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
        return;
      }
    });

    timeout = setTimeout(() => {
      connection.removeListener('ack', dataListener);
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
export const sendData = async (
  connection: DeviceConnectionInterface,
  command: number,
  data: string,
  version: PacketVersion,
  maxTries = 5
) => {
  const packetsList = xmodemEncode(data, command, version);
  console.log(packetsList);
  logger.info(
    `Sending command ${command} : containing ${packetsList.length} packets.`
  );
  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map((d, i) => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      let _maxTries = maxTries;
      if (command === 255) _maxTries = 1;

      let lastError: Error | undefined;
      while (tries <= _maxTries) {
        try {
          console.log("\tSending packet: " + i)
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
