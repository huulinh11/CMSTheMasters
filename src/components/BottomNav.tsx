import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  MoreHorizontal,
  LucideIcon,
  ChevronRight,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "../contexts/AuthContext";
import { allNavItems } from "@/config/nav";

const BottomNav = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const location = useLocation();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    if (isSheetOpen) {
      setIsSheetOpen(false);
    }
  }, [location.pathname]);

  const [mainNavItems, moreLinks] = useMemo(() => {
    if (!profile) return [[], []];
    
    const visibleItems = allNavItems.filter(item => {
      if (item.roles) {
        return item.roles.includes(profile.role);
      }
      return true;
    });

    const mainItems = visibleItems.filter(item => !item.isMoreLink);
    const moreItems = visibleItems.filter(item => item.isMoreLink);

    return [mainItems, moreItems];
  }, [profile]);

  const isMorePageActive = moreLinks.some(link => location.pathname.startsWith(link.to));

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] md:hidden">
      <nav className="flex justify-around items-center h-16">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.mobileLabel || item.label}
            end={item.end}
          />
        ))}

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isMorePageActive ? "text-primary" : "text-slate-500"}`}>
              <MoreHorizontal className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Khác</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-3/4 p-0 bg-white">
            <SheetHeader className="p-4 text-left border-b">
              <SheetTitle className="text-2xl font-bold text-slate-800">Khác</SheetTitle>
            </SheetHeader>
            <ul className="divide-y divide-slate-200">
              {moreLinks.map((link) => (
                <li key={link.to}>
                  <MoreLinkItem to={link.to} icon={link.icon} label={link.label} />
                </li>
              ))}
              <li>
                <button onClick={signOut} className="flex items-center p-4 hover:bg-slate-50 transition-colors w-full">
                  <LogOut className="w-6 h-6 mr-4 text-red-500" />
                  <span className="flex-1 text-red-500 font-medium text-left">Đăng xuất</span>
                </button>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </footer>
  );
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full h-full transition-colors ${
        isActive ? "text-primary" : "text-slate-500"
      }`
    }
  >
    <Icon className="w-6 h-6 mb-1" />
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

interface MoreLinkItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const MoreLinkItem: React.FC<MoreLinkItemProps> = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
    <Icon className="w-6 h-6 mr-4 text-slate-600" />
    <span className="flex-1 text-slate-800 font-medium">{label}</span>
    <ChevronRight className="w-5 h-5 text-slate-400" />
  </NavLink>
);

export default BottomNav;