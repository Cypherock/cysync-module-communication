import { coinGroup } from './AbsCoinData';
import { CoinData, ICoinDataOptions } from './CoinData';

export interface INearCoinDataOptions extends ICoinDataOptions {
  network: string;
  curve: string;
}

export class NearCoinData extends CoinData {
  //For Near Coin
  public network: string;
  public curve: string;

  constructor(coinData: INearCoinDataOptions) {
    super({ ...coinData, group: coinGroup.Near, hasSegwit: false });

    this.network = coinData.network;
    this.curve = coinData.curve;

    this.coinIndex = coinData.coinIndex;
    this.fees = coinData.fees;
  }
}
