import { DeviceError, DeviceErrorType } from '../../errors';
import { PacketVersion, PacketVersionMap } from '../../utils/versions';
import { RawData, StatusData, CmdState } from '../../xmodem';

import { DeviceConnectionInterface } from '../types';
import { getCommandOutput } from './getCommandOutput';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface IWaitForCommandOutputParams {
  connection: DeviceConnectionInterface;
  sequenceNumber: number;
  commandType: number;
  onStatus: (status: StatusData) => void;
  version: PacketVersion;
  maxTries?: number;
  options?: { interval?: number };
}

export const waitForCommandOutput = async ({
  connection,
  sequenceNumber,
  commandType,
  onStatus,
  options,
  version,
  maxTries = 5
}: IWaitForCommandOutputParams): Promise<RawData> => {
  if (version !== PacketVersionMap.v3) {
    throw new Error('Only v3 packets are supported');
  }

  let isExecutingCurrentCommand = false;
  // const startTime = new Date();

  while (true) {
    const response = await getCommandOutput({
      connection,
      version,
      maxTries,
      sequenceNumber
    });
    if (response.isRawData) {
      return response as RawData;
    }

    const status = response as StatusData;

    if (isExecutingCurrentCommand && status.cmdType !== commandType) {
      throw new DeviceError(
        DeviceErrorType.EXECUTING_OTHER_COMMAND,
        `The device is executing some other command with command type ${status.cmdType}`
      );
    }

    if (status.currentCmdSeq === sequenceNumber) {
      if (!isExecutingCurrentCommand && status.cmdType === commandType) {
        isExecutingCurrentCommand = true;
      }

      if (status.cmdState === CmdState.CMD_STATUS_EXECUTING) {
        onStatus(response as StatusData);
      }
    }

    await sleep(options?.interval || 200);
  }
};
