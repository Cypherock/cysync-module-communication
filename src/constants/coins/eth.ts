import { EthCoinData } from '../types/EthCoinData';

export const EthCoinMap = {
  ethereum: 'ethereum',
  polygon: 'polygon',
  binance: 'binance',
  fantom: 'fantom',
  avalanche: 'avalanche',
  harmony: 'harmony', // deprecated
  'ethereum-c': 'ethereum-c', // deprecated
  arbitrum: 'arbitrum',
  optimism: 'optimism'
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
    name: 'Avalanche (C-Chain)',
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
    id: EthCoinMap.optimism,
    abbr: 'eth',
    name: 'Optimism',
    validatorCoinName: 'eth',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '8000000D',
    decimal: 18,
    fees: 'Gwei',
    network: 'optimism',
    coinGeckoId: 'ethereum',
    chain: 10,
    coinListId: 0x0d,
    supportedVersions: [0]
  }),
  new EthCoinData({
    id: EthCoinMap.arbitrum,
    abbr: 'eth',
    name: 'Arbitrum One',
    validatorCoinName: 'eth',
    validatorNetworkType: 'prod',
    coinIndex: '8000003c',
    customCoinIndex: '80000010',
    decimal: 18,
    fees: 'Gwei',
    network: 'arbitrum',
    coinGeckoId: 'ethereum',
    chain: 42161,
    coinListId: 0x10,
    supportedVersions: [0]
  })
];

export type EthIds = typeof EthCoinMap[keyof typeof EthCoinMap] | string;

export const ETHCOINS: Record<EthIds, EthCoinData | undefined> = EthList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {} as any
);
