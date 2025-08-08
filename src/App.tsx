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
import Login, { action as loginAction } from "./pages/Login";
import { AuthProvider, Profile } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// Loader cho các route được bảo vệ
const protectedLoader = async () => {
  try {
    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Lỗi khi lấy session:", sessionError);
      return redirect('/login');
    }

    if (!data?.session?.user) {
      return redirect('/login');
    }

    const { session } = data;
    const user = session.user;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Lỗi khi tải profile:", profileError);
      await supabase.auth.signOut();
      return redirect('/login');
    }

    return { session, user, profile: profile || null };
  } catch (e) {
    console.error("Lỗi nghiêm trọng trong loader:", e);
    await supabase.auth.signOut();
    return redirect('/login');
  }
};

// Loader cho trang login để tự động chuyển hướng nếu đã đăng nhập
const loginLoader = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return redirect('/');
    }
    return null;
  } catch (e) {
    console.error("Lỗi nghiêm trọng trong login loader:", e);
    return null;
  }
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
  { 
    path: "/login", 
    element: <Login />,
    action: loginAction,
    loader: loginLoader,
  },
  { path: "/profile/:slug", element: <PublicProfile /> },
  { path: "/checklist/:phone/*", element: <PublicChecklist /> },
  { path: "/timeline/public", element: <PublicTimelinePreview /> },

  // Protected routes
  {
    path: "/",
    element: <ProtectedRoot />,
    loader: protectedLoader,
    children: [
      {
        element: <PermissionProtectedRoute permissionId="dashboard" />,
        children: [{ index: true, element: <Dashboard /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="guests" />,
        children: [{ path: "guests", element: <Guests /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="media-benefits" />,
        children: [{ path: "media-benefits", element: <MediaBenefits /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="event-tasks" />,
        children: [{ path: "event-tasks", element: <EventTasks /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="information" />,
        children: [{ path: "information", element: <Information /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="revenue" />,
        children: [{ path: "revenue", element: <Revenue /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="timeline" />,
        children: [{ path: "timeline", element: <Timeline /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="public-user" />,
        children: [{ path: "public-user", element: <PublicUser /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="account" />,
        children: [{ path: "account", element: <Account /> }],
      },
      {
        element: <PermissionProtectedRoute permissionId="settings" />,
        children: [{ path: "settings", element: <Settings /> }],
      },
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