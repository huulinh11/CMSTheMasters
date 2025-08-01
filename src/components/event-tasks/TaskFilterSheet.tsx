import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface TaskFilterSheetProps {
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  allTasks: string[];
}

const filterOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'not_completed', label: 'Chưa hoàn thành' },
];

const FilterGrid = ({ filters, onFilterChange, allTasks }: Omit<TaskFilterSheetProps, 'onClearFilters'>) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {allTasks.map((taskName) => (
      <div key={taskName} className="space-y-2">
        <Label>{taskName}</Label>
        <Select
          value={filters[taskName] || 'all'}
          onValueChange={(value) => onFilterChange(taskName, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ))}
  </div>
);

export const TaskFilterSheet = (props: TaskFilterSheetProps) => {
  const isMobile = useIsMobile();

  const triggerButton = (
    <Button variant="outline">
      <Filter className="mr-2 h-4 w-4" /> Lọc tác vụ
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent className="p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Bộ lọc tác vụ</SheetTitle>
              <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              <FilterGrid {...props} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-[700px] p-0">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-medium leading-none">Bộ lọc tác vụ</h4>
          <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4">
            <FilterGrid {...props} />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};