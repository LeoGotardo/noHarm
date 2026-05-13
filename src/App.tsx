import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext.jsx";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.js";
import FriendsScreen from "./pages/FriendsScreen.js";
import ProgressScreen from "./pages/ProgressScreen.js";
import ChatScreen from "./pages/ChatScreen.js";
import HelpScreen from "./pages/HelpScreen.js";
import ProfileScreen from "./pages/ProfileScreen.js";
import NotFound from "./pages/NotFound.js";
import LoginPage from "./pages/LoginPage.js";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/friends" element={<FriendsScreen />} />
                    <Route path="/progress" element={<ProgressScreen />} />
                    <Route path="/chat" element={<ChatScreen />} />
                    <Route path="/help" element={<HelpScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
