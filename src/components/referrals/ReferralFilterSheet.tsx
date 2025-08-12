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

interface ReferralFilters {
  role: string;
  status: string;
  sort: string;
}

interface ReferralFilterSheetProps {
  filters: ReferralFilters;
  onFilterChange: (field: keyof ReferralFilters, value: string) => void;
  onClearFilters: () => void;
  referrerRoles: string[];
}

const FilterGrid = ({ filters, onFilterChange, referrerRoles }: Omit<ReferralFilterSheetProps, 'onClearFilters'>) => (
  <div className="grid grid-cols-1 gap-4">
    <div className="space-y-2">
      <Label>Lọc theo vai trò</Label>
      <Select value={filters.role} onValueChange={(value) => onFilterChange('role', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo vai trò" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{referrerRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Lọc theo chỉ tiêu</Label>
      <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
        <SelectTrigger><SelectValue placeholder="Lọc theo chỉ tiêu" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả chỉ tiêu</SelectItem>
          <SelectItem value="not-achieved">Chưa đạt</SelectItem>
          <SelectItem value="achieved">Đạt</SelectItem>
          <SelectItem value="exceeded">Vượt</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Sắp xếp</Label>
      <Select value={filters.sort} onValueChange={(value) => onFilterChange('sort', value)}>
        <SelectTrigger><SelectValue placeholder="Sắp xếp" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Mặc định</SelectItem>
          <SelectItem value="count-asc">Số người GT (tăng dần)</SelectItem>
          <SelectItem value="count-desc">Số người GT (giảm dần)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const ReferralFilterSheet = (props: ReferralFilterSheetProps) => {
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
            <SheetTitle>Bộ lọc</SheetTitle>
            <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Xóa
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
          <h4 className="font-medium leading-none">Bộ lọc</h4>
          <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
        <div className="p-4">
          <FilterGrid {...props} />
        </div>
      </PopoverContent>
    </Popover>
  );
};