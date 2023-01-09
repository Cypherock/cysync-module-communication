import { CoinGroup } from './AbsCoinData';
import { CoinData, ICoinDataOptions } from './CoinData';

export interface ISolanaCoinDataOptions extends ICoinDataOptions {
  network: string;
  curve: string;
}

export class SolanaCoinData extends CoinData {
  public network: string;
  public curve: string;

  constructor(coinData: ISolanaCoinDataOptions) {
    super({ ...coinData, group: CoinGroup.Solana, hasSegwit: false });

    this.network = coinData.network;
    this.curve = coinData.curve;

    this.coinIndex = coinData.coinIndex;
    this.fees = coinData.fees;
  }
}
