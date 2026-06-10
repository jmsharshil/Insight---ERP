import { Loader2, TrendingUp, Calendar as CalIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "@/components/common/StatCard";
import { type CRMAnalytics } from "@/redux/slices/crmSlice";
import { formatDate } from "@/lib/utils";

interface AnalyticsTabProps {
  analytics: CRMAnalytics | null;
}

export default function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  if (!analytics)
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading analytics...</span>
      </div>
    );

  const COLORS = ["#3B82F6", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Conversion Rate"
          value={`${analytics.conversion_rate.toFixed(1)}%`}
          icon={TrendingUp}
          trendType="up"
          index={0}
        />
        <StatCard
          title="Avg Conversion Time"
          value={`${analytics.avg_conversion_days} days`}
          icon={CalIcon}
          index={1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-lg mb-4">Leads by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.by_source}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, count }: any) => `${source} (${count})`}
                >
                  {analytics.by_source.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-lg mb-4">Daily Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip labelFormatter={(v) => formatDate(v)} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
