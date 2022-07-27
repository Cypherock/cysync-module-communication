import { AbsCoinData } from './AbsCoinData';
import { BtcCoinData } from './BtcCoinData';
import { CoinData } from './CoinData';
import { Erc20CoinData } from './Erc20CoinData';
import erc20List from './erc20List.json';
import { EthCoinData } from './EthCoinData';
import { NearCoinData } from './NearCoinData';

export const BTCCOINS: Record<string, BtcCoinData> = {
  btc: new BtcCoinData({
    abbr: 'btc',
    name: 'Bitcoin',
    validatorCoinName: 'btc',
    validatorNetworkType: 'prod',
    coinIndex: '80000000',
    customCoinIndex: '80000000',
    decimal: 8,
    fees: 'sat per byte',
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
    fees: 'sat per byte',
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
    fees: 'sat / byte'
  }),
  doge: new BtcCoinData({
    abbr: 'doge',
    name: 'Dogecoin',
    validatorCoinName: 'doge',
    validatorNetworkType: 'prod',
    coinIndex: '80000003',
    customCoinIndex: '80000003',
    decimal: 8,
    fees: 'sat per byte'
  }),
  dash: new BtcCoinData({
    abbr: 'dash',
    name: 'Dash',
    validatorCoinName: 'dash',
    validatorNetworkType: 'prod',
    coinIndex: '80000005',
    customCoinIndex: '80000004',
    decimal: 8,
    fees: 'sat / byte'
  })
};

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
    chain: 1
  }),
  ethr: new EthCoinData({
    abbr: 'ethr',
    name: 'Ethereum Ropsten',
    validatorCoinName: 'eth',
    validatorNetworkType: 'testnet',
    coinIndex: '8000003c',
    customCoinIndex: '80000006',
    decimal: 18,
    fees: 'Gwei',
    isTest: true,
    network: 'ropsten',
    chain: 3
  })
};

export const NEARCOINS: Record<string, NearCoinData> = {
  near: new NearCoinData({
    abbr: 'near',
    name: 'Near',
    curve: 'ed25519',
    validatorCoinName: 'near',
    validatorNetworkType: 'testnet',
    coinIndex: '8000018d',
    customCoinIndex: '80000007',
    decimal: 24,
    fees: 'Gwei',
    isTest: true,
    network: 'testnet'
  })
};

const ERC20TOKENSLIST: Record<string, Erc20CoinData> = {};

// This is the list of tokens that are supported by our PRICE API
const supportedCoinList = [
  'XRP',
  'BCH',
  'ADA',
  'XLM',
  'NEO',
  'EOS',
  'XEM',
  'IOTA',
  'XMR',
  'TRX',
  'ICX',
  'ETC',
  'QTUM',
  'BTG',
  'LSK',
  'USDT',
  'OMG',
  'ZEC',
  'SC',
  'ZRX',
  'REP',
  'WAVES',
  'MKR',
  'DCR',
  'BAT',
  'LRC',
  'KNC',
  'BNT',
  'LINK',
  'CVC',
  'STORJ',
  'ANT',
  'SNGLS',
  'MANA',
  'MLN',
  'DNT',
  'NMR',
  'DOT',
  'DAI',
  'UNI',
  'ATOM',
  'GRT',
  'XTZ',
  'FIL',
  'NANO',
  'WBTC',
  'BSV',
  'USDC',
  'OXT',
  'ALGO',
  'BAND',
  'BTT',
  'FET',
  'KAVA',
  'PAX',
  'PAXG',
  'REN',
  'AAVE',
  'YFI',
  'NU'
];

for (const token of erc20List) {
  // Only add if the token is supported by price API
  if (supportedCoinList.includes(token.abbr)) {
    ERC20TOKENSLIST[token.abbr.toLowerCase()] = new Erc20CoinData({
      abbr: token.abbr.toLowerCase(),
      address: token.address,
      decimal: token.decimal,
      name: token.name,
      validatorCoinName: 'eth',
      validatorNetworkType: 'prod'
    });
  }
}

export const ERC20TOKENS = ERC20TOKENSLIST;

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS
};

export const ALLCOINS: Record<string, AbsCoinData> = {
  ...COINS,
  ...ERC20TOKENS
};
