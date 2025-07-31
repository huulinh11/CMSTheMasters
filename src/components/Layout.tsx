import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-transparent">
      {!isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;