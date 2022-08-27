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
  group?: CoinGroup;
  hasSegwit?: boolean;

  // coinGeckoApi
  coinGeckoId?: string;
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
  public group: CoinGroup;
  public hasSegwit: boolean;
  public coinGeckoId: string | undefined;

  constructor({
    abbr,
    validatorCoinName,
    validatorNetworkType,
    name,
    decimal,
    hasSegwit = false,
    isTest = false,
    group = CoinGroup.BitcoinForks,
    coinGeckoId
  }: IAbsCoinDataOptions) {
    this.abbr = abbr;
    this.validatorCoinName = validatorCoinName;
    this.validatorNetworkType = validatorNetworkType;
    this.name = name;
    this.decimal = decimal;
    this.multiplier = Math.pow(10, decimal);

    this.hasSegwit = hasSegwit;
    this.isTest = isTest;
    this.group = group;
    this.coinGeckoId = coinGeckoId;
  }
}

export enum CoinGroup {
  BitcoinForks,
  Ethereum,
  ERC20Tokens,
  Near
}
