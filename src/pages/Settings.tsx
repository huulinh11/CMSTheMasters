import { Outlet, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const settingsItems = [
  { to: "/settings/roles", label: "Vai trò" },
  { to: "/settings/tasks", label: "Tác vụ" },
  { to: "/settings/benefits", label: "Quyền lợi" },
  { to: "/settings/menu", label: "Cài đặt menu" },
  { to: "/settings/general", label: "Chung" },
  { to: "/settings/loading-screen", label: "Cấu hình màn hình chờ profile" },
  { to: "/settings/library", label: "Thư viện" },
];

const SettingsIndex = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {settingsItems.map(item => (
      <Link to={item.to} key={item.to}>
        <Card className="hover:bg-slate-50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{item.label}</CardTitle>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </CardHeader>
        </Card>
      </Link>
    ))}
  </div>
);

const SettingsPage = () => {
  const location = useLocation();
  const isIndex = location.pathname === '/settings';

  const pageTitle = settingsItems.find(item => location.pathname.startsWith(item.to))?.label;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-4">
        {!isIndex && (
          <Link to="/settings" className="mr-2 p-2 rounded-md hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-800">
          Cấu hình {pageTitle && `> ${pageTitle}`}
        </h1>
      </div>
      {isIndex ? <SettingsIndex /> : <Outlet />}
    </div>
  );
};

export default SettingsPage;