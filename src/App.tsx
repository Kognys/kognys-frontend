import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { WalletLoginModal } from "@/components/WalletLoginModal";
import { setUserId } from "@/lib/kognysPaperApi";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import SimpleChatPage from "./pages/SimpleChatPage";
import ChatPage from "./pages/ChatPage";
import ChatPageSimple from "./pages/ChatPageSimple";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected } = useWallet();
  const [hasSkippedWallet, setHasSkippedWallet] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showModal = !isConnected && !hasSkippedWallet;

  const refreshCurrentRoute = () => {
    // Soft refresh by navigating to the same route
    navigate(location.pathname + location.search, { replace: true });
    // Focus input after navigation
    setTimeout(() => {
      const chatInput = document.querySelector('input[placeholder="Ask me anything..."], input[placeholder="How can I help you today?"]') as HTMLInputElement;
      if (chatInput) {
        chatInput.focus();
      }
    }, 100);
  };

  const handleWalletConnected = (address: string) => {
    setUserId(address);
    refreshCurrentRoute();
  };

  const handleSkipWallet = () => {
    setHasSkippedWallet(true);
    // Generate a temporary user ID for users without wallet
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUserId(tempUserId);
    refreshCurrentRoute();
  };

  return (
    <>
      <WalletLoginModal 
        isOpen={showModal} 
        onWalletConnected={handleWalletConnected}
        onSkip={handleSkipWallet}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/chat" element={<SimpleChatPage />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
