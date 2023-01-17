import { AccountType, BtcCoinData } from '../types';

const BitcoinAccountTypeList: AccountType[] = [
  {
    id: 'btc-native-segwit',
    name: 'Native Segwit',
    tag: 'Native Segwit',
    identifier: '0001',
    allowMultiple: true
  },
  {
    id: 'btc-legacy',
    name: 'Legacy',
    tag: 'Legacy',
    identifier: '0000',
    allowMultiple: true
  }
];

export const BitcoinAccountTypes = {
  nativeSegwit: 'btc-native-segwit',
  legacy: 'btc-legacy'
};

export const BitcoinAccountTypeDetails: Record<string, AccountType> =
  BitcoinAccountTypeList.reduce(
    (accumulator, element) => ({ ...accumulator, [element.id]: element }),
    {}
  );

export const BtcCoinMap = {
  bitcoin: 'bitcoin',
  bitcoinTestnet: 'bitcoin-testnet',
  dash: 'dash',
  dogecoin: 'dogecoin',
  litecoin: 'litecoin'
} as const;

export const BtcList = [
  new BtcCoinData({
    id: BtcCoinMap.bitcoin,
    oldId: 'btc',
    abbr: 'btc',
    name: 'Bitcoin',
    validatorCoinName: 'btc',
    validatorNetworkType: 'prod',
    coinIndex: '80000000',
    customCoinIndex: '80000000',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'bitcoin',
    hasSegwit: true,
    coinListId: 1,
    supportedVersions: [0],
    supportedAccountTypes: [
      BitcoinAccountTypeDetails[BitcoinAccountTypes.nativeSegwit],
      BitcoinAccountTypeDetails[BitcoinAccountTypes.legacy]
    ]
  }),
  new BtcCoinData({
    id: BtcCoinMap.bitcoinTestnet,
    oldId: 'btct',
    abbr: 'btct',
    name: 'Bitcoin Testnet',
    validatorCoinName: 'btc',
    validatorNetworkType: 'testnet',
    coinIndex: '80000001',
    customCoinIndex: '80000001',
    decimal: 8,
    fees: 'sat/byte',
    hasSegwit: true,
    isTest: true,
    coinListId: 2,
    supportedVersions: [0]
  }),
  new BtcCoinData({
    id: BtcCoinMap.litecoin,
    oldId: 'ltc',
    abbr: 'ltc',
    name: 'Litecoin',
    validatorCoinName: 'ltc',
    validatorNetworkType: 'prod',
    coinIndex: '80000002',
    customCoinIndex: '80000002',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'litecoin',
    coinListId: 3,
    supportedVersions: [0]
  }),
  new BtcCoinData({
    id: BtcCoinMap.dogecoin,
    oldId: 'doge',
    abbr: 'doge',
    name: 'Dogecoin',
    validatorCoinName: 'doge',
    validatorNetworkType: 'prod',
    coinIndex: '80000003',
    customCoinIndex: '80000003',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'dogecoin',
    coinListId: 4,
    supportedVersions: [0]
  }),
  new BtcCoinData({
    id: BtcCoinMap.dash,
    oldId: 'dash',
    abbr: 'dash',
    name: 'Dash',
    validatorCoinName: 'dash',
    validatorNetworkType: 'prod',
    coinIndex: '80000005',
    customCoinIndex: '80000004',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'dash',
    coinListId: 5,
    supportedVersions: [0]
  })
] as const;

export type BitcoinIds = typeof BtcCoinMap[keyof typeof BtcCoinMap] | string;

export const BTCCOINS: Record<BitcoinIds, BtcCoinData> = BtcList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {} as any
);
