import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";

type CombinedGuest = (Guest | VipGuest) & { name: string; presenterCount?: number; honoreeCount?: number };

interface GuestMultiSelectProps {
  allGuests: CombinedGuest[];
  roleConfigs: RoleConfiguration[];
  selected: { guest_id: string; guest_name: string }[];
  onChange: (selected: { guest_id: string; guest_name: string }[]) => void;
  placeholder: string;
  badgeClassName?: string;
}

export function GuestMultiSelect({ allGuests, roleConfigs, selected, onChange, placeholder, badgeClassName }: GuestMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [roleFilter, setRoleFilter] = React.useState("all");

  const filteredGuests = React.useMemo(() => {
    if (roleFilter === "all") return allGuests;
    return allGuests.filter(g => g.role === roleFilter);
  }, [allGuests, roleFilter]);

  const handleSelect = (guest: CombinedGuest) => {
    const newSelected = selected.some(s => s.guest_id === guest.id)
      ? selected.filter((item) => item.guest_id !== guest.id)
      : [...selected, { guest_id: guest.id, guest_name: guest.name }];
    onChange(newSelected);
  };

  const selectedIds = new Set(selected.map(s => s.guest_id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <span className="truncate">{selected.length > 0 ? `${selected.length} đã chọn` : placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-[--radix-popover-trigger-width] p-0" avoidCollisions={false}>
          <Command>
            <div className="p-2 border-b">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue placeholder="Lọc theo vai trò" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roleConfigs.map(role => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <CommandInput placeholder="Tìm khách..." />
            <CommandList onWheel={(e) => e.stopPropagation()}>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              <CommandGroup className="max-h-[224px] overflow-y-auto">
                {filteredGuests.map((guest) => (
                  <CommandItem
                    key={guest.id}
                    value={guest.name}
                    onSelect={() => handleSelect(guest)}
                    className={cn(
                      "h-auto items-start",
                      guest.presenterCount && guest.presenterCount > 0 && "text-green-600"
                    )}
                  >
                    <Check className={cn("mr-2 h-4 w-4 flex-shrink-0 mt-1", selectedIds.has(guest.id) ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 whitespace-normal">
                      {guest.name} {guest.presenterCount !== undefined && `(${guest.presenterCount})`} <span className="text-xs text-muted-foreground ml-2">({guest.role})</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="space-x-1 space-y-1">
        {selected.map((s) => (
          <Badge
            key={s.guest_id}
            variant="secondary"
            className={cn("cursor-pointer", badgeClassName)}
            onClick={() => onChange(selected.filter(item => item.guest_id !== s.guest_id))}
          >
            {s.guest_name} &times;
          </Badge>
        ))}
      </div>
    </div>
  );
}