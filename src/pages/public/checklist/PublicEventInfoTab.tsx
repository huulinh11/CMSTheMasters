import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineDisplay } from "@/components/public-checklist/TimelineDisplay";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";

const PublicEventInfoTab = () => {
  const { timelineEvents } = useOutletContext<ChecklistDataContext>();

  return (
    <div className="p-4">
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