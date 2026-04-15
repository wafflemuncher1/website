import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Estimate from "./pages/Estimate.tsx"; // <-- add this
import Login from "./pages/Login.tsx";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/components/AdminDashboard";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLayout />}/>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
