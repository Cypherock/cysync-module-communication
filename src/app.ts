export * from './core';
export * from './bytes';
export * from './xmodem';
export * from './constants';
export * from './utils/versions';
export * from './errors';
export { logLevel } from './utils';

import { createPort } from './core/connection';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
  const { connection } = await createPort();
  await connection.beforeOperation();
  console.log({ msg: 'Sending status command' });
  const status = await connection.getStatus();
  console.log({ status });
  const sequenceNumber = connection.getNewSequenceNumber();

  console.log({ msg: 'Sending command' });
  await connection.sendCommand({
    commandType: 87,
    data: '00',
    sequenceNumber
  });

  console.log({ msg: 'Sending status command 2' });
  const status2 = await connection.getStatus();
  console.log({ status2 });

  console.log({ msg: 'getting output' });
  const output = await connection.getCommandOutput(sequenceNumber);
  console.log({ output });

  await sleep(2000);

  console.log({ msg: 'Sending status command 3' });
  const status3 = await connection.getStatus();
  console.log({ status3 });

  console.log({ msg: 'getting output 2' });
  const output2 = await connection.getCommandOutput(sequenceNumber);
  console.log({ output2 });
};

run();
