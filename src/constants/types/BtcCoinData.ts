import { AccountType, CoinData, ICoinDataOptions } from './CoinData';

export class BtcCoinData extends CoinData {
  constructor(coinData: ICoinDataOptions) {
    super({ ...coinData });
  }
}

const BitcoinAccountTypeList: AccountType[] = [
  {
    id: 'native-segwit',
    name: 'Native Segwit',
    tag: 'Native Segwit',
    identifier: '0001'
  },
  {
    id: 'legacy',
    name: 'Legacy',
    tag: 'Legacy',
    identifier: '0000'
  }
];

export const BitcoinAccountTypes = {
  nativeSegwit: 'native-segwit',
  legacy: 'legacy'
};

export const BitcoinAccountTypeDetails: Record<string, AccountType> =
  BitcoinAccountTypeList.reduce(
    (accumulator, element) => ({ ...accumulator, [element.id]: element }),
    {}
  );
