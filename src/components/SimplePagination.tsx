import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SimplePaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
}

export const SimplePagination = ({ currentPage, onPageChange, hasNextPage }: SimplePaginationProps) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};