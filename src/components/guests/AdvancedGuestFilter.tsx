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

interface AdvancedGuestFilterProps {
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  filterConfig: {
    showPhone?: boolean;
    showSponsorship?: boolean;
    showSecondaryInfo?: boolean;
    showMaterials?: boolean;
    showReferrer?: boolean;
  };
}

const hasDataOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'yes', label: 'Có' },
  { value: 'no', label: 'Không' },
];

const referrerOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'has_referrer', label: 'Có người giới thiệu' },
  { value: 'no_referrer', label: 'Không có người giới thiệu' },
  { value: 'invalid_referrer', label: 'Không xác định' },
];

const FilterGrid = ({ filters, onFilterChange, filterConfig }: Omit<AdvancedGuestFilterProps, 'onClearFilters'>) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {filterConfig.showPhone && (
      <div className="space-y-2">
        <Label>Có SĐT</Label>
        <Select value={filters.phone || 'all'} onValueChange={(value) => onFilterChange('phone', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
    {filterConfig.showSponsorship && (
      <div className="space-y-2">
        <Label>Có tài trợ</Label>
        <Select value={filters.sponsorship || 'all'} onValueChange={(value) => onFilterChange('sponsorship', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
    {filterConfig.showSecondaryInfo && (
      <div className="space-y-2">
        <Label>Có thông tin phụ</Label>
        <Select value={filters.secondaryInfo || 'all'} onValueChange={(value) => onFilterChange('secondaryInfo', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
    {filterConfig.showMaterials && (
      <div className="space-y-2">
        <Label>Có tư liệu</Label>
        <Select value={filters.materials || 'all'} onValueChange={(value) => onFilterChange('materials', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
    {filterConfig.showReferrer && (
      <div className="space-y-2">
        <Label>Người giới thiệu</Label>
        <Select value={filters.referrer || 'all'} onValueChange={(value) => onFilterChange('referrer', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{referrerOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
  </div>
);

export const AdvancedGuestFilter = (props: AdvancedGuestFilterProps) => {
  const isMobile = useIsMobile();

  const triggerButton = (
    <Button variant="outline" size="icon">
      <Filter className="h-4 w-4" />
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent className="p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex flex-row justify-between items-center">
            <SheetTitle>Bộ lọc nâng cao</SheetTitle>
            <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
              <X className="mr-2 h-4 w-4" /> Xóa
            </Button>
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
      <PopoverContent className="w-96 p-0">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-medium leading-none">Bộ lọc nâng cao</h4>
          <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
            <X className="mr-2 h-4 w-4" /> Xóa bộ lọc
          </Button>
        </div>
        <div className="p-4">
          <FilterGrid {...props} />
        </div>
      </PopoverContent>
    </Popover>
  );
};