import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VipGuestTab from "./guests/VipGuestTab";
import RegularGuestTab from "./guests/RegularGuestTab";

const GuestsPage = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Quản lý khách mời</h1>
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="vip" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chức vụ</TabsTrigger>
          <TabsTrigger value="regular" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
        </TabsList>
        <TabsContent value="vip" className="mt-4">
          <VipGuestTab />
        </TabsContent>
        <TabsContent value="regular" className="mt-4">
          <RegularGuestTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestsPage;