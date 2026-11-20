import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function FacultyWiseTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.role === "faculty") {
      setLoading(false);
      return;
    }
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.RESULTS_ANALYTICS.FACULTY_WISE,
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        setData(res?.data || res || []);
      },
      getError: (err: any) => {
        console.error("Failed to fetch faculty-wise results", err);
      }
    } as any);
  }, [dispatch, user?.role]);

  if (user?.role === "faculty") {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-border">
        <p className="text-muted-foreground">No faculty-wise results available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border/80">
              <th rowSpan={2} className="px-4 py-3 font-semibold text-left align-middle border-r border-border min-w-[200px]">
                Faculty
              </th>
              <th colSpan={4} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                Students & Pass Rate
              </th>
              <th colSpan={3} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                Marks
              </th>
              <th colSpan={7} className="px-3 py-2 font-semibold text-center bg-primary/10 text-primary border-r border-border text-[11px] tracking-wider">
                Percentage Comparison
              </th>
            </tr>
            <tr className="border-b border-border text-[11px]">
              {/* Students */}
              <th className="px-3 py-2 font-medium text-center">Total</th>
              <th className="px-3 py-2 font-medium text-center">Appeared</th>
              <th className="px-3 py-2 font-medium text-center">Passed</th>
              <th className="px-3 py-2 font-medium text-center border-r border-border">Pass %</th>
              {/* Marks */}
              <th className="px-3 py-2 font-medium text-center">Avg</th>
              <th className="px-3 py-2 font-medium text-center">Highest</th>
              <th className="px-3 py-2 font-medium text-center border-r border-border">Lowest</th>
              {/* Percentage Comparison */}
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Present Percentage">Present %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Pass (40%+) Percentage">≥40% Pass</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Aggregate (50%+) Percentage">≥50% Agg</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Exemption (60%+) Percentage">≥60% Exempt</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Average Marks Percentage">Avg %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Highest Marks Percentage">High %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5 border-r border-border" title="Lowest Marks Percentage">Low %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row: any, i: number) => {
              const pc = row.percentage_comparison;
              return (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground border-r border-border/50">
                    {row.faculty_name || "-"}
                  </td>
                  {/* Students */}
                  <td className="px-3 py-3 text-center">{row.total_students || 0}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.appeared_students ?? row.total_students ?? 0}</td>
                  <td className="px-3 py-3 text-center">{row.passed_students || 0}</td>
                  <td className="px-3 py-3 text-center border-r border-border/50">
                    <Badge variant="outline" className={
                      row.pass_percentage >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                      row.pass_percentage >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {row.pass_percentage ? row.pass_percentage.toFixed(1) : 0}%
                    </Badge>
                  </td>
                  {/* Marks */}
                  <td className="px-3 py-3 text-center font-medium">{row.average_marks ? row.average_marks.toFixed(1) : 0}</td>
                  <td className="px-3 py-3 text-center text-green-600 font-medium">{row.highest_marks || 0}</td>
                  <td className="px-3 py-3 text-center text-red-600 font-medium border-r border-border/50">{row.lowest_marks || 0}</td>
                  {/* Percentage Comparison */}
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.present_percentage != null ? (
                      <span className="font-medium text-foreground">{pc.present_percentage.toFixed(1)}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.pass_40_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {pc.pass_40_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.aggregate_50_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {pc.aggregate_50_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.exempt_60_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {pc.exempt_60_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-medium bg-primary/[0.02]">
                    {pc?.average_marks_percentage != null ? `${pc.average_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-green-600 font-medium bg-primary/[0.02]">
                    {pc?.highest_marks_percentage != null ? `${pc.highest_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-red-600 font-medium bg-primary/[0.02] border-r border-border/50">
                    {pc?.lowest_marks_percentage != null ? `${pc.lowest_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
