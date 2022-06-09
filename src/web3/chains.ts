import { Chain } from '@usedapp/core'


const MoonbaseAlpha: Chain = {
  chainId: 1287,
  chainName: 'Moonbase Alpha',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0x0000000000000000000000000000000000000000',
  getExplorerAddressLink: (address: string) => `https://moonbase.moonscan.io/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://moonbase.moonscan.io/tx/${transactionHash}`,
  // Optional parameters:
  rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  blockExplorerUrl: 'https://moonbase.moonscan.io',
  nativeCurrency: {
    name: 'DEV coin',
    symbol: 'DEV',
    decimals: 18,
  }
}

const MoonbeamDev: Chain = {
  chainId: 1281,
  chainName: 'Moonbase Alpha',
  isTestChain: true,
  isLocalChain: true,
  multicallAddress: '0x0000000000000000000000000000000000000000',
  getExplorerAddressLink: (address: string) => `https://moonbase.moonscan.io/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://moonbase.moonscan.io/tx/${transactionHash}`,
}

const Localhost: Chain = {
  chainId: 31337,
  chainName: 'Localhost',
  isTestChain: true,
  isLocalChain: true,
  multicallAddress: '0x0000000000000000000000000000000000000000',
  getExplorerAddressLink: (address: string) => `http://localhost/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `http://localhost/tx/${transactionHash}`,
}


export { MoonbaseAlpha, MoonbeamDev, Localhost };
