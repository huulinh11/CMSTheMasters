import MasterListManager from "@/components/settings/MasterListManager";

const TaskSettings = () => {
  return (
    <MasterListManager
      tableName="event_tasks_master"
      queryKey="event_tasks_master"
      title="Danh sách Tác vụ sự kiện"
      itemName="Tác vụ"
    />
  );
};

export default TaskSettings;