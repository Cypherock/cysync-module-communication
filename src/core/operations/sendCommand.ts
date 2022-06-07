import { commands, constants } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { decodedPacket } from '../../xmodem';

import { DeviceConnectionInterface } from '../types';
import { sendData } from './sendData';

export const writeCommand = async ({
  connection,
  commandType,
  data,
  version,
  maxTries = 5,
  sequenceNumber,
  packetType,
  waitForPacketType
}: {
  connection: DeviceConnectionInterface;
  commandType: number;
  data: string;
  version: PacketVersion;
  sequenceNumber: number;
  packetType: number;
  waitForPacketType?: number;
  maxTries?: number;
}): Promise<{ data: string; commandType: number } | undefined> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  let usableConstants = constants.v3;
  const usableCommands = commands.v3;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  const dataList: string[] = [];
  let receivedCommandType = 0;

  return new Promise<{ data: string; commandType: number } | undefined>(
    async (resolve, reject) => {
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
              case waitForPacketType:
                if (packet.sequenceNumber === sequenceNumber) {
                  dataList[packet.currentPacketNumber] = packet.rawData;

                  if (packet.currentPacketNumber === packet.totalPacketNumber) {
                    isSuccess = true;
                    receivedCommandType = packet.commandType;
                  }
                }
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
              resolve({
                data: dataList.join(''),
                commandType: receivedCommandType
              });
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

      if (waitForPacketType) {
        connection.addListener('data', dataListener);
        connection.addListener('close', onClose);
      }

      sendData({
        connection,
        commandType,
        data,
        version,
        sequenceNumber,
        packetType,
        maxTries
      })
        .then(() => {
          if (!waitForPacketType) {
            resolve(undefined);
          }
        })
        .catch(error => {
          if (timeout) {
            clearTimeout(timeout);
          }

          connection.removeListener('data', dataListener);
          connection.removeListener('close', onClose);
          reject(error);
        });

      timeout = setTimeout(() => {
        connection.removeListener('data', dataListener);
        connection.removeListener('close', onClose);
        reject(new DeviceError(DeviceErrorType.WRITE_TIMEOUT));
      }, usableConstants.CMD_RESPONSE_TIME);
    }
  );
};

export const sendCommand = async ({
  connection,
  commandType,
  data,
  version,
  maxTries = 5,
  sequenceNumber,
  packetType,
  waitForPacketType
}: {
  connection: DeviceConnectionInterface;
  commandType: number;
  data: string;
  version: PacketVersion;
  sequenceNumber: number;
  packetType: number;
  waitForPacketType?: number;
  maxTries?: number;
}): Promise<{ data: string; commandType: number } | undefined> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  let tries = 1;
  let _maxTries = maxTries;

  let firstError: Error | undefined;

  while (tries <= _maxTries) {
    try {
      const response = await writeCommand({
        connection,
        commandType,
        data,
        version,
        maxTries,
        sequenceNumber,
        packetType,
        waitForPacketType
      });
      return response;
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
    throw firstError;
  } else {
    throw new DeviceError(DeviceErrorType.WRITE_TIMEOUT);
  }
};
