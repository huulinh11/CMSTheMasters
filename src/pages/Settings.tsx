import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleSettings from "@/pages/settings/RoleSettings";
import GeneralSettings from "@/pages/settings/GeneralSettings";
import TaskSettings from "@/pages/settings/TaskSettings";
import BenefitSettings from "@/pages/settings/BenefitSettings";

const SettingsPage = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Cấu hình</h1>
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-auto bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="roles" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Vai trò</TabsTrigger>
          <TabsTrigger value="tasks" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Tác vụ</TabsTrigger>
          <TabsTrigger value="benefits" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Quyền lợi</TabsTrigger>
          <TabsTrigger value="general" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chung</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="mt-4">
          <RoleSettings />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <TaskSettings />
        </TabsContent>
        <TabsContent value="benefits" className="mt-4">
          <BenefitSettings />
        </TabsContent>
        <TabsContent value="general" className="mt-4">
          <GeneralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;