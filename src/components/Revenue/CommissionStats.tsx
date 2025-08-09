import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { DollarSign, TrendingUp, Percent } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommissionStatsProps {
  totalUpsaleAmount: number;
  totalUpsaleCount: number;
  totalCommission: number;
}

const CommissionStats = ({ totalUpsaleAmount, totalUpsaleCount, totalCommission }: CommissionStatsProps) => {
  const isMobile = useIsMobile();
  const formatValue = isMobile ? formatCurrencyShort : formatCurrency;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <StatCard
        title="Tổng tiền upsale"
        value={formatValue(totalUpsaleAmount)}
        icon={DollarSign}
      />
      <StatCard
        title="Tổng lượt upsale"
        value={totalUpsaleCount.toString()}
        icon={TrendingUp}
      />
      <StatCard
        title="Tổng hoa hồng"
        value={formatValue(totalCommission)}
        icon={Percent}
        className="text-green-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
      <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className={`text-lg md:text-2xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default CommissionStats;