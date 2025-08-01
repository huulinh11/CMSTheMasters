import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VipGuestRevenueTab from "./Revenue/VipGuestRevenueTab";
import RegularGuestRevenueTab from "./Revenue/RegularGuestRevenueTab";
import PagePlaceholder from "@/components/PagePlaceholder";

const RevenuePage = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Quản lý doanh thu</h1>
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="vip" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chức vụ</TabsTrigger>
          <TabsTrigger value="regular" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
          <TabsTrigger value="commission" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Hoa hồng</TabsTrigger>
        </TabsList>
        <TabsContent value="vip" className="mt-4">
          <VipGuestRevenueTab />
        </TabsContent>
        <TabsContent value="regular" className="mt-4">
          <RegularGuestRevenueTab />
        </TabsContent>
        <TabsContent value="commission" className="mt-4">
          <PagePlaceholder title="Hoa hồng" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenuePage;