import crypto from 'crypto';
import { createPort } from './core';

const totalTestCases = 10;

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
  const { connection } = await createPort();

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < totalTestCases; i++) {
    try {
      const commandType = randomNumber(10, 100);
      const data = crypto.randomBytes(randomNumber(1, 1000)).toString('hex');
      console.log({ commandType, data });
      await connection.sendData(commandType, data);
      if (randomNumber(0, 1) === 1) {
        await sleep(randomNumber(500, 1000));
      }
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
