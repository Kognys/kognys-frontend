import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Loader2, Wallet } from "lucide-react";
import { MetaMaskIcon, GenericWalletIcon } from "@/components/icons/WalletIcons";

interface WalletLoginModalProps {
  isOpen: boolean;
  onWalletConnected: (address: string) => void;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export function WalletLoginModal({ isOpen, onWalletConnected }: WalletLoginModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (walletName: string) => {
    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask or another Web3 wallet.");
      return;
    }

    try {
      setIsConnecting(true);
      setConnectingWallet(walletName);
      setError(null);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        onWalletConnected(accounts[0]);
      }
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      if (err.code === 4001) {
        setError("Connection rejected. Please try again and approve the connection.");
      } else if (err.code === -32002) {
        setError("Connection request already pending. Please check your wallet.");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      description: "Most popular Ethereum wallet",
      icon: MetaMaskIcon,
      isDetected: window.ethereum?.isMetaMask,
    },
    {
      id: "browser",
      name: "Browser Wallet",
      description: "Any injected wallet (Rainbow, Coinbase, etc.)",
      icon: GenericWalletIcon,
      isDetected: !!window.ethereum,
    },
  ];

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-lg" hideClose>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold">Welcome to Kognys</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Connect your wallet to save your chats in the platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}


          <div className="space-y-3">
            {walletOptions.map((wallet) => {
              const IconComponent = wallet.icon;
              const isConnectingThis = connectingWallet === wallet.id;
              
              return (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className="group relative h-auto w-full p-0 hover:bg-background hover:text-foreground before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-transparent hover:before:bg-orange-500 before:transition-colors before:duration-150"
                  onClick={() => connectWallet(wallet.id)}
                  disabled={isConnecting}
                >
                  <div className="flex w-full items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                      {wallet.id === "metamask" ? (
                        <IconComponent className="h-8 w-8" />
                      ) : (
                        <IconComponent className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {wallet.name}
                        </span>
                        {wallet.isDetected && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Detected
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {wallet.description}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {isConnectingThis ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {isConnecting && (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to {connectingWallet}...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}