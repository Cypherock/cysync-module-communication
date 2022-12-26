import { EthCoinData } from '../types/EthCoinData';

export const EthCoinMap = {
  ethereum: 'ethereum',
  polygon: 'polygon',
  binance: 'binance',
  fantom: 'fantom',
  avalanche: 'avalanche',
  harmony: 'harmony',
  'ethereum-c': 'ethereum-c'
} as const;

export const EthList = [
  new EthCoinData({
    id: EthCoinMap.ethereum,
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
    id: EthCoinMap.polygon,
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
    id: EthCoinMap.binance,
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
    id: EthCoinMap.fantom,
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
    id: EthCoinMap.avalanche,
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
    id: EthCoinMap.harmony,
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
    id: EthCoinMap['ethereum-c'],
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

export type EthIds = typeof EthCoinMap[keyof typeof EthCoinMap] | string;

export const ETHCOINS: Record<EthIds, EthCoinData> = EthList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {} as any
);
