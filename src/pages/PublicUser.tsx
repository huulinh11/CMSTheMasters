import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileManagementTab from "./public-user/ProfileManagementTab";
import ChecklistTab from "./public-user/ChecklistTab";
import { PageHeader } from "@/components/PageHeader";

const PublicUserPage = () => {
  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Public User Page" />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl">
          <TabsTrigger value="profile" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Profile</TabsTrigger>
          <TabsTrigger value="checklist" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileManagementTab />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicUserPage;