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

const CopyButton = ({ text }: { text: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    showSuccess("Đã sao chép!");
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
                <TableHead>Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Người giới thiệu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="flex items-center gap-1">
                    {row.name} <CopyButton text={row.name} />
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    {row.role} <CopyButton text={row.role} />
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    {row.phone} <CopyButton text={row.phone} />
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    {row.referrer} <CopyButton text={row.referrer} />
                  </TableCell>
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