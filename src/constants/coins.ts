import { BtcCoinData } from './BtcCoinData';
import { CoinData } from './CoinData';
import { Erc20CoinData } from './Erc20CoinData';
import erc20List from './erc20List.json';
import erc20ListRopsten from './erc20ListRopsten.json';
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
    fees: 'sat/byte',
    id: 'bitcoin',
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
    id: 'litecoin'
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
    id: 'dogecoin'
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
    id: 'dash'
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
    fees: 'TGas',
    id: 'near',
    isTest: true,
    network: 'testnet'
  })
};

const ERC20TOKENSLIST: Record<string, Erc20CoinData> = {};
const ERC20TOKENSLISTROPSTEN: Record<string, Erc20CoinData> = {};

for (const token of erc20List) {
  ERC20TOKENSLIST[token.symbol.toLowerCase()] = new Erc20CoinData({
    abbr: token.symbol.toLowerCase(),
    id: token.id,
    address: token.address,
    decimal: token.decimal ?? 18,
    name: token.name,
    validatorCoinName: 'eth',
    validatorNetworkType: 'prod'
  });
}

for (const token of erc20ListRopsten) {
  ERC20TOKENSLISTROPSTEN[token.abbr.toLowerCase()] = new Erc20CoinData({
    abbr: token.abbr.toLowerCase(),
    id: token.abbr.toLowerCase(),
    address: token.address,
    decimal: token.decimal,
    name: token.name,
    isTest: true,
    validatorCoinName: 'ethr',
    validatorNetworkType: 'testnet'
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
    id: 'ethereum',
    chain: 1,
    tokenList: ERC20TOKENSLIST
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
    chain: 3,
    tokenList: ERC20TOKENSLISTROPSTEN
  })
};

export const COINS: Record<string, CoinData> = {
  ...BTCCOINS,
  ...ETHCOINS,
  ...NEARCOINS
};
