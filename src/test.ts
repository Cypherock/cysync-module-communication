import crypto from 'crypto';
import { getAvailableConnectionInfo } from './core/connection';
import { DeviceListener } from './core/listeners';

const totalTestCases = 5;

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

// function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

const run = async () => {
  const connectionInfo = await getAvailableConnectionInfo();
  console.log(connectionInfo);
  if (!connectionInfo) {
    throw new Error('No connection found');
  }

  const connection = new DeviceListener(connectionInfo.port.path);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < totalTestCases; i++) {
    try {
      const commandType = randomNumber(1, 100);
      const data = crypto.randomBytes(randomNumber(1, 1000)).toString('hex');
      console.log({ commandType, data });
      await connection.sendData(commandType, data);
      const recData = await connection.receiveData([commandType]);
      if (recData.data !== data) {
        throw new Error('Invalid data received');
      }
      totalSuccess++;
    } catch (error) {
      console.error(error);
      totalFailed++;
    }
  }

  console.log({ totalSuccess, totalFailed });
};

run();
