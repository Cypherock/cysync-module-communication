import { commands, constants } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { encodePacket, decodedPacket } from '../../xmodem';

import { DeviceConnectionInterface } from '../types';

export const writePacket = ({
  connection,
  packet,
  version,
  packetType
}: {
  connection: DeviceConnectionInterface;
  packet: string;
  sequenceNumber: number;
  packetType: number;
  version: PacketVersion;
}) => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  let usableConstants = constants.v3;
  const usableCommands = commands.v3;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  const waitForAck = packetType === usableCommands.PACKET_TYPE.CMD;

  /**
   * Be sure to remove all listeners and timeout.
   */
  return new Promise<void>((resolve, reject) => {
    let timeout: NodeJS.Timeout;

    function dataListener(ePacket: Buffer) {
      try {
        const packetList = decodedPacket(ePacket, version);

        let isSuccess = false;
        let error: Error | undefined;

        for (const packet of packetList) {
          switch (packet.packetType) {
            case usableCommands.PACKET_TYPE.ERROR:
              error = new DeviceError(DeviceErrorType.WRITE_REJECTED);
              break;
            case usableCommands.PACKET_TYPE.CMD_ACK:
              isSuccess = true;
              break;
          }

          if (error || isSuccess) break;
        }

        if (error || isSuccess) {
          if (timeout) {
            clearTimeout(timeout);
          }

          connection.removeListener('data', dataListener);
          connection.removeListener('close', onClose);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      } catch (error) {
        logger.error('Error while processing data from device');
        logger.error(error);
      }
    }

    function onClose(err: any) {
      if (timeout) {
        clearTimeout(timeout);
      }

      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);

      if (err) {
        logger.error(err);
      }

      reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
    }

    if (waitForAck) {
      connection.addListener('data', dataListener);
      connection.addListener('close', onClose);
    }

    connection
      .write(packet)
      .then(() => {
        if (!waitForAck) {
          resolve();
        }
      })
      .catch(error => {
        if (timeout) {
          clearTimeout(timeout);
        }
        connection.removeListener('data', dataListener);
        connection.removeListener('close', onClose);
        logger.error(error);
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
        return;
      });

    timeout = setTimeout(() => {
      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
    }, usableConstants.ACK_TIME);
  });
};

export const sendData = async ({
  connection,
  commandType,
  data,
  version,
  maxTries = 5,
  sequenceNumber,
  packetType
}: {
  connection: DeviceConnectionInterface;
  commandType: number;
  data: string;
  version: PacketVersion;
  sequenceNumber: number;
  packetType: number;
  maxTries?: number;
}) => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const packetsList = encodePacket({
    data,
    version,
    sequenceNumber,
    packetType
  });

  logger.info(
    `Sending command ${commandType} : containing ${packetsList.length} packets.`
  );

  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map(d => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      let _maxTries = maxTries;

      let firstError: Error | undefined;
      while (tries <= _maxTries) {
        try {
          await writePacket({
            connection,
            packet: d,
            version,
            sequenceNumber,
            packetType
          });
          resolve(true);
          return;
        } catch (e) {
          // Don't retry if connection closed
          if (e instanceof DeviceError) {
            if (
              [
                DeviceErrorType.CONNECTION_CLOSED,
                DeviceErrorType.CONNECTION_NOT_OPEN,
                DeviceErrorType.NOT_CONNECTED,
                DeviceErrorType.WRITE_REJECTED
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

  logger.info(`Sent command ${commandType} : ${data}`);
};
