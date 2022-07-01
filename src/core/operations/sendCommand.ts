import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { encodePacket, encodeRawData } from '../../xmodem';
import { DeviceConnectionInterface } from '../types';

import { waitForPacket } from './waitForPacket';

const writeCommand = async ({
  connection,
  packet,
  version,
  sequenceNumber
}: {
  connection: DeviceConnectionInterface;
  packet: string;
  version: PacketVersion;
  sequenceNumber: number;
}): Promise<void> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableCommands = commands.v3;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  return new Promise<void>(async (resolve, reject) => {
    const ackPromise = waitForPacket({
      connection,
      version,
      packetTypes: [usableCommands.PACKET_TYPE.CMD_ACK],
      sequenceNumber
    });

    connection
      .write(packet)
      .then(() => {})
      .catch(error => {
        logger.error(error);
        reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
        ackPromise.cancel();
        return;
      });

    ackPromise
      .then(() => {
        if (ackPromise.isCancelled()) {
          return;
        }

        resolve();
      })
      .catch(error => {
        if (ackPromise.isCancelled()) {
          return;
        }

        reject(error);
      });
  });
};

export const sendCommand = async ({
  connection,
  commandType,
  data,
  version,
  maxTries = 5,
  sequenceNumber
}: {
  connection: DeviceConnectionInterface;
  commandType: number;
  data: string;
  version: PacketVersion;
  sequenceNumber: number;
  maxTries?: number;
}): Promise<void> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableCommands = commands.v3;

  const packetsList = encodePacket({
    data: encodeRawData({ commandType, data }, version),
    version,
    sequenceNumber,
    packetType: usableCommands.PACKET_TYPE.CMD
  });

  logger.info(`Sending command ${commandType} : ${data}`);

  let firstError: Error | undefined;

  for (const packet of packetsList) {
    let tries = 1;
    const _maxTries = maxTries;
    firstError = undefined;
    let isSuccess = false;

    while (tries <= _maxTries && !isSuccess) {
      try {
        await writeCommand({
          connection,
          packet,
          version,
          sequenceNumber
        });
        isSuccess = true;
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
    }
  }

  logger.info(
    `Sent command ${commandType} : containing ${packetsList.length} packets.`
  );
};
