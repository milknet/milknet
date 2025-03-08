import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import MilkNetABI from '../utils/MilkNetABI.json';

const Web3Context = createContext();

const NETWORK_CONFIG = {
  11155111: { name: 'Sepolia', contractAddress: process.env.REACT_APP_SEPOLIA_CONTRACT_ADDRESS },
  4202: { name: 'LISK Testnet', contractAddress: process.env.REACT_APP_LISK_CONTRACT_ADDRESS }
};

const NETWORK_DETAILS = {
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },
  4202: {
    chainId: '0x106a',
    chainName: 'Lisk Testnet',
    nativeCurrency: { name: 'Lisk', symbol: 'LSK', decimals: 18 },
    rpcUrls: ['https://testnet-rpc.lisk.com'],
    blockExplorerUrls: ['https://testnet-explorer.lisk.com']
  }
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [networkError, setNetworkError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const disconnectWallet = () => {
    setAccount('');
    setContract(null);
    setNetworkName('');
    setNetworkError(null);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed!');
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await initWeb3(provider);
    } catch (error) {
      console.error('User rejected connection:', error);
      throw error;
    }
  };

  const initWeb3 = useCallback(async (provider) => {
    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const config = NETWORK_CONFIG[chainId];

      if (!config) {
        throw new Error(`Unsupported network: ${network.name || chainId}`);
      }

      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(config.contractAddress, MilkNetABI, signer);
      const batchCount = await contractInstance.batchCounter();
      console.log('Contract connection verified. Total batches:', batchCount.toString());

      setContract(contractInstance);
      setNetworkName(config.name);
      setNetworkError(null);
    } catch (error) {
      console.error('Web3 initialization failed:', error);
      setContract(null);
      setNetworkName('');
      throw new Error(`Failed to initialize Web3: ${error.message}`);
    }
  }, []);

  const switchNetwork = async (targetNetworkId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetworkId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        const networkDetails = NETWORK_DETAILS[targetNetworkId];
        if (!networkDetails) {
          throw new Error(`Network details not found for chainId: ${targetNetworkId}`);
        }
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkDetails],
          });
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkDetails.chainId }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch network:', error);
        throw error;
      }
    }
  };

  const registerUser = async (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  useEffect(() => {
    const handleChainChanged = (chainIdHex) => {
      const allowedChainIds = ['0xaa36a7', '0x106a'];
      if (!allowedChainIds.includes(chainIdHex)) {
        setNetworkError('Unsupported network. Please switch to Sepolia or Lisk Testnet.');
        setContract(null);
      } else {
        setNetworkError(null);
        const provider = new ethers.BrowserProvider(window.ethereum);
        initWeb3(provider).catch((err) => {
          console.error('Web3 reinitialization error:', err);
          setNetworkError(err.message);
        });
      }
    };

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || '');
      if (accounts[0]) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        initWeb3(provider).catch((err) => {
          console.error('Web3 reinitialization error:', err);
          setNetworkError(err.message);
        });
      }
    };

    window.ethereum?.on('chainChanged', handleChainChanged);
    window.ethereum?.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [initWeb3]);

  useEffect(() => {
    const checkPaused = async () => {
      if (contract) {
        const paused = await contract.paused();
        setIsPaused(paused);
      }
    };
    checkPaused();
  }, [contract]);

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        networkName,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        networkError,
        userRole,
        registerUser,
        isPaused
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}