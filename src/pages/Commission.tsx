import { PageHeader } from "@/components/PageHeader";
import SalesCommission from "@/components/commission/SalesCommission";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

const CommissionPage = () => {
  const { profile, user } = useAuth();
  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const isSale = useMemo(() => userRole === 'Sale', [userRole]);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Quản lý hoa hồng" />
      <SalesCommission isSaleView={isSale} userId={isSale ? (profile?.id || user?.id) : undefined} />
    </div>
  );
};

export default CommissionPage;