import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleSettings from "@/pages/settings/RoleSettings";
import ChecklistSettings from "@/pages/ChecklistSettings";
import PermissionSettings from "@/pages/settings/PermissionSettings";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  const { profile } = useAuth();
  const canViewPermissions = profile?.role === 'Admin' || profile?.role === 'Quản lý';

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Cấu hình</h1>
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 md:w-auto bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="roles" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Vai trò</TabsTrigger>
          <TabsTrigger value="checklist" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Checklist</TabsTrigger>
          {canViewPermissions && (
            <TabsTrigger value="permissions" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Phân quyền</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="roles" className="mt-4">
          <RoleSettings />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <ChecklistSettings />
        </TabsContent>
        {canViewPermissions && (
          <TabsContent value="permissions" className="mt-4">
            <PermissionSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;