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
  executingCommandTypes: number[];
  expectedCommandTypes: number[];
  onStatus: (status: StatusData) => void;
  version: PacketVersion;
  maxTries?: number;
  options?: { interval?: number };
}

export const waitForCommandOutput = async ({
  connection,
  sequenceNumber,
  executingCommandTypes,
  expectedCommandTypes,
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
      const resp = response as RawData;
      if (
        expectedCommandTypes.length > 0 &&
        !expectedCommandTypes.includes(resp.commandType)
      ) {
        throw new Error(
          `Invalid commandType. Expected commandTypes: ${expectedCommandTypes.join(
            ','
          )}`
        );
      }
      return resp;
    }

    const status = response as StatusData;

    if (
      isExecutingCurrentCommand &&
      executingCommandTypes.length > 0 &&
      !executingCommandTypes.includes(status.cmdType)
    ) {
      throw new DeviceError(
        DeviceErrorType.EXECUTING_OTHER_COMMAND,
        `The device is executing some other command with command type ${status.cmdType}`
      );
    }

    if (status.currentCmdSeq === sequenceNumber) {
      if (
        !isExecutingCurrentCommand &&
        executingCommandTypes.length > 0 &&
        executingCommandTypes.includes(status.cmdType)
      ) {
        isExecutingCurrentCommand = true;
      }

      if (status.cmdState === CmdState.CMD_STATUS_EXECUTING) {
        onStatus(response as StatusData);
      }
    }

    await sleep(options?.interval || 200);
  }
};
