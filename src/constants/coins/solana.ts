import {
  SolanaAccountTypeDetails,
  SolanaAccountTypes,
  SolanaCoinData
} from '../types/SolanaCoinData';

export const SolanaCoinMap = {
  solana: 'solana'
} as const;

export const SolanaList = [
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
    supportedVersions: [0],
    supportedAccountTypes: [
      SolanaAccountTypeDetails[SolanaAccountTypes.solanaBase],
      SolanaAccountTypeDetails[SolanaAccountTypes.type1],
      SolanaAccountTypeDetails[SolanaAccountTypes.type2]
    ]
  })
];

export type SolanaIds =
  | typeof SolanaCoinMap[keyof typeof SolanaCoinMap]
  | string;

export const SOLANACOINS: Record<SolanaIds, SolanaCoinData> = SolanaList.reduce(
  (accumulator, element) => ({ ...accumulator, [element.id]: element }),
  {} as any
);
