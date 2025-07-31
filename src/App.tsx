import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import MediaBenefits from "./pages/MediaBenefits";
import EventTasks from "./pages/EventTasks";
import More from "./pages/More";
import Information from "./pages/Information";
import Revenue from "./pages/Revenue";
import Timeline from "./pages/Timeline";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/media-benefits" element={<MediaBenefits />} />
            <Route path="/event-tasks" element={<EventTasks />} />
            <Route path="/more" element={<More />} />
            <Route path="/information" element={<Information />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;