import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { DeviceConnectionInterface } from '../types';

const ACK_PACKET = '18';
/*
 * Resolves to an error msg returned from device or undefined if successful,
 * throws error if unable to send packet.
 */
const writePacket = (
  connection: DeviceConnectionInterface,
  packet: any,
  options?: { timeout?: number }
): Promise<DeviceError | undefined> => {
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
      logger.info('Received data: ' + ePacketData);

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

    logger.info('Writing data: ' + packet);
    connection
      .write(packet)
      .then(() => {})
      .catch(err => {
        connection.removeListener('data', eListener);
        connection.removeListener('close', onClose);

        if (timeout) {
          clearTimeout(timeout);
        }

        reject(err);
      });

    timeout = setTimeout(() => {
      connection.removeListener('data', eListener);
      connection.removeListener('close', onClose);
      reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
    }, options?.timeout || 2000);
  });
};

export const sendBootloaderAbort = async (
  connection: DeviceConnectionInterface
) => {
  const packetsList = ['41'];
  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map((d: any, index: number) => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      const _maxTries = 5;
      let firstError: Error | undefined;
      while (tries <= _maxTries) {
        try {
          const errorMsg = await writePacket(
            connection,
            d,
            // Wait for 10 sec for the 1st packet ACK, there may be heavy processing task
            // in device after 1st packet.
            index === 0 ? { timeout: 10000 } : undefined
          );
          if (!errorMsg) {
            return resolve(true);
          } else {
            return reject(errorMsg);
          }
        } catch (e) {
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

          if (!firstError) {
            firstError = e as Error;
          }
          logger.warn('Error in sending data', e);
        }
        tries++;
      }
      if (firstError) {
        reject(firstError);
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
