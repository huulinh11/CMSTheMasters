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

export interface RevenueFilters {
  role: string;
  sponsorship: 'all' | 'has_sponsorship' | 'no_sponsorship';
  paymentStatus: 'all' | 'paid' | 'partially_paid' | 'unpaid';
  paymentSource: string;
}

interface AdvancedRevenueFilterProps {
  filters: RevenueFilters;
  onFilterChange: (field: keyof RevenueFilters, value: string) => void;
  onClearFilters: () => void;
  allRoles: string[];
}

const FilterGrid = ({ filters, onFilterChange, allRoles }: Omit<AdvancedRevenueFilterProps, 'onClearFilters'>) => (
  <div className="grid grid-cols-1 gap-4">
    <div className="space-y-2">
      <Label>Vai trò</Label>
      <Select value={filters.role} onValueChange={(value) => onFilterChange('role', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo vai trò" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả vai trò</SelectItem>
          {allRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Số tiền tài trợ</Label>
      <Select value={filters.sponsorship} onValueChange={(value) => onFilterChange('sponsorship', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo số tiền" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="has_sponsorship">Có tài trợ</SelectItem>
          <SelectItem value="no_sponsorship">Không có tài trợ</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Trạng thái thanh toán</Label>
      <Select value={filters.paymentStatus} onValueChange={(value) => onFilterChange('paymentStatus', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo trạng thái" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="paid">Đã thanh toán đủ</SelectItem>
          <SelectItem value="partially_paid">Thanh toán một phần</SelectItem>
          <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Nguồn thanh toán (Khách mời)</Label>
      <Select value={filters.paymentSource} onValueChange={(value) => onFilterChange('paymentSource', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo nguồn" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          {PAYMENT_SOURCES.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const AdvancedRevenueFilter = (props: AdvancedRevenueFilterProps) => {
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
      <PopoverContent className="w-80 p-0">
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