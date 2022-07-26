import { commands, constants } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import {
  DecodedPacketData,
  decodePacket,
  decodePayloadData,
  ErrorPacketRejectReason,
  RejectReasonToMsgMap
} from '../../xmodem';
import { DeviceConnectionInterface } from '../types';

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
  isCancelled: () => boolean;
}

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
              const latestSeqNumber = connection.getSequenceNumber();
              if (
                rejectStatus === ErrorPacketRejectReason.INVALID_SEQUENCE_NO &&
                latestSeqNumber !== sequenceNumber
              ) {
                error = new DeviceError(
                  DeviceErrorType.PROCESS_ABORTED_BY_USER
                );
                break;
              }

              let rejectReason: string;

              const _rejectReason =
                RejectReasonToMsgMap[rejectStatus as ErrorPacketRejectReason];

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

    if (!connection.isConnected()) {
      throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
    }

    connection.addListener('data', dataListener);
    connection.addListener('close', onClose);

    timeout = setTimeout(() => {
      connection.removeListener('data', dataListener);
      connection.removeListener('close', onClose);
      if (!connection.isConnected()) {
        reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
      } else {
        reject(new DeviceError(DeviceErrorType.READ_TIMEOUT));
      }
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
