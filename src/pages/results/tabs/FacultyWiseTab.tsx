import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function FacultyWiseTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
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
  }, [dispatch]);

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
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Faculty</th>
              <th className="px-4 py-3 font-medium text-center">Total Students</th>
              <th className="px-4 py-3 font-medium text-center">Passed</th>
              <th className="px-4 py-3 font-medium text-center">Pass %</th>
              <th className="px-4 py-3 font-medium text-center">Avg Marks</th>
              <th className="px-4 py-3 font-medium text-center">Highest</th>
              <th className="px-4 py-3 font-medium text-center">Lowest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{row.faculty_name || "-"}</td>
                <td className="px-4 py-3 text-center">{row.total_students || 0}</td>
                <td className="px-4 py-3 text-center">{row.passed_students || 0}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className={
                    row.pass_percentage >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                    row.pass_percentage >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  }>
                    {row.pass_percentage ? row.pass_percentage.toFixed(1) : 0}%
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center font-medium">{row.average_marks ? row.average_marks.toFixed(1) : 0}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{row.highest_marks || 0}</td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{row.lowest_marks || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
