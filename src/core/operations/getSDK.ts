import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { DecodedPacketData, encodePacket } from '../../xmodem';
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
}): Promise<DecodedPacketData> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableCommands = commands.v3;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  return new Promise<DecodedPacketData>(async (resolve, reject) => {
    const ackPromise = waitForPacket({
      connection,
      version,
      packetTypes: [usableCommands.PACKET_TYPE.STATUS],
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
      .then(res => {
        if (ackPromise.isCancelled()) {
          return;
        }

        resolve(res);
      })
      .catch(error => {
        if (ackPromise.isCancelled()) {
          return;
        }

        reject(error);
      });
  });
};

const formatSDKVersion = (version: string) => {
  if (version.length < 12) {
    throw new Error('SDK version should be atleast 6 bytes.');
  }

  const major = parseInt(version.slice(0, 4), 16);
  const minor = parseInt(version.slice(4, 8), 16);
  const patch = parseInt(version.slice(8, 12), 16);

  return `${major}.${minor}.${patch}`;
};

export const getSDK = async ({
  connection,
  version,
  maxTries = 5
}: {
  connection: DeviceConnectionInterface;
  version: PacketVersion;
  maxTries?: number;
}): Promise<string> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  logger.info('Getting SDK');

  const usableCommands = commands.v3;

  const packetsList = encodePacket({
    data: '',
    version,
    sequenceNumber: -1,
    packetType: usableCommands.PACKET_TYPE.STATUS_REQ
  });

  if (packetsList.length === 0) {
    throw new Error('Cound not create packets');
  }

  if (packetsList.length > 1) {
    throw new Error('Status command has multiple packets');
  }

  let firstError: Error | undefined;

  let tries = 1;
  const _maxTries = maxTries;
  firstError = undefined;
  let isSuccess = false;
  let finalData = '';

  const packet = packetsList[0];
  while (tries <= _maxTries && !isSuccess) {
    try {
      const receivedPacket = await writeCommand({
        connection,
        packet,
        version,
        sequenceNumber: -1
      });
      logger.info('receivedPacket', { receivedPacket });
      finalData = receivedPacket.payloadData;
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

  const sdkVersion = formatSDKVersion(finalData);

  logger.info(sdkVersion);

  return sdkVersion;
};
