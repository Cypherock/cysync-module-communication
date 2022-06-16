export * from './core';
export * from './bytes';
export * from './xmodem';
export * from './constants';
export * from './utils/versions';
export * from './errors';
export { logLevel } from './utils';

import { createPort } from './core/connection';

const run = async () => {
  const { connection } = await createPort();
  const data = await connection.getStatus(-1);
  console.log({ data });
};

run();
