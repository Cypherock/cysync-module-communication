import { commands, constants } from '../../config';
import { DeviceError, DeviceErrorType } from '../../errors';
import { logger } from '../../utils';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { decodedPacket, DecodedPacketData } from '../../xmodem';

import { DeviceConnectionInterface } from '../types';

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
  isCancelled: () => boolean;
}

// export default class Deferred<T> {
//   private res?: (value: T | PromiseLike<T>) => void;
//   private rej?: (reason?: any) => void;
//   private readonly promise: Promise<T>;

//   constructor() {
//     this.promise = new Promise((resolve, reject) => {
//       this.res = resolve;
//       this.rej = reject;
//     });
//   }

//   then(
//     onfulfilled?: (value: T) => T | PromiseLike<T>,
//     onrejected?: (reason: any) => PromiseLike<never>
//   ): Promise<T> {
//     return this.promise.then(onfulfilled, onrejected);
//   }

//   catch(onRejected?: (reason: any) => PromiseLike<never>): Promise<T> {
//     return this.promise.catch(onRejected);
//   }

//   resolve(value: T | PromiseLike<T>): void {
//     if (!this.res) {
//       throw new Error('Resolve is not defined');
//     }

//     return this.res(value);
//   }

//   reject(reason?: any): void {
//     if (!this.rej) {
//       throw new Error('Reject is not defined');
//     }
//     return this.rej(reason);
//   }
// }

// export class CancellablePromise<T> extends Deferred<T> {
//   public onCancel: (() => void) | undefined;
//   public isCancelled: boolean;

//   constructor(
//     executor: (
//       resolve: (value: T | PromiseLike<T>) => void,
//       reject: (reason?: any) => void
//     ) => void
//   ) {
//     super(executor);
//     this.isCancelled = false;
//   }

//   public cancel() {
//     if (!this.onCancel) {
//       throw new Error('Someone forgot to implement onCancel');
//     }
//     if (this.onCancel) {
//       this.isCancelled = true;
//       this.onCancel();
//     }
//   }
// }

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

  let usableConstants = constants.v3;
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
        const packetList = decodedPacket(ePacket, version);
        console.log({ ePacket, packetList });

        let isSuccess = false;
        let receivedPacket: DecodedPacketData | undefined = undefined;
        let error: Error | undefined;

        for (const packet of packetList) {
          if (packet.packetType === usableCommands.PACKET_TYPE.ERROR) {
            error = new DeviceError(DeviceErrorType.WRITE_REJECTED);
          } else if (
            packetTypes.includes(packet.packetType) &&
            sequenceNumber === packet.sequenceNumber
          ) {
            isSuccess = true;
            receivedPacket = packet;
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

// export const waitForPacket = ({
//   connection,
//   version,
//   packetTypes,
//   sequenceNumber
// }: {
//   connection: DeviceConnectionInterface;
//   sequenceNumber: number;
//   packetTypes: number[];
//   version: PacketVersion;
// }): Promise<{  }> => {
//   if (version !== PacketVersionMap.v3) {
//     throw new Error('Only v3 packets are supported');
//   }

//   let usableConstants = constants.v3;
//   const usableCommands = commands.v3;

//   if (!connection.isConnected()) {
//     throw new DeviceError(DeviceErrorType.CONNECTION_CLOSED);
//   }

//   const toReturn = {};
//   const signal = new Promise((resolve, reject) => {

//   })

//   /**
//    * Be sure to remove all listeners and timeout.
//    */
//   const promise = new Promise<DecodedPacketData>((resolve, reject) => {
//     let timeout: NodeJS.Timeout;

//     function dataListener(ePacket: Buffer) {
//       try {
//         const packetList = decodedPacket(ePacket, version);

//         let isSuccess = false;
//         let receivedPacket: DecodedPacketData | undefined = undefined;
//         let error: Error | undefined;

//         for (const packet of packetList) {
//           if (packet.packetType === usableCommands.PACKET_TYPE.ERROR) {
//             error = new DeviceError(DeviceErrorType.WRITE_REJECTED);
//           } else if (
//             packetTypes.includes(packet.packetType) &&
//             sequenceNumber === packet.sequenceNumber
//           ) {
//             isSuccess = true;
//             receivedPacket = packet;
//           }

//           if (error || isSuccess) break;
//         }

//         if (error || isSuccess) {
//           if (timeout) {
//             clearTimeout(timeout);
//           }

//           connection.removeListener('data', dataListener);
//           connection.removeListener('close', onClose);
//           if (error) {
//             return reject(error);
//           }

//           if (!receivedPacket) {
//             return reject(new Error('Did not find receivedPacket'));
//           }

//           return resolve(receivedPacket);
//         }
//       } catch (error) {
//         logger.error('Error while processing data from device');
//         logger.error(error);
//       }
//     }

//     function onClose(err: any) {
//       if (timeout) {
//         clearTimeout(timeout);
//       }

//       connection.removeListener('data', dataListener);
//       connection.removeListener('close', onClose);

//       if (err) {
//         logger.error(err);
//       }

//       reject(new DeviceError(DeviceErrorType.CONNECTION_CLOSED));
//     }

//     connection.addListener('data', dataListener);
//     connection.addListener('close', onClose);

//     timeout = setTimeout(() => {
//       connection.removeListener('data', dataListener);
//       connection.removeListener('close', onClose);
//       reject(new DeviceError(DeviceErrorType.READ_TIMEOUT));
//     }, usableConstants.ACK_TIME);
//   });
// };
