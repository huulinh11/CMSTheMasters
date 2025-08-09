import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTemplate } from "@/types/profile-template";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface AssignTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ProfileTemplate[];
  guests: CombinedGuest[];
  onAssign: (templateId: string, guestIds: string[]) => void;
  isAssigning: boolean;
}

export const AssignTemplateDialog = ({
  open,
  onOpenChange,
  templates,
  guests,
  onAssign,
  isAssigning,
}: AssignTemplateDialogProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  const handleAssign = () => {
    if (selectedTemplateId && selectedGuestIds.length > 0) {
      onAssign(selectedTemplateId, selectedGuestIds);
    }
  };

  const toggleGuest = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gán Template</DialogTitle>
          <DialogDescription>
            Chọn một template và các khách mời để áp dụng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <label className="font-medium">Chọn Template</label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn một template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="font-medium">Chọn Khách mời</label>
            <Command className="rounded-lg border">
              <CommandInput placeholder="Tìm kiếm khách mời..." />
              <CommandList>
                <ScrollArea className="h-64">
                  <CommandEmpty>Không tìm thấy.</CommandEmpty>
                  <CommandGroup>
                    {guests.map((guest) => (
                      <CommandItem
                        key={guest.id}
                        value={`${guest.name} ${guest.role}`}
                        onSelect={() => toggleGuest(guest.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedGuestIds.includes(guest.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span>{guest.name} <span className="text-xs text-muted-foreground">({guest.role})</span></span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTemplateId || selectedGuestIds.length === 0 || isAssigning}
          >
            {isAssigning ? "Đang gán..." : `Gán cho ${selectedGuestIds.length} khách`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};