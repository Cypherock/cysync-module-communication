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
    hasSegwit: true,
    coinListId: 1,
    supportedVersions: [0]
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
    isTest: true,
    coinListId: 2,
    supportedVersions: [0]
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
    coinGeckoId: 'litecoin',
    coinListId: 3,
    supportedVersions: [0]
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
    coinGeckoId: 'dogecoin',
    coinListId: 4,
    supportedVersions: [0]
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
    coinGeckoId: 'dash',
    coinListId: 5,
    supportedVersions: [0]
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
    network: 'mainnet',
    coinListId: 7,
    supportedVersions: [0]
  })
};

export const SOLANACOINS: Record<string, NearCoinData> = {
  sol: new SolanaCoinData({
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
    supportedVersions: [0]
  })
};

const ERC20TOKENSLIST: Record<string, Erc20CoinData> = {};
const ERC20TOKENSLISTPOLYGON: Record<string, Erc20CoinData> = {};
const TOKENSLISTBSC: Record<string, Erc20CoinData> = {};
const TOKENSLISTFANTOM: Record<string, Erc20CoinData> = {};
const TOKENSLISTAVALANCHE: Record<string, Erc20CoinData> = {};
const TOKENSLISTETC: Record<string, Erc20CoinData> = {};
const TOKENSLISTHARMONY: Record<string, Erc20CoinData> = {};

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
    tokenList: ERC20TOKENSLIST,
    coinListId: 6,
    supportedVersions: [0]
  }),
  matic: new EthCoinData({
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
    tokenList: ERC20TOKENSLISTPOLYGON,
    coinListId: 8,
    supportedVersions: [0]
  }),
  bnb: new EthCoinData({
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
    tokenList: TOKENSLISTBSC,
    coinListId: 0xa,
    supportedVersions: [0]
  }),
  ftm: new EthCoinData({
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
    tokenList: TOKENSLISTFANTOM,
    coinListId: 0xb,
    supportedVersions: [0]
  }),
  avax: new EthCoinData({
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
    tokenList: TOKENSLISTAVALANCHE,
    coinListId: 0xc,
    supportedVersions: [0]
  }),
  one: new EthCoinData({
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
    tokenList: TOKENSLISTHARMONY,
    coinListId: 0xe,
    supportedVersions: [0]
  }),
  etc: new EthCoinData({
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
    tokenList: TOKENSLISTETC,
    coinListId: 0xf,
    supportedVersions: [0]
  })
};

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS,
  ...SOLANACOINS
};
