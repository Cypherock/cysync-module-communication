import { BtcCoinData } from './BtcCoinData';
import { CoinData } from './CoinData';
import { EthCoinData } from './EthCoinData';
import { NearCoinData } from './NearCoinData';
import { SolanaCoinData } from './SolanaCoinData';
import { getErc20Tokens } from './tokens';

const BtcList = [
  new BtcCoinData({
    id: 'bitcoin',
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
    supportedVersions: [0]
  }),
  new BtcCoinData({
    id: 'bitcoin-testnet',
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
    id: 'litecoin',
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
    id: 'dogecoin',
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
    id: 'dash',
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
];

const NearList = [
  new NearCoinData({
    id: 'near',
    oldId: 'near',
    abbr: 'near',
    name: 'Near',
    curve: 'ed25519',
    validatorCoinName: 'near',
    validatorNetworkType: 'prod',
    coinIndex: '8000018d',
    customCoinIndex: '80000007',
    decimal: 24,
    fees: 'TGas',
    coinGeckoId: 'near',
    isTest: false,
    network: 'mainnet',
    coinListId: 7,
    supportedVersions: [0]
  })
];

const SolList = [
  new SolanaCoinData({
    id: 'solana',
    oldId: 'sol',
    abbr: 'sol',
    name: 'Solana',
    curve: 'ed25519',
    validatorCoinName: 'sol',
    validatorNetworkType: 'prod',
    coinIndex: '800001f5',
    customCoinIndex: '80000009',
    decimal: 9,
    fees: 'SOL',
    coinGeckoId: 'solana',
    isTest: false,
    network: 'mainnet',
    coinListId: 9,
    supportedVersions: [0]
  })
];

const EthList = [
  new EthCoinData({
    id: 'ethereum',
    oldId: 'eth',
    abbr: 'eth',
    name: 'Ethereum',
    validatorCoinName: 'eth',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '80000005',
    decimal: 18,
    fees: 'Gwei',
    network: 'main',
    coinGeckoId: 'ethereum',
    chain: 1,
    coinListId: 6,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'polygon',
    oldId: 'matic',
    abbr: 'matic',
    name: 'Polygon',
    validatorCoinName: 'matic',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '80000008',
    decimal: 18,
    fees: 'Gwei',
    network: 'polygon',
    coinGeckoId: 'matic-network',
    chain: 137,
    coinListId: 8,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'binance',
    oldId: 'bnb',
    abbr: 'bnb',
    name: 'BNB Smart Chain (BSC)',
    validatorCoinName: 'bnb',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000A',
    decimal: 18,
    fees: 'Gwei',
    network: 'bsc',
    coinGeckoId: 'binancecoin',
    chain: 56,
    coinListId: 0xa,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'fantom',
    oldId: 'ftm',
    abbr: 'ftm',
    name: 'Fantom Opera',
    validatorCoinName: 'ftm',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000B',
    decimal: 18,
    fees: 'Gwei',
    network: 'fantom',
    coinGeckoId: 'fantom',
    chain: 250,
    coinListId: 0xb,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'avalanche',
    oldId: 'avax',
    abbr: 'avax',
    name: 'Avalanche Network',
    validatorCoinName: 'avax',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000C',
    decimal: 18,
    fees: 'NanoAvax',
    network: 'avalanche',
    coinGeckoId: 'avalanche-2',
    chain: 43114,
    coinListId: 0xc,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'harmony',
    oldId: 'one',
    abbr: 'one',
    name: 'Harmony',
    validatorCoinName: 'one',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000E',
    decimal: 18,
    fees: 'Gwei',
    network: 'harmony',
    coinGeckoId: 'harmony',
    chain: 1666600000,
    coinListId: 0xe,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: 'ethereum-c',
    oldId: 'etc',
    abbr: 'etc',
    name: 'Ethereum Classic',
    validatorCoinName: 'etc',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000F',
    decimal: 18,
    fees: 'Gwei',
    network: 'etc',
    coinGeckoId: 'ethereum-classic',
    chain: 61,
    coinListId: 0xf,
    supportedVersions: [0]
  })
];

export const BTCCOINS: Record<string, BtcCoinData> = BtcList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {}
);
export const ETHCOINS: Record<string, EthCoinData> = EthList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {}
);
export const NEARCOINS: Record<string, NearCoinData> = NearList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {}
);
export const SOLANACOINS: Record<string, NearCoinData> = SolList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {}
);

export const verifyCoinIdUniqueness = () => {
  // TODO: ensure the IDs are unique
};

// populate token list for the EVM chains
Object.keys(ETHCOINS).forEach(
  key => (ETHCOINS[key].tokenList = getErc20Tokens(ETHCOINS[key]))
);

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS,
  ...SOLANACOINS
};
