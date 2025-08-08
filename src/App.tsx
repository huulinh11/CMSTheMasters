import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import MediaBenefits from "./pages/MediaBenefits";
import EventTasks from "./pages/EventTasks";
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
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Đang tải ứng dụng...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/profile/:slug" element={<PublicProfile />} />
      <Route path="/checklist/:phone/*" element={<PublicChecklist />} />
      <Route path="/timeline/public" element={<PublicTimelinePreview />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/guests" element={<Guests />} />
        <Route path="/media-benefits" element={<MediaBenefits />} />
        <Route path="/event-tasks" element={<EventTasks />} />
        <Route path="/information" element={<Information />} />
        <Route element={<PermissionProtectedRoute permissionId="revenue" />}>
          <Route path="/revenue" element={<Revenue />} />
        </Route>
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/public-user" element={<PublicUser />} />
        <Route element={<PermissionProtectedRoute permissionId="account" />}>
          <Route path="/account" element={<Account />} />
        </Route>
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;