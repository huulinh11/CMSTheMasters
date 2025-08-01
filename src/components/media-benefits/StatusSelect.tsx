import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVITATION_STATUSES, InvitationStatus } from "@/types/media-benefit";

interface StatusSelectProps {
  value: InvitationStatus;
  onUpdate: (value: InvitationStatus) => void;
  disabled?: boolean;
}

export const StatusSelect = ({ value, onUpdate, disabled }: StatusSelectProps) => {
  return (
    <Select value={value} onValueChange={onUpdate} disabled={disabled}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Chọn trạng thái" />
      </SelectTrigger>
      <SelectContent>
        {INVITATION_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};