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
import { Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

type FilterOption = {
  value: string;
  label: string;
};

type BenefitField = {
  name: string;
  label: string;
  options: FilterOption[];
};

interface AdvancedFilterSheetProps {
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  benefitFields: BenefitField[];
}

const FilterContent = ({ filters, onFilterChange, benefitFields }: AdvancedFilterSheetProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {benefitFields.map((field) => (
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Bộ lọc nâng cao</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <FilterContent {...props} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-[600px]">
        <FilterContent {...props} />
      </PopoverContent>
    </Popover>
  );
};