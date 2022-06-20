import { AbsCoinData, coinGroup, IAbsCoinDataOptions } from './AbsCoinData';

export interface IErc20CoinDataOptions extends IAbsCoinDataOptions {
  address: string;
}

export class Erc20CoinData extends AbsCoinData {
  public address: string;

  constructor(coinData: IErc20CoinDataOptions) {
    super({ ...coinData, group:coinGroup.ERC20Tokens, hasSegwit: false });

    this.address = coinData.address;
  }
}
