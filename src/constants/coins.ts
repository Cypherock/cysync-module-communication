import { BtcCoinData } from './BtcCoinData';
import { CoinData } from './CoinData';
import { Erc20CoinData } from './Erc20CoinData';
import erc20List from './erc20List.json';
import { EthCoinData } from './EthCoinData';
import { NearCoinData } from './NearCoinData';
import { SolanaCoinData } from './SolanaCoinData';

export const BTCCOINS: Record<string, BtcCoinData> = {
  btc: new BtcCoinData({
    abbr: 'btc',
    name: 'Bitcoin',
    validatorCoinName: 'btc',
    validatorNetworkType: 'prod',
    coinIndex: '80000000',
    customCoinIndex: '80000000',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'bitcoin',
    hasSegwit: true
  }),
  btct: new BtcCoinData({
    abbr: 'btct',
    name: 'Bitcoin Testnet',
    validatorCoinName: 'btc',
    validatorNetworkType: 'testnet',
    coinIndex: '80000001',
    customCoinIndex: '80000001',
    decimal: 8,
    fees: 'sat/byte',
    hasSegwit: true,
    isTest: true
  }),
  ltc: new BtcCoinData({
    abbr: 'ltc',
    name: 'Litecoin',
    validatorCoinName: 'ltc',
    validatorNetworkType: 'prod',
    coinIndex: '80000002',
    customCoinIndex: '80000002',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'litecoin'
  }),
  doge: new BtcCoinData({
    abbr: 'doge',
    name: 'Dogecoin',
    validatorCoinName: 'doge',
    validatorNetworkType: 'prod',
    coinIndex: '80000003',
    customCoinIndex: '80000003',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'dogecoin'
  }),
  dash: new BtcCoinData({
    abbr: 'dash',
    name: 'Dash',
    validatorCoinName: 'dash',
    validatorNetworkType: 'prod',
    coinIndex: '80000005',
    customCoinIndex: '80000004',
    decimal: 8,
    fees: 'sat/byte',
    coinGeckoId: 'dash'
  })
};

export const NEARCOINS: Record<string, NearCoinData> = {
  near: new NearCoinData({
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
    network: 'mainnet'
  })
};

export const SOLANACOINS: Record<string, NearCoinData> = {
  sol: new SolanaCoinData({
    abbr: 'sol',
    name: 'Solana',
    curve: 'ed25519',
    validatorCoinName: 'sol',
    validatorNetworkType: 'test',
    coinIndex: '800001f5',
    customCoinIndex: '80000009',
    decimal: 9,
    fees: 'SOL',
    coinGeckoId: 'solana',
    isTest: true,
    network: 'testnet'
  })
};

const ERC20TOKENSLIST: Record<string, Erc20CoinData> = {};

for (const token of erc20List) {
  if (token.symbol.length <= 16)
    ERC20TOKENSLIST[token.symbol.toLowerCase()] = new Erc20CoinData({
      abbr: token.symbol.toLowerCase(),
      coinGeckoId: token.id,
      address: token.address,
      decimal: token.decimal ?? 18,
      name: token.name,
      validatorCoinName: 'eth',
      validatorNetworkType: 'prod'
    });
}

export const ETHCOINS: Record<string, EthCoinData> = {
  eth: new EthCoinData({
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
    tokenList: ERC20TOKENSLIST
  })
};

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS,
  ...SOLANACOINS
};
