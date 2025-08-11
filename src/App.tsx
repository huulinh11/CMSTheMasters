import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import MediaBenefits from "./pages/MediaBenefits";
import EventTasks from "./pages/EventTasks";
import Information from "./pages/Information";
import Revenue from "./pages/Revenue";
import Timeline from "./pages/Timeline";
import Account from "./pages/Account";
import SettingsPage from "./pages/Settings";
import RoleSettings from "./pages/settings/RoleSettings";
import TaskSettings from "./pages/settings/TaskSettings";
import BenefitSettings from "./pages/settings/BenefitSettings";
import GeneralSettings from "./pages/settings/GeneralSettings";
import MenuSettings from "./pages/settings/MenuSettings";
import LoadingScreenSettings from "./pages/settings/LoadingScreenSettings";
import ImageLibrary from "./pages/settings/ImageLibrary";
import NotFound from "./pages/NotFound";
import PublicUser from "./pages/PublicUser";
import PublicProfile from "./pages/public/PublicProfile";
import PublicChecklist from "./pages/public/PublicChecklist";
import PublicTimelinePreview from "./pages/public/PublicTimelinePreview";
import Login, { action as loginAction } from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import CommissionPage from "./pages/Commission";
import ServiceSalesPage from "./pages/ServiceSales"; // Import trang mới
import HomeRedirect from "./components/HomeRedirect";

const queryClient = new QueryClient();

// Component này bao bọc tất cả các trang cần xác thực.
const ProtectedLayout = () => (
  <AuthProvider>
    <ProtectedRoute />
  </AuthProvider>
);

const router = createBrowserRouter([
  // Các trang công khai không cần xác thực được đặt ở cấp cao nhất.
  { 
    path: "/login", 
    element: <Login />,
    action: loginAction,
  },
  { path: "/profile/:slug", element: <PublicProfile /> },
  { path: "/checklist/:identifier/*", element: <PublicChecklist /> },
  { path: "/timeline/public", element: <PublicTimelinePreview /> },
  
  // Tất cả các trang cần đăng nhập đều là con của ProtectedLayout.
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { element: <PermissionProtectedRoute permissionId="dashboard" />, children: [{ path: "dashboard", element: <Dashboard /> }] },
      { element: <PermissionProtectedRoute permissionId="guests" />, children: [{ path: "guests", element: <Guests /> }] },
      { element: <PermissionProtectedRoute permissionId="media-benefits" />, children: [{ path: "media-benefits", element: <MediaBenefits /> }] },
      { element: <PermissionProtectedRoute permissionId="event-tasks" />, children: [{ path: "event-tasks", element: <EventTasks /> }] },
      { element: <PermissionProtectedRoute permissionId="information" />, children: [{ path: "information", element: <Information /> }] },
      { element: <PermissionProtectedRoute permissionId="revenue" />, children: [{ path: "revenue", element: <Revenue /> }] },
      { element: <PermissionProtectedRoute permissionId="service-sales" />, children: [{ path: "service-sales", element: <ServiceSalesPage /> }] }, // Thêm route mới
      { element: <PermissionProtectedRoute permissionId="commission" />, children: [{ path: "commission", element: <CommissionPage /> }] },
      { element: <PermissionProtectedRoute permissionId="timeline" />, children: [{ path: "timeline", element: <Timeline /> }] },
      { element: <PermissionProtectedRoute permissionId="public-user" />, children: [{ path: "public-user", element: <PublicUser /> }] },
      { element: <PermissionProtectedRoute permissionId="account" />, children: [{ path: "account", element: <Account /> }] },
      {
        element: <PermissionProtectedRoute permissionId="settings" />,
        children: [
          { 
            path: "settings", 
            element: <SettingsPage />,
            children: [
              { index: true, element: <div /> },
              { path: "roles", element: <RoleSettings /> },
              { path: "tasks", element: <TaskSettings /> },
              { path: "benefits", element: <BenefitSettings /> },
              { path: "menu", element: <MenuSettings /> },
              { path: "general", element: <GeneralSettings /> },
              { path: "loading-screen", element: <LoadingScreenSettings /> },
              { path: "library", element: <ImageLibrary /> },
            ]
          }
        ],
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