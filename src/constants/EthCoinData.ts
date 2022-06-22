import { CoinGroup } from './AbsCoinData';
import { CoinData, ICoinDataOptions } from './CoinData';

export interface IEthCoinDataOptions extends ICoinDataOptions {
  network: string;
  chain: number;
}

export class EthCoinData extends CoinData {
  // For ETH Coins
  public network: string;
  public chain: number;

  constructor(coinData: IEthCoinDataOptions) {
    super({ ...coinData, group: CoinGroup.Ethereum, hasSegwit: false });

    this.network = coinData.network;
    this.chain = coinData.chain;

    this.coinIndex = coinData.coinIndex;
    this.fees = coinData.fees;
  }
}
