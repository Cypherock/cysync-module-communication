import { intToUintByte } from '../../bytes';
import { commands } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import {
  encodePacket,
  decodeStatus,
  decodeRawData,
  DecodedPacketData,
  RawData,
  StatusData,
  decodePayloadData
} from '../../xmodem';
import { waitForPacket } from './receiveCommand';

import { DeviceConnectionInterface } from '../types';

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
      packetTypes: [
        usableCommands.PACKET_TYPE.CMD_OUTPUT,
        usableCommands.PACKET_TYPE.STATUS
      ],
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

export const getCommandOutput = async ({
  connection,
  version,
  maxTries = 5,
  sequenceNumber
}: {
  connection: DeviceConnectionInterface;
  version: PacketVersion;
  sequenceNumber: number;
  maxTries?: number;
}): Promise<StatusData | RawData> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableCommands = commands.v3;

  logger.info(`Trying to receive output.`);

  let firstError: Error | undefined;
  const dataList: string[] = [];

  let totalPackets = 1;
  let currentPacket = 1;
  let isStatusResponse = false;

  while (currentPacket <= totalPackets) {
    let tries = 1;
    let _maxTries = maxTries;
    firstError = undefined;
    let isSuccess = false;

    const packetsList = encodePacket({
      data: intToUintByte(currentPacket, 16),
      version,
      sequenceNumber,
      packetType: usableCommands.PACKET_TYPE.CMD_OUTPUT_REQ
    });

    if (packetsList.length > 1) {
      throw new Error('Get Command Output exceeded 1 packet limit');
    }

    const packet = packetsList[0];

    while (tries <= _maxTries && !isSuccess) {
      try {
        const receivedPacket = await writeCommand({
          connection,
          packet,
          version,
          sequenceNumber
        });
        console.log(receivedPacket);
        dataList[receivedPacket.currentPacketNumber - 1] =
          receivedPacket.payloadData;
        console.log(dataList);
        totalPackets = receivedPacket.totalPacketNumber;
        currentPacket++;
        isSuccess = true;
        isStatusResponse =
          receivedPacket.packetType === usableCommands.PACKET_TYPE.STATUS;
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

  const finalData = dataList.join('');

  const { rawData } = decodePayloadData(finalData, version);

  let output: StatusData | RawData;
  if (isStatusResponse) {
    output = decodeStatus(rawData, version);
  } else {
    output = decodeRawData(rawData, version);
  }

  logger.info('Cmd Output received from device', output);

  return output;
};
