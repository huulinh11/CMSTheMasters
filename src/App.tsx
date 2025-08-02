import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import PublicLayout from "./layouts/PublicLayout";
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
import PublicUser from "./pages/PublicUser";
import PublicProfile from "./pages/public/PublicProfile";
import PublicChecklist from "./pages/public/PublicChecklist";
import PublicTimelinePreview from "./pages/public/PublicTimelinePreview";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const isPublicRoute = location.pathname.startsWith('/profile/') || location.pathname.startsWith('/checklist/') || location.pathname.startsWith('/timeline/public');

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/profile/:slug" element={<PublicProfile />} />
        <Route path="/checklist/:phone/*" element={<PublicChecklist />} />
        <Route path="/timeline/public" element={<PublicTimelinePreview />} />
        <Route path="*" element={
          <PublicLayout>
            <NotFound />
          </PublicLayout>
        } />
      </Routes>
    );
  }

  return (
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
        <Route path="/public-user" element={<PublicUser />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;