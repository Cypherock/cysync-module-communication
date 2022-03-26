export interface IAbsCoinDataOptions {
  // Required details
  abbr: string;
  name: string;

  // This is for address validation
  validatorCoinName: string;
  validatorNetworkType: string;

  // This is the number of digits, ex: 8 for BTC
  decimal: number;

  // Details about the type of coin
  isTest?: boolean;
  isEth?: boolean;
  isErc20Token?: boolean;
  hasSegwit?: boolean;
}

export abstract class AbsCoinData {
  // Required details
  public abbr: string;
  public validatorCoinName: string;
  public validatorNetworkType: string;
  public name: string;

  // This is the number of digits, ex: 8 for BTC
  public decimal: number;

  // This is the multiplier derived from decimal , ex: 100000000 for BTC
  public multiplier: number;

  // Details about the type of coin
  public isTest: boolean;
  public isEth: boolean;
  public isErc20Token: boolean;
  public hasSegwit: boolean;

  constructor({
    abbr,
    validatorCoinName,
    validatorNetworkType,
    name,
    decimal,
    hasSegwit = false,
    isTest = false,
    isEth = false,
    isErc20Token = false
  }: IAbsCoinDataOptions) {
    this.abbr = abbr;
    this.validatorCoinName = validatorCoinName;
    this.validatorNetworkType = validatorNetworkType;
    this.name = name;
    this.decimal = decimal;
    this.multiplier = Math.pow(10, decimal);

    this.hasSegwit = hasSegwit;
    this.isEth = isEth;
    this.isTest = isTest;
    this.isErc20Token = isErc20Token;
  }
}
