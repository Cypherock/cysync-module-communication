import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import {
  DecodedPacketData,
  decodePayloadData,
  decodeStatus,
  encodePacket,
  StatusData
} from '../../xmodem';
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
        if (!connection.isConnected()) {
          reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
        } else {
          reject(new DeviceError(DeviceErrorType.WRITE_ERROR));
        }
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

export const getStatus = async ({
  connection,
  version,
  maxTries = 5,
  logsDisabled = false
}: {
  connection: DeviceConnectionInterface;
  version: PacketVersion;
  maxTries?: number;
  logsDisabled?: boolean;
}): Promise<StatusData> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  if (!logsDisabled) logger.info('Getting status');

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
            DeviceErrorType.WRITE_REJECTED,
            DeviceErrorType.DEVICE_ABORT,
            DeviceErrorType.PROCESS_ABORTED_BY_USER
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

  const { rawData } = decodePayloadData(finalData, version);

  const status = decodeStatus(rawData, version);

  if (!logsDisabled) logger.info(status);

  return status;
};
