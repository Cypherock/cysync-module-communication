import { AbsCoinData, IAbsCoinDataOptions } from './AbsCoinData';

export interface ICoinDataOptions extends IAbsCoinDataOptions {
  customCoinIndex: string;
  coinIndex: string;
  fees: string;
}

export class CoinData extends AbsCoinData {
  // Custom coin index will be sent to device while adding coins
  public customCoinIndex: string;
  // The actual coin index for caculation purposes
  public coinIndex: string;
  public fees: string;

  constructor(coinData: ICoinDataOptions) {
    super(coinData);

    this.customCoinIndex = coinData.customCoinIndex;
    this.coinIndex = coinData.coinIndex;
    this.fees = coinData.fees;
  }
}
