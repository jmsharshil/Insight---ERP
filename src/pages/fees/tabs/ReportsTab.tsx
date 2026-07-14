import { useMemo } from "react";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Wallet, Clock, AlertCircle, RotateCcw, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const currentYear = new Date().getFullYear();

const formatModeName = (name: string) => {
  if (!name) return "";
  const modes: Record<string, string> = {
    cash: "Cash",
    cheque: "Cheque",
    upi: "UPI",
    dd: "Demand Draft",
    online: "Online",
  };
  return modes[name.toLowerCase()] || name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

interface ReportsTabProps {
  reportLoading: boolean;
  reportMonth: number;
  reportYear: number;
  setReportMonth: (m: number) => void;
  setReportYear: (y: number) => void;
  fetchReportData: () => void;
  billed: number;
  collected: number;
  pendingVal: number;
  discountVal: number;
  overdueVal: number;
  partialVal: number;
  approvalPendingVal: number;
  trendChartData: any[];
  modeChartData: any[];
  COLORS: string[];
}

export default function ReportsTab({
  reportLoading,
  reportMonth,
  reportYear,
  setReportMonth,
  setReportYear,
  fetchReportData,
  billed,
  collected,
  pendingVal,
  discountVal,
  overdueVal,
  partialVal,
  approvalPendingVal,
  trendChartData,
  modeChartData,
  COLORS,
}: ReportsTabProps) {
  if (reportLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">
            Financial Performance & Collection Report
          </h3>
          <p className="text-xs text-muted-foreground">
            Monthly breakdowns, collection efficiency, and channel distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Period:
            </span>
            <Select value={String(reportMonth)} onValueChange={(v) => setReportMonth(Number(v))}>
              <SelectTrigger className="h-7 w-28 border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, idx) => {
                  const mNum = idx + 1;
                  const name = new Date(2000, idx).toLocaleString("en-US", {
                    month: "long",
                  });
                  return (
                    <SelectItem key={mNum} value={String(mNum)}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={String(reportYear)} onValueChange={(v) => setReportYear(Number(v))}>
              <SelectTrigger className="h-7 w-20 border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear + i).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={fetchReportData}>
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Analytical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Total Receivable
            </span>
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-blue-950 dark:text-blue-100">
            {formatCurrency(billed)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Overall invoice amount generated</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Total Collected
            </span>
            <span className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-green-950 dark:text-green-100">
            {formatCurrency(collected)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-green-600 whitespace-nowrap">
              {billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-yellow-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Pending / Active
            </span>
            <span className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-yellow-950 dark:text-yellow-100">
            {formatCurrency(pendingVal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Fees currently within active billing cycles
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/5 to-violet-500/5 border border-purple-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Total Discount
            </span>
            <span className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-purple-950 dark:text-purple-100">
            {formatCurrency(discountVal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Total discounts/waivers granted</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500/5 to-rose-500/5 border border-red-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Overdue Amount
            </span>
            <span className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-red-950 dark:text-red-100">
            {formatCurrency(overdueVal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Outstanding dues past grace periods
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Total Partial Pending
            </span>
            <span className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-orange-950 dark:text-orange-100">
            {formatCurrency(partialVal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Partially settled installments</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border border-teal-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
              Approval Pending
            </span>
            <span className="p-2 bg-teal-500/10 text-teal-500 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-teal-950 dark:text-teal-100">
            {formatCurrency(approvalPendingVal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Recorded payments awaiting verification
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold">Monthly Collection Velocity</h4>
              <p className="text-xs text-muted-foreground">Historical fee collection comparison</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(255,255,255)",
                      border: "1px solid rgb(229,231,235)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#collectionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="col-span-1 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-1">Collection by Channels</h4>
            <p className="text-xs text-muted-foreground mb-4 font-normal">
              Collected fees distributed by payment modes
            </p>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            {modeChartData.length === 0 ? (
              <div className="text-xs text-muted-foreground">No distribution data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modeChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} tickFormatter={formatModeName} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(255,255,255)",
                      border: "1px solid rgb(229,231,235)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={formatModeName}
                    formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={200}>
                    {modeChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2.5 mt-4">
            {modeChartData.map((item, idx) => {
              const totalVal = modeChartData.reduce((acc, curr) => acc + curr.value, 0);
              const pct = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0;
              return (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium text-muted-foreground">
                      {formatModeName(item.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(item.value)}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
