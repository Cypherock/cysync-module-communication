import erc20List from './erc20List.json';
import { CoinData } from './types/CoinData';
import { Erc20CoinData } from './types/Erc20CoinData';

export const getErc20Tokens = (parent: CoinData) => {
  const TOKENSLIST: Record<string, Erc20CoinData> = {};
  let tokensList: any[];

  switch (parent.id) {
    case 'ethereum':
      tokensList = erc20List;
      break;
    default:
      tokensList = [];
  }

  for (const token of tokensList) {
    if (token.symbol.length <= 16) {
      const id = `${parent.id}:${token.id}`;
      TOKENSLIST[id] = new Erc20CoinData({
        id,
        parentId: parent.id,
        oldId: token.symbol.toLowerCase(),
        abbr: token.symbol.toLowerCase(),
        coinGeckoId: token.id,
        address: token.address,
        decimal: token.decimal ?? 18,
        name: token.name,
        validatorCoinName: parent.validatorCoinName,
        validatorNetworkType: parent.validatorNetworkType
      });
    }
  }
  return TOKENSLIST;
};
