import { AbsCoinData, IAbsCoinDataOptions } from './AbsCoinData';

export interface IErc20CoinDataOptions extends IAbsCoinDataOptions {
  address: string;
}

export class Erc20CoinData extends AbsCoinData {
  public address: string;

  constructor(coinData: IErc20CoinDataOptions) {
    super({ ...coinData, isEth: false, isErc20Token: true, hasSegwit: false });

    this.address = coinData.address;
  }
}
