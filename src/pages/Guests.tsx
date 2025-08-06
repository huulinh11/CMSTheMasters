import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VipGuestTab from "./guests/VipGuestTab";
import RegularGuestTab from "./guests/RegularGuestTab";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ImportExportActions } from "@/components/guests/ImportExportActions";

const GuestsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("vip");

  useEffect(() => {
    const viewVip = searchParams.get('view_vip');
    const viewRegular = searchParams.get('view_regular');
    if (viewVip) {
      setActiveTab('vip');
    } else if (viewRegular) {
      setActiveTab('regular');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý khách mời</h1>
        <ImportExportActions />
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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