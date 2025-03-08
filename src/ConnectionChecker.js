import React, { useEffect, useState } from 'react';
import { useWeb3 } from './contexts/Web3Context';

function ConnectionChecker() {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const { account } = useWeb3();
  const walletConnected = !!account;

  useEffect(() => {
    // Check if MetaMask is installed
    setIsMetaMaskInstalled(typeof window.ethereum !== 'undefined');
  }, []);

  return (
    <div className="connection-status">
      {!isMetaMaskInstalled ? (
        <p>MetaMask is not installed. Please install MetaMask to use this app.</p>
      ) : (
        <p>MetaMask Status: {walletConnected ? 'Connected' : 'Not Connected'}</p>
      )}
    </div>
  );
}

export default ConnectionChecker;