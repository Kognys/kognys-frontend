import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletLoginModal } from '@/components/WalletLoginModal';
import { useWallet } from '@/hooks/useWallet';
import { setUserId } from '@/lib/kognysPaperApi';
import { Wallet, User } from 'lucide-react';

interface LoginButtonProps {
  onWalletConnected?: (address: string) => void;
}

export const LoginButton = ({ onWalletConnected }: LoginButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address } = useWallet();

  const handleWalletConnected = (walletAddress: string) => {
    setUserId(walletAddress);
    setIsModalOpen(false);
    onWalletConnected?.(walletAddress);
  };

  const handleSkipWallet = () => {
    // Generate a temporary user ID for users without wallet
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setUserId(tempUserId);
    localStorage.setItem("kognys_wallet_skipped", "true");
    setIsModalOpen(false);
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="truncate max-w-[120px]">
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 h-9 px-3 text-sm"
      >
        <Wallet className="h-4 w-4" />
        Login
      </Button>
      
      <WalletLoginModal 
        isOpen={isModalOpen} 
        onWalletConnected={handleWalletConnected}
        onSkip={handleSkipWallet}
      />
    </>
  );
};