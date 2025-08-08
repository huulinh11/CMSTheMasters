import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, redirect, useLoaderData } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
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
import { AuthProvider, Profile } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// Loader cho các route được bảo vệ
const protectedLoader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // SỬA LỖI: Kiểm tra chặt chẽ cả session và session.user
  if (!session || !session.user) {
    return redirect('/login');
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Loader error fetching profile:", error);
    await supabase.auth.signOut();
    return redirect('/login');
  }

  return { session, user: session.user, profile };
};

// Component gốc cho các route được bảo vệ, cung cấp Context
const ProtectedRoot = () => {
  const { session, user, profile } = useLoaderData() as { session: Session; user: User; profile: Profile | null };
  
  return (
    <AuthProvider initialSession={session} initialUser={user} initialProfile={profile}>
      <ProtectedRoute />
    </AuthProvider>
  );
};

const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <Login /> },
  { path: "/profile/:slug", element: <PublicProfile /> },
  { path: "/checklist/:phone/*", element: <PublicChecklist /> },
  { path: "/timeline/public", element: <PublicTimelinePreview /> },

  // Protected routes
  {
    path: "/",
    element: <ProtectedRoot />,
    loader: protectedLoader,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "guests", element: <Guests /> },
      { path: "media-benefits", element: <MediaBenefits /> },
      { path: "event-tasks", element: <EventTasks /> },
      { path: "information", element: <Information /> },
      {
        element: <PermissionProtectedRoute permissionId="revenue" />,
        children: [{ path: "revenue", element: <Revenue /> }],
      },
      { path: "timeline", element: <Timeline /> },
      { path: "public-user", element: <PublicUser /> },
      {
        element: <PermissionProtectedRoute permissionId="account" />,
        children: [{ path: "account", element: <Account /> }],
      },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;