import { CoinGroup } from './AbsCoinData';
import { CoinData, ICoinDataOptions } from './CoinData';
import { Erc20CoinData } from './Erc20CoinData';

export interface IEthCoinDataOptions extends ICoinDataOptions {
  network: string;
  chain: number;
  erc20TokensList: Record<string, Erc20CoinData>;
}

export class EthCoinData extends CoinData {
  // For ETH Coins
  public network: string;
  public chain: number;
  public erc20TokensList: Record<string, Erc20CoinData> = {};

  constructor(coinData: IEthCoinDataOptions) {
    super({ ...coinData, group: CoinGroup.Ethereum, hasSegwit: false });

    this.network = coinData.network;
    this.chain = coinData.chain;

    this.coinIndex = coinData.coinIndex;
    this.fees = coinData.fees;
    this.erc20TokensList = coinData.erc20TokensList;
  }
}
