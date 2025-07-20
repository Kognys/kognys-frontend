import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  const { isConnected, connect } = useWallet();

  const handleWalletConnected = (address: string) => {
    setUserId(address);
  };

  return (
    <>
      <WalletLoginModal 
        isOpen={!isConnected} 
        onWalletConnected={handleWalletConnected} 
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
