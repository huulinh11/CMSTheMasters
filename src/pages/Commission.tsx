import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import SalesCommission from "@/components/commission/SalesCommission";
import ReferralCommission from "@/components/commission/ReferralCommission";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

const CommissionPage = () => {
  const { profile, user } = useAuth();
  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const isSale = useMemo(() => userRole === 'Sale', [userRole]);

  if (isSale) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="Quản lý hoa hồng" />
        <SalesCommission isSaleView={true} userId={profile?.id || user?.id} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Quản lý hoa hồng" />
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="sales" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Bán hàng</TabsTrigger>
          <TabsTrigger value="referral" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Giới thiệu</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          <SalesCommission isSaleView={false} />
        </TabsContent>
        <TabsContent value="referral" className="mt-4">
          <ReferralCommission />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommissionPage;