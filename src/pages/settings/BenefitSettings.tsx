import MasterListManager from "@/components/settings/MasterListManager";

const BenefitSettings = () => {
  return (
    <MasterListManager
      tableName="media_benefits_master"
      queryKey="media_benefits_master"
      title="Danh sách Quyền lợi truyền thông"
      itemName="Quyền lợi"
    />
  );
};

export default BenefitSettings;