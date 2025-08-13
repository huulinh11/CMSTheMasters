import React from "react";
import PublicBottomNav from "@/components/public-checklist/PublicBottomNav";
import { NotificationBell } from "@/components/public-checklist/NotificationBell";

interface PublicChecklistLayoutProps {
  children: React.ReactNode;
  guestId?: string | null;
}

const PublicChecklistLayout: React.FC<PublicChecklistLayoutProps> = ({ children, guestId }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5ea] to-[#e5b899] md:flex md:justify-center md:items-center md:p-4">
      <div className="w-full md:max-w-[420px] md:h-[90vh] md:max-h-[800px] bg-transparent md:shadow-lg relative md:rounded-2xl overflow-hidden flex flex-col min-h-screen md:min-h-0">
        {guestId && (
          <header className="absolute top-0 right-0 z-20 p-4">
            <NotificationBell guestId={guestId} />
          </header>
        )}
        <main className="flex-1 overflow-y-auto pb-5">{children}</main>
        <PublicBottomNav />
      </div>
    </div>
  );
};

export default PublicChecklistLayout;