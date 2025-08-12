import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceStatsProps {
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  totalGuests: number;
}

const ServiceStats = ({ totalRevenue, totalPaid, totalUnpaid, totalGuests }: ServiceStatsProps) => {
  const isMobile = useIsMobile();
  const formatValue = isMobile ? formatCurrencyShort : formatCurrency;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <StatCard
        title="Tổng khách"
        value={totalGuests.toString()}
      />
      <StatCard
        title="Tổng doanh thu"
        value={formatValue(totalRevenue)}
      />
      <StatCard
        title="Đã thanh toán"
        value={formatValue(totalPaid)}
        className="text-green-600"
      />
      <StatCard
        title="Chưa thanh toán"
        value={formatValue(totalUnpaid)}
        className="text-red-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, className }: { title: string; value: string; className?: string }) => (
  <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
      <CardTitle className="text-xs md:text-sm font-medium text-slate-500">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-3 md:p-4 pt-0">
      <div className={`text-lg md:text-2xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default ServiceStats;