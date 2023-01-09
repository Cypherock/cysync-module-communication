import { AccountType, SolanaCoinData } from '../types';

const SolanaAccountTypeList: AccountType[] = [
  {
    id: 'solana-2-depth',
    name: 'Paper',
    tag: 'Paper',
    identifier: '0001',
    allowMultiple: false
  },
  {
    id: 'solana-3-depth',
    name: 'Ledger',
    tag: 'Ledger',
    identifier: '0002',
    allowMultiple: true
  },
  {
    id: 'solana-4-depth',
    name: 'Phantom',
    tag: 'Phantom',
    identifier: '0003',
    allowMultiple: true
  }
];

export const SolanaAccountTypes = {
  base: 'solana-2-depth',
  ledger: 'solana-3-depth',
  phantom: 'solana-4-depth'
};

export const SolanaAccountTypeDetails: Record<string, AccountType> =
  SolanaAccountTypeList.reduce(
    (accumulator, element) => ({ ...accumulator, [element.id]: element }),
    {}
  );

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
      SolanaAccountTypeDetails[SolanaAccountTypes.base],
      SolanaAccountTypeDetails[SolanaAccountTypes.ledger],
      SolanaAccountTypeDetails[SolanaAccountTypes.phantom]
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
