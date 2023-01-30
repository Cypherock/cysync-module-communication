export interface IAbsCoinDataOptions {
  // Required details
  id: string; // Unique identifier for coins; TODO: add check for uniqueness
  parentId?: string; // Parent identifier used for tokens
  oldId?: string; // Old identifier for coins; (oldId <=> abbr <=> slug)
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
  // Id for supported coin list for device
  coinListId?: number;
  supportedVersions?: number[];
}

export abstract class AbsCoinData {
  // Required details
  public id: string;
  public parentId?: string;
  public oldId?: string;
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
  public coinListId?: number;
  public supportedVersions?: number[];

  constructor({
    id,
    parentId,
    oldId,
    abbr,
    validatorCoinName,
    validatorNetworkType,
    name,
    decimal,
    hasSegwit = false,
    isTest = false,
    group = CoinGroup.BitcoinForks,
    coinGeckoId,
    coinListId,
    supportedVersions
  }: IAbsCoinDataOptions) {
    this.id = id;
    this.parentId = parentId;
    this.oldId = oldId ?? '';
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
    this.coinListId = coinListId;
    this.supportedVersions = supportedVersions;
  }
}

export enum CoinGroup {
  BitcoinForks,
  Ethereum,
  ERC20Tokens,
  Near,
  Solana
}
