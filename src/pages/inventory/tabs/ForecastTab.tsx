import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { inventoryActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setForecast, setForecastLoading } from "@/redux/slices/inventorySlice";
import type { ForecastItem } from "@/redux/slices/inventorySlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/common/Skeletons";

const FORECAST_STATUS = {
  healthy:  { badge: "bg-green-100 text-green-700",   icon: CheckCircle2,  label: "Healthy" },
  warning:  { badge: "bg-yellow-100 text-yellow-700", icon: AlertTriangle,  label: "Warning" },
  critical: { badge: "bg-red-100 text-red-700",       icon: TrendingDown,   label: "Critical" },
};

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function ForecastTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { forecast, forecastLoading } = useSelector((s: RootState) => s.inventory);

  const fetchForecast = () => {
    dispatch({
      type: inventoryActions.GET_FORECAST,
      method: "GET",
      endPoint: API.INVENTORY.FORECAST,
      auth: true,
      setLoading: (v: boolean) => dispatch(setForecastLoading(v)),
      getResponse: (res: any) => {
        // Forecast returns a plain array — not paginated
        const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        dispatch(setForecast(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load forecast"),
    });
  };

  useEffect(() => { fetchForecast(); }, []);

  const critical = forecast.filter(f => f.status === "critical").length;
  const warning  = forecast.filter(f => f.status === "warning").length;
  const healthy  = forecast.filter(f => f.status === "healthy").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">30-Day Stock Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Based on last 30 days of allocations.</p>
        </div>
        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={fetchForecast} disabled={forecastLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {!forecastLoading && forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Critical Items" value={critical} sub="Stockout in 30 days"     color="text-red-600" />
          <StatCard label="Warning Items"  value={warning}  sub="Near reorder level"       color="text-yellow-600" />
          <StatCard label="Healthy Items"  value={healthy}  sub="Sufficient stock"         color="text-green-600" />
        </div>
      )}

      {forecastLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Item", "Category", "Stock", "Reorder", "30d Usage", "Burn/day", "Days Left", "Status", "Message"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">No forecast data. Add items and allocations first.</td></tr>
              ) : (
                [...forecast]
                  .sort((a, b) => ({ critical: 0, warning: 1, healthy: 2 }[a.status] - { critical: 0, warning: 1, healthy: 2 }[b.status]))
                  .map((f, i) => {
                    const cfg  = FORECAST_STATUS[f.status] ?? FORECAST_STATUS.healthy;
                    const Icon = cfg.icon;
                    return (
                      <motion.tr key={f.item_id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{f.item_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.category}</td>
                        <td className="px-4 py-3 font-bold">
                          <span className={f.current_stock <= 0 ? "text-red-600" : f.current_stock <= f.reorder_level ? "text-yellow-600" : "text-green-600"}>
                            {f.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{f.reorder_level}</td>
                        <td className="px-4 py-3">{f.last_30d_usage}</td>
                        <td className="px-4 py-3">{f.daily_burn_rate.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={f.days_until_stockout <= 7 ? "text-red-600 font-bold" : f.days_until_stockout <= 30 ? "text-yellow-600 font-semibold" : "text-green-600"}>
                            {f.days_until_stockout > 365 ? "365+" : f.days_until_stockout}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${cfg.badge} text-xs gap-1`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs text-muted-foreground">{f.message}</p>
                        </td>
                      </motion.tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
