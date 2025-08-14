import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface DuplicateGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: any[];
  onConfirmSkip: () => void;
  onConfirmImportAnyway: () => void;
}

const CopyColumnButton = ({ data, columnKey, label }: { data: any[], columnKey: string, label: string }) => {
  const handleCopy = () => {
    const textToCopy = data.map(row => row[columnKey] || '').join('\n');
    navigator.clipboard.writeText(textToCopy);
    showSuccess(`Đã sao chép danh sách ${label}!`);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      <Copy className="h-3 w-3" />
    </Button>
  );
};

export const DuplicateGuestDialog = ({
  open,
  onOpenChange,
  duplicates,
  onConfirmSkip,
  onConfirmImportAnyway,
}: DuplicateGuestDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Phát hiện {duplicates.length} dòng bị trùng số điện thoại</AlertDialogTitle>
          <AlertDialogDescription>
            Vui lòng chọn cách xử lý. Bạn có thể bỏ qua các dòng này hoặc import nhưng xóa SĐT và thêm ghi chú.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-[50vh] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Tên <CopyColumnButton data={duplicates} columnKey="name" label="Tên" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Vai trò <CopyColumnButton data={duplicates} columnKey="role" label="Vai trò" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    SĐT <CopyColumnButton data={duplicates} columnKey="phone" label="SĐT" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Người giới thiệu <CopyColumnButton data={duplicates} columnKey="referrer" label="Người giới thiệu" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.referrer}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmSkip}>
            Import, bỏ qua dòng trùng
          </AlertDialogAction>
          <AlertDialogAction onClick={onConfirmImportAnyway}>
            Import, xóa SĐT dòng trùng
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};