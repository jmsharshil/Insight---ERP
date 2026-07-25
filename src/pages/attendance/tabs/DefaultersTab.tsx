import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, X, AlertTriangle } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setDefaulters, setDefaultersLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DefaultersTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { defaulters, defaultersLoading, defaultersCount } = useSelector((s: RootState) => s.attendance);
  const { user } = useAuth();

  const branches = dropdowns?.branches?.filter((b: any) => {
    if (user && user.role === "branch_manager" && user.branch) {
      return b.id === user.branch;
    }
    return true;
  }) || [];
  const batches = dropdowns?.batches || [];

  const [filters, setFilters] = useState({
    branch_id: (user && user.role === "branch_manager" && user.branch) ? user.branch : "", batch_id: "",
    attendance_percentage_below: "",
    min_violations: "",
  });

  const fetchDefaulters = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_DEFAULTERS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.DEFAULTERS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setDefaultersLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setDefaulters({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load defaulters.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetchDefaulters(); }, []);

  const pct = (v: number) => v >= 75 ? "bg-green-100 text-green-700" : v >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select
            value={filters.branch_id}
            onValueChange={(v) => setFilters((f) => ({ ...f, branch_id: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Batch</Label>
          <Select
            value={filters.batch_id}
            onValueChange={(v) => setFilters((f) => ({ ...f, batch_id: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Attendance Below (%)</Label>
          <Input
            type="number" min="0"
            placeholder="75"
            className="h-9 text-sm w-28"
            value={filters.attendance_percentage_below}
            onChange={(e) =>
              setFilters((f) => ({ ...f, attendance_percentage_below: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Min Violations</Label>
          <Input
            type="number" min="0"
            placeholder="1"
            className="h-9 text-sm w-28"
            value={filters.min_violations}
            onChange={(e) => setFilters((f) => ({ ...f, min_violations: e.target.value }))}
          />
        </div>
        <Button onClick={fetchDefaulters} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setFilters({ branch_id: (user && user.role === "branch_manager" && user.branch) ? user.branch : "", batch_id: "", attendance_percentage_below: "", min_violations: "" })}>
          <X className="w-3 h-3 mr-1" />Clear
        </Button>
      </div>

      {defaultersLoading ? (
        <TableSkeleton columns={6} rows={6} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-foreground">Defaulter Students</span>
            </div>
            <span className="text-xs text-muted-foreground">{defaultersCount} students</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {[
                  "Student",
                  "Admission No.",
                  "Branch / Batch",
                  "Attendance %",
                  "Active Violations",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                    No defaulters found.
                  </td>
                </tr>
              ) : (
                defaulters.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xs font-semibold">
                          {d.student_profile.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {d.student_profile.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {d.student_profile.admission_number}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{d.student_profile.branch_name}</div>
                      <div className="text-muted-foreground">
                        {d.student_profile.batch_name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs font-semibold ${pct(d.attendance_percentage)}`}>
                        {d.attendance_percentage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {d.active_violations > 0 ? (
                        <Badge className="text-xs bg-red-100 text-red-700 font-semibold">
                          {d.active_violations} violations
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
