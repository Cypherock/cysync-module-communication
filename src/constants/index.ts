import {
  BTCCOINS,
  BtcList,
  ETHCOINS,
  EthList,
  NEARCOINS,
  NearList,
  SOLANACOINS,
  SolanaList
} from './coins';
import { getErc20Tokens } from './tokens';
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
