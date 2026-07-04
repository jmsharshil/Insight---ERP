import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { motion } from "framer-motion";
import { Users, CheckCircle, GraduationCap, Trophy, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.RESULTS_ANALYTICS.SUMMARY,
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        setData(res?.data || res);
      },
      getError: (err: any) => {
        console.error("Failed to fetch summary", err);
      }
    } as any);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-border">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  const overall = data.overall || {};

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Students
            </p>
            <h4 className="text-2xl font-bold font-heading">{overall.total_students || 0}</h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Passed Students
            </p>
            <h4 className="text-2xl font-bold font-heading">{overall.passed_students || 0}</h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Pass Percentage
            </p>
            <h4 className="text-2xl font-bold font-heading">
              {overall.pass_percentage ? overall.pass_percentage.toFixed(2) : 0}%
            </h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Avg Marks
            </p>
            <h4 className="text-2xl font-bold font-heading">
              {overall.average_marks ? overall.average_marks.toFixed(2) : 0}
            </h4>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Subjects */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-heading font-semibold mb-4 text-sm">Top Subjects (By Pass %)</h3>
          {data.top_subjects && data.top_subjects.length > 0 ? (
            <div className="space-y-3">
              {data.top_subjects.map((sub: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {sub.exam__subject__name || sub.subject_name || "Unknown Subject"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Students: {sub.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {sub.pass_pct ? sub.pass_pct.toFixed(1) : 0}% Pass
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Avg: {sub.avg_marks ? sub.avg_marks.toFixed(1) : 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subject data available.</p>
          )}
        </div>

        {/* Top Faculty */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-heading font-semibold mb-4 text-sm">Top Faculty (By Pass %)</h3>
          {data.top_faculty && data.top_faculty.length > 0 ? (
            <div className="space-y-3">
              {data.top_faculty.map((fac: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {fac.exam__faculty__user__name || fac.faculty_name || "Unknown Faculty"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Students: {fac.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {fac.pass_pct ? fac.pass_pct.toFixed(1) : 0}% Pass
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Avg: {fac.avg_marks ? fac.avg_marks.toFixed(1) : 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No faculty data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
