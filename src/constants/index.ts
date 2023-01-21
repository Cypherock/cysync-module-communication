import {
  BitcoinAccountTypeDetails,
  BTCCOINS,
  BtcList,
  ETHCOINS,
  EthList,
  NEARCOINS,
  NearList,
  SolanaAccountTypeDetails,
  SOLANACOINS,
  SolanaList
} from './coins';
import { getErc20Tokens } from './tokens';
import { AbsCoinData } from './types';
import { CoinData } from './types/CoinData';

export * from './coins';
export * from './types';

export const verifyCoinIdUniqueness = () => {
  const coinIds = new Set<string>();
  const list = [...BtcList, ...EthList, ...NearList, ...SolanaList];
  for (const item of list) {
    if (coinIds.has(item.id)) {
      throw new Error('Duplicate coinId entry found: ' + item.id);
    }
    coinIds.add(item.id);
  }
};

// populate token list for the EVM chains
Object.keys(ETHCOINS).forEach(
  key => (ETHCOINS[key].tokenList = getErc20Tokens(ETHCOINS[key]))
);

verifyCoinIdUniqueness();

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS,
  ...SOLANACOINS
};

const generateTokenList = () => {
  let tokenList: Record<string, AbsCoinData> = {};
  Object.keys(COINS).forEach(
    key => (tokenList = { ...tokenList, ...COINS[key].tokenList })
  );
  return tokenList;
};
export const TOKENS: Record<string, AbsCoinData> = generateTokenList();

export const AccountTypeDetails = {
  ...BitcoinAccountTypeDetails,
  ...SolanaAccountTypeDetails
};
