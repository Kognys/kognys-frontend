import { useState, useEffect } from "react";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
  });

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setWalletState({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
        });
        
        localStorage.setItem("kognys_user_id", accounts[0]);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setWalletState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
      });
      
      localStorage.setItem("kognys_user_id", accounts[0]);
    }
  };

  const handleDisconnect = () => {
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
    });
    
    localStorage.removeItem("kognys_user_id");
  };

  const connect = async (): Promise<string | null> => {
    if (!window.ethereum) {
      throw new Error("No wallet detected");
    }

    try {
      setWalletState(prev => ({ ...prev, isConnecting: true }));

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletState({
          address,
          isConnected: true,
          isConnecting: false,
        });
        
        localStorage.setItem("kognys_user_id", address);
        return address;
      }

      return null;
    } catch (error) {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  };

  const disconnect = () => {
    handleDisconnect();
  };

  return {
    ...walletState,
    connect,
    disconnect,
  };
}