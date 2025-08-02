import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineDisplay } from "@/components/public-checklist/TimelineDisplay";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";

const PublicEventInfoTab = () => {
  const { guest, timelineEvents } = useOutletContext<ChecklistDataContext>();

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] bg-primary/10 p-1 h-12 rounded-xl mx-auto">
          <TabsTrigger value="timeline" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Timeline</TabsTrigger>
          <TabsTrigger value="dresscode" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Dresscode</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <TimelineDisplay events={timelineEvents} guest={guest} />
        </TabsContent>
        <TabsContent value="dresscode" className="mt-4">
          <p className="text-center text-slate-600 p-8">Nội dung dresscode sẽ được cập nhật sớm.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicEventInfoTab;