import { NearCoinData } from '../types/NearCoinData';

export const NearCoinMap = {
  near: 'near'
} as const;

export const NearList = [
  new NearCoinData({
    id: NearCoinMap.near,
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
] as const;

export type NearIds = typeof NearCoinMap[keyof typeof NearCoinMap] | string;

export const NEARCOINS: Record<NearIds, NearCoinData> = NearList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {} as any
);
