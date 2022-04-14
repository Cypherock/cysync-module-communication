import { DeviceError, DeviceErrorType } from '../errors';
import { logger } from '../utils';
import { stmXmodemEncode } from '../xmodem';

import { DeviceConnectionInterface } from './types';

const ACK_PACKET = '06';
const ERROR_CODES = [
  {
    code: '07',
    message: 'Limit exceeded'
  },
  {
    code: '08',
    message: 'Wrong firmware version'
  },
  {
    code: '09',
    message: 'Wrong hardware version'
  },
  {
    code: '0a',
    message: 'Wrong magic number'
  },
  {
    code: '0b',
    message: 'Signature not verified'
  }
];

/*
 * Resolves to an error msg returned from device or undefined if successful,
 * throws error if unable to send packet.
 */
const writePacket = (
  connection: DeviceConnectionInterface,
  packet: any,
  options?: { timeout?: number }
): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    /**
     * Ensure is listener is activated first before writing
     */
    let timeout: NodeJS.Timeout;

    if (!connection.isConnected()) {
      throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
    }

    const eListener = (ePacket: any) => {
      const ePacketData = ePacket.toString('hex');

      // When a error code is received, return the error
      for (const errorCode of ERROR_CODES) {
        if (ePacketData.includes(errorCode.code)) {
          resolve(errorCode.message);
          connection.removeListener('data', eListener);
          connection.removeListener('close', onClose);
          return;
        }
      }

      if (ePacketData.includes(ACK_PACKET)) {
        resolve(undefined);
        connection.removeListener('data', eListener);
        connection.removeListener('close', onClose);
      }
    };

    function onClose(err: any) {
      if (timeout) {
        clearTimeout(timeout);
      }

      connection.removeListener('ack', eListener);
      connection.removeListener('close', onClose);

      if (err) {
        logger.error(err);
      }

      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    connection.addListener('data', eListener);
    connection.addListener('close', onClose);

    connection
      .write(packet)
      .then(() => {})
      .catch(err => {
        reject(err);
      });

    timeout = setTimeout(() => {
      connection.removeListener('data', eListener);
      connection.removeListener('close', onClose);
      reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
    }, options?.timeout || 2000);
  });
};

export const stmUpdateSendData = async (
  connection: DeviceConnectionInterface,
  data: string
) => {
  const packetsList = stmXmodemEncode(data);
  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map((d: any, index: number) => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      let lastError: Error | undefined;
      while (tries <= 5) {
        try {
          const errorMsg = await writePacket(
            connection,
            d,
            // Wait for 10 sec for the 1st packet ACK, there may be heavy processing task
            // in device after 1st packet.
            index === 0 ? { timeout: 10000 } : undefined
          );
          if (!errorMsg) {
            resolve(true);
            return;
          } else {
            reject(errorMsg);
            return;
          }
        } catch (e) {
          lastError = e as Error;
          logger.warn('Error in sending data', e);
        }
        tries++;
      }
      if (lastError) {
        reject(lastError);
      } else {
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
      }
    };
  });

  for (const j of dataList) {
    try {
      await new Promise((res, rej) => {
        j(res, rej);
      });
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
};
