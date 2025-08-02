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
      <Tabs defaultValue="timeline">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="dresscode">Dresscode</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <TimelineDisplay events={timelineEvents} />
        </TabsContent>
        <TabsContent value="dresscode" className="mt-4">
          <p className="text-center text-slate-600 p-8">Nội dung dresscode sẽ được cập nhật sớm.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicEventInfoTab;