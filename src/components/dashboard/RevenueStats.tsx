import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface RevenueStatsProps {
  totalSponsorship: number;
  totalPaid: number;
  totalUnpaid: number;
}

const RevenueStats = ({ totalSponsorship, totalPaid, totalUnpaid }: RevenueStatsProps) => {
  const isMobile = useIsMobile();
  const formatValue = isMobile ? formatCurrencyShort : formatCurrency;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Tổng tài trợ"
        value={formatValue(totalSponsorship)}
        icon={DollarSign}
      />
      <StatCard
        title="Tổng đã thanh toán"
        value={formatValue(totalPaid)}
        icon={CheckCircle}
        className="text-green-600"
      />
      <StatCard
        title="Tổng chưa thanh toán"
        value={formatValue(totalUnpaid)}
        icon={AlertCircle}
        className="text-red-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
  <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <Icon className={`h-5 w-5 text-muted-foreground ${className}`} />
    </CardHeader>
    <CardContent className="p-4 md:p-6 pt-0">
      <div className={`text-2xl md:text-3xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default RevenueStats;