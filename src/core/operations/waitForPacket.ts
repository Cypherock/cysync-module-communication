import { commands, constants } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import {
  DecodedPacketData,
  decodePacket,
  decodePayloadData
} from '../../xmodem';
import { DeviceConnectionInterface } from '../types';

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
  isCancelled: () => boolean;
}

enum ERROR_PACKET_REJECT_REASON {
  NO_ERROR = 0,
  CHECKSUM_ERROR = 1,
  BUSY_PREVIOUS_CMD = 2,
  OUT_OF_ORDER_CHUNK = 3,
  INVALID_CHUNK_COUNT = 4,
  INVALID_SEQUENCE_NO = 5,
  INVALID_PAYLOAD_LENGTH = 6,
  APP_BUFFER_BLOCKED = 7,
  NO_MORE_CHUNKS = 8,
  INVALID_PACKET_TYPE = 9,
  INVALID_CHUNK_NO = 10,
  INCOMPLETE_PACKET = 11
}

const REJECT_REASON_TO_MSG: Record<
  ERROR_PACKET_REJECT_REASON,
  string | undefined
> = {
  [ERROR_PACKET_REJECT_REASON.NO_ERROR]: 'No error',
  [ERROR_PACKET_REJECT_REASON.CHECKSUM_ERROR]: 'Checksum error',
  [ERROR_PACKET_REJECT_REASON.BUSY_PREVIOUS_CMD]:
    'Device is busy on previous command',
  [ERROR_PACKET_REJECT_REASON.OUT_OF_ORDER_CHUNK]: 'Chunk out of order',
  [ERROR_PACKET_REJECT_REASON.INVALID_CHUNK_COUNT]: 'Invalid chunk count',
  [ERROR_PACKET_REJECT_REASON.INVALID_SEQUENCE_NO]: 'Invalid sequence number',
  [ERROR_PACKET_REJECT_REASON.INVALID_PAYLOAD_LENGTH]: 'Invalid payload length',
  [ERROR_PACKET_REJECT_REASON.APP_BUFFER_BLOCKED]: 'Application buffer blocked',
  [ERROR_PACKET_REJECT_REASON.NO_MORE_CHUNKS]: 'No more chunks',
  [ERROR_PACKET_REJECT_REASON.INVALID_PACKET_TYPE]: 'Invalid packet type',
  [ERROR_PACKET_REJECT_REASON.INVALID_CHUNK_NO]: 'Invalid chunk number',
  [ERROR_PACKET_REJECT_REASON.INCOMPLETE_PACKET]: 'Incomplete packet'
};

export const waitForPacket = ({
  connection,
  version,
  packetTypes,
  sequenceNumber
}: {
  connection: DeviceConnectionInterface;
  sequenceNumber: number;
  packetTypes: number[];
  version: PacketVersion;
}): CancellablePromise<DecodedPacketData> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  const usableConstants = constants.v3;
  const usableCommands = commands.v3;

  if (!connection.isConnected()) {
    throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
  }

  let isCancelled = false;
  let onCancel = () => {};

  /**
   * Be sure to remove all listeners and timeout.
   */
  const promiseFunc = (
    resolve: (val: DecodedPacketData) => void,
    reject: (reason?: any) => void
  ) => {
    let timeout: NodeJS.Timeout;

    function dataListener(ePacket: Buffer) {
      try {
        const packetList = decodePacket(ePacket, version);

        let isSuccess = false;
        let receivedPacket: DecodedPacketData | undefined;
        let error: Error | undefined;

        for (const packet of packetList) {
          if (packet.errorList.length === 0) {
            if (packet.packetType === usableCommands.PACKET_TYPE.ERROR) {
              logger.warn('Error packet', packet);
              error = new DeviceError(DeviceErrorType.WRITE_REJECTED);

              const { rawData } = decodePayloadData(
                packet.payloadData,
                version
              );

              const rejectStatus = parseInt(`0x${rawData}`, 16);

              let rejectReason: string;

              const _rejectReason =
                REJECT_REASON_TO_MSG[
                  rejectStatus as ERROR_PACKET_REJECT_REASON
                ];

              if (_rejectReason) {
                rejectReason = _rejectReason;
              } else {
                rejectReason = `Unknown reject reason: ${rawData}`;
              }

              error.message = `The write packet operation was rejected by the device because: ${rejectReason}`;
            } else if (packetTypes.includes(packet.packetType)) {
              if (
                sequenceNumber === packet.sequenceNumber ||
                packet.packetType === usableCommands.PACKET_TYPE.STATUS
              ) {
                isSuccess = true;
                receivedPacket = packet;
              }
            }

            if (error || isSuccess) break;
          }
        }

        if (error || isSuccess) {
          if (timeout) {
            clearTimeout(timeout);
          }

          connection.removeListener('data', dataListener);
          connection.removeListener('close', onClose);
          if (error) {
            return reject(error);
          }

          if (!receivedPacket) {
            return reject(new Error('Did not find receivedPacket'));
          }

          return resolve(receivedPacket);
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

    connection.addListener('data', dataListener);
    connection.addListener('close', onClose);

    timeout = setTimeout(() => {
      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      reject(new DeviceError(DeviceErrorType.READ_TIMEOUT));
    }, usableConstants.ACK_TIME);

    onCancel = () => {
      isCancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }

      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      reject(new Error('Cancelled'));
    };
  };

  const promise = new Promise<DecodedPacketData>(promiseFunc);
  const cancelablePromise = Object.assign(promise, {
    cancel: onCancel,
    isCancelled: () => isCancelled
  });

  return cancelablePromise;
};
