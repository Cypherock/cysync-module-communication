import { CoinData, ICoinDataOptions } from './CoinData';

export class BtcCoinData extends CoinData {
  constructor(coinData: ICoinDataOptions) {
    super({ ...coinData });
  }
}
