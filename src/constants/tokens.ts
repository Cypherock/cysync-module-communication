import { logger } from '../utils';

import erc20List from './erc20List.json';
import { CoinData } from './types/CoinData';
import { Erc20CoinData } from './types/Erc20CoinData';

export const getErc20Tokens = (parent: CoinData) => {
  const TOKENSLIST: Record<string, Erc20CoinData> = {};
  const tokensList: any = erc20List;

  for (const token of tokensList) {
    if (token.symbol.length <= 16 && token.platforms[parent.id]) {
      if (
        !token.platforms[parent.id].contract_address ||
        token.platforms[parent.id].decimal_place === undefined
      ) {
        logger.error({ token, parent });
        throw new Error('Missing token data');
      }

      const id = `${parent.id}:${token.id}`;
      TOKENSLIST[id] = new Erc20CoinData({
        id,
        parentId: parent.id,
        oldId: token.symbol.toLowerCase(),
        abbr: token.symbol.toLowerCase(),
        coinGeckoId: token.id,
        address: token.platforms[parent.id].contract_address,
        decimal: token.platforms[parent.id].decimal_place,
        name: token.name,
        validatorCoinName: parent.validatorCoinName,
        validatorNetworkType: parent.validatorNetworkType
      });
    }
  }
  return TOKENSLIST;
};
