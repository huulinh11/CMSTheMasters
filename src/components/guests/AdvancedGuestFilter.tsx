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
import { PAYMENT_SOURCES } from "@/types/guest-revenue";
import { Separator } from "../ui/separator";

export interface AdvancedFilters {
  phone: 'all' | 'yes' | 'no';
  sponsorship: 'all' | 'yes' | 'no';
  secondaryInfo: 'all' | 'yes' | 'no';
  materials: 'all' | 'yes' | 'no';
  paymentStatus: 'all' | 'paid' | 'partially_paid' | 'unpaid';
  paymentSource: string;
  zns: 'all' | 'yes' | 'no';
}

interface AdvancedGuestFilterProps {
  filters: Partial<AdvancedFilters>;
  onFilterChange: (field: keyof AdvancedFilters, value: string) => void;
  onClearFilters: () => void;
}

const hasDataOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'yes', label: 'Có' },
  { value: 'no', label: 'Không' },
];

const znsOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'yes', label: 'Đã gửi' },
  { value: 'no', label: 'Chưa gửi' },
];

const paymentStatusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'paid', label: 'Đã thanh toán đủ' },
    { value: 'partially_paid', label: 'Thanh toán một phần' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
];

const FilterGrid = ({ filters, onFilterChange }: Omit<AdvancedGuestFilterProps, 'onClearFilters'>) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Có SĐT</Label>
        <Select value={filters.phone || 'all'} onValueChange={(value) => onFilterChange('phone', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Có tài trợ</Label>
        <Select value={filters.sponsorship || 'all'} onValueChange={(value) => onFilterChange('sponsorship', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Có thông tin phụ</Label>
        <Select value={filters.secondaryInfo || 'all'} onValueChange={(value) => onFilterChange('secondaryInfo', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Có tư liệu</Label>
        <Select value={filters.materials || 'all'} onValueChange={(value) => onFilterChange('materials', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{hasDataOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Trạng thái thanh toán</Label>
            <Select value={filters.paymentStatus || 'all'} onValueChange={(value) => onFilterChange('paymentStatus', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{paymentStatusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>Nguồn thanh toán (Khách mời)</Label>
            <Select value={filters.paymentSource || 'all'} onValueChange={(value) => onFilterChange('paymentSource', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {PAYMENT_SOURCES.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    </div>
    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>ZNS</Label>
        <Select value={filters.zns || 'all'} onValueChange={(value) => onFilterChange('zns', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{znsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
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
      <PopoverContent className="w-[500px] p-0">
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