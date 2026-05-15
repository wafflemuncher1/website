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
import DashboardPage from "./admin/pages/DashboardPage/DashboardPage";

import CalenderPage from "./admin/pages/CalendarPage/CalendarPage";
import BookingsPage from "./admin/pages/BookingsPage/BookingsPage";
import AccountingPage from "./admin/pages/AccountingPage/AccountingPage";
import ServiceAreaPage from "./admin/pages/ServiceAreaPage/ServiceAreaPage";
import InvestmentsPage  from "./admin/pages/InvestmentsPage/InvestmentsPage.tsx";
import MessagesPage from "./admin/pages/MessagesPage/MessagesPage.tsx";
import SettingsPage from "./admin/pages/SettingsPage/SettingsPage.tsx";







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
         <Route path="/admin" element={<AdminLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />

  <Route path="calender" element={<CalenderPage />} />
  <Route path="bookings" element={<BookingsPage />} />
  <Route path="accounting" element={<AccountingPage />} />
  <Route path="servicearea" element={<ServiceAreaPage />} />
  <Route path="investments" element={<InvestmentsPage />} />
  <Route path="messages" element={<MessagesPage />} />
  <Route path="settings" element={<SettingsPage />} />


</Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
