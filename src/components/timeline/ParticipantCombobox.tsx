import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ParticipantOption } from "@/types/timeline";

interface ParticipantComboboxProps {
  options: ParticipantOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ParticipantCombobox({ options, selected, onChange }: ParticipantComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const groups = options.reduce((acc, option) => {
    (acc[option.group] = acc[option.group] || []).push(option);
    return acc;
  }, {} as Record<string, ParticipantOption[]>);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selected.length > 0 ? `${selected.length} đã chọn` : "Chọn người tham gia..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Tìm kiếm..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              {Object.entries(groups).map(([groupName, groupOptions]) => (
                <CommandGroup key={groupName} heading={groupName}>
                  {groupOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="space-x-1 space-y-1">
        {selected.map((value) => (
          <Badge
            key={value}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleSelect(value)}
          >
            {options.find(o => o.value === value)?.label || value} &times;
          </Badge>
        ))}
      </div>
    </div>
  );
}