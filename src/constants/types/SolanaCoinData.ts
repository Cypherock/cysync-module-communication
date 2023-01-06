import { CoinGroup } from './AbsCoinData';
import { AccountType, CoinData, ICoinDataOptions } from './CoinData';

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

const SolanaAccountTypeList: AccountType[] = [
  {
    id: 'solana-base',
    name: 'Solana Base',
    tag: 'Solana Base',
    identifier: '0001'
  },
  {
    id: 'type1',
    name: 'Type 1',
    tag: 'Type 1',
    identifier: '0002'
  },
  {
    id: 'type2',
    name: 'Type 2',
    tag: 'Type 2',
    identifier: '0003'
  }
];

export const SolanaAccountTypes = {
  solanaBase: 'solana-base',
  type1: 'type1',
  type2: 'type2'
};

export const SolanaAccountTypeDetails: Record<string, AccountType> =
  SolanaAccountTypeList.reduce(
    (accumulator, element) => ({ ...accumulator, [element.id]: element }),
    {}
  );
