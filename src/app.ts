export * from './core';
export * from './bytes';
export * from './xmodem';
export * from './constants';
export * from './utils/versions';
export * from './errors';
export { logLevel } from './utils';

import { createPort } from './core/connection';
import { StatusData, RawData } from './xmodem';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
  const { connection } = await createPort();
  await connection.beforeOperation();
  await connection.selectPacketVersion();

  const sequenceNumber = connection.getNewSequenceNumber();

  await connection.sendCommand({ commandType: 70, data: '01', sequenceNumber });

  let response: StatusData | RawData | undefined;
  let isDone = false;

  while (!isDone) {
    response = await connection.getCommandOutput(sequenceNumber);
    console.log({ response });
    if (response.isRawData) {
      isDone = true;
    }
    await sleep(200);
  }
};

run();
