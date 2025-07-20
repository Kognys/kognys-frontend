import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Loader2, Wallet } from "lucide-react";
import { MetaMaskIcon, GenericWalletIcon } from "@/components/icons/WalletIcons";

interface WalletLoginModalProps {
  isOpen: boolean;
  onWalletConnected: (address: string) => void;
  onSkip: () => void;
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

export function WalletLoginModal({ isOpen, onWalletConnected, onSkip }: WalletLoginModalProps) {
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
      <DialogContent className="w-[95vw] max-w-lg" hideClose>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Welcome to Kognys</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Connect your wallet to register your user in Kognys
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2 sm:space-y-3">
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
                  <div className="flex w-full items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                      {wallet.id === "metamask" ? (
                        <IconComponent className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : (
                        <IconComponent className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {wallet.name}
                        </span>
                        {wallet.isDetected && (
                          <span className="rounded-full bg-green-100 px-1.5 sm:px-2 py-0.5 text-xs font-medium text-green-700 whitespace-nowrap">
                            Detected
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {wallet.description}
                      </div>
                    </div>
                    
                    <div className="flex items-center flex-shrink-0">
                      {isConnectingThis ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {isConnecting && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs sm:text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to {connectingWallet}...</span>
            </div>
          )}

          <div className="pt-4 sm:pt-6 border-t">
            <div className="text-center space-y-2 sm:space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                ⚠️ Without a wallet, your chats may be lost when you close the browser
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className="bg-yellow-300 border-yellow-400 text-yellow-900 hover:bg-yellow-400 hover:border-yellow-500 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                disabled={isConnecting}
              >
                Continue without wallet
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}