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
import { Separator } from "@/components/ui/separator";
import React from "react";

type FilterOption = {
  value: string;
  label: string;
};

type BenefitField = {
  name: string;
  label: string;
  options: FilterOption[];
};

type BenefitFieldGroup = BenefitField[];

interface AdvancedFilterSheetProps {
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  benefitFieldGroups: BenefitFieldGroup[];
}

const FilterGrid = ({ filters, onFilterChange, benefitFieldGroups }: Omit<AdvancedFilterSheetProps, 'onClearFilters'>) => (
  <div className="space-y-4">
    {benefitFieldGroups.map((group, groupIndex) => (
      <React.Fragment key={groupIndex}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {group.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              <Select
                value={filters[field.name] || 'all'}
                onValueChange={(value) => onFilterChange(field.name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {groupIndex < benefitFieldGroups.length - 1 && <Separator />}
      </React.Fragment>
    ))}
  </div>
);

export const AdvancedFilterSheet = (props: AdvancedFilterSheetProps) => {
  const isMobile = useIsMobile();

  const triggerButton = (
    <Button variant="outline">
      <Filter className="mr-2 h-4 w-4" /> Lọc nâng cao
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent className="p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Bộ lọc nâng cao</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4">
              <FilterGrid {...props} />
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" onClick={props.onClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>
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
          <h4 className="font-medium leading-none">Bộ lọc nâng cao</h4>
          <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-4">
            <FilterGrid {...props} />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};