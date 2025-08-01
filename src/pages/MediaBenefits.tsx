import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VipMediaBenefitsTab from "./media-benefits/VipMediaBenefitsTab";
import RegularMediaBenefitsTab from "./media-benefits/RegularMediaBenefitsTab";

const MediaBenefitsPage = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Quyền lợi truyền thông</h1>
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="vip" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chức vụ</TabsTrigger>
          <TabsTrigger value="regular" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
        </TabsList>
        <TabsContent value="vip" className="mt-4">
          <VipMediaBenefitsTab />
        </TabsContent>
        <TabsContent value="regular" className="mt-4">
          <RegularMediaBenefitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaBenefitsPage;