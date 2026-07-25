import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setFaculty, setFacultyLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FacultyTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  const { faculty, facultyLoading } = useSelector((s: RootState) => s.attendance);
  const { user } = useAuth();

  const branches =
    dropdowns?.branches?.filter((b: any) => {
      if (user && user.role === "branch_manager" && user.branch) {
        return b.id === user.branch;
      }
      return true;
    }) || [];
  const facultyList =
    dropdowns?.faculty?.filter((f: any) => {
      if (user && user.role === "branch_manager" && user.branch) {
        return !f.branch_id || f.branch_id === user.branch;
      }
      return true;
    }) || [];

  const [f, setF] = useState({
    search: "",
    branch_id: user && user.role === "branch_manager" && user.branch ? user.branch : "",
    from_date: "",
    to_date: "",
    status: "",
  });

  const fetchFaculty = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    dispatch({
      type: attendanceActions.GET_FACULTY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.FACULTY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success)
          dispatch(setFaculty({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load faculty.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const pct = (v: number) =>
    v >= 75
      ? "bg-green-100 text-green-700"
      : v >= 50
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            placeholder="Search Employee"
            className="h-9 text-sm w-52 bg-muted/10"
            value={f.search}
            onChange={(e) => setF((p) => ({ ...p, search: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select
            value={f.branch_id}
            onValueChange={(v) => setF((p) => ({ ...p, branch_id: v === "all" ? "" : v }))}
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
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={f.status}
            onValueChange={(v) => setF((p) => ({ ...p, status: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="h-9 text-sm w-36 bg-muted/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="half_day">Half Day</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input
            type="date"
            className="h-9 text-sm w-36"
            value={f.from_date}
            onChange={(e) => setF((p) => ({ ...p, from_date: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input
            type="date"
            className="h-9 text-sm w-36"
            value={f.to_date}
            onChange={(e) => setF((p) => ({ ...p, to_date: e.target.value }))}
          />
        </div>
        <Button
          onClick={fetchFaculty}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
        >
          Apply
        </Button>
        <Button
          variant="outline"
          className="h-9 text-sm"
          onClick={() =>
            setF({
              search: "",
              branch_id: user && user.role === "branch_manager" && user.branch ? user.branch : "",
              from_date: "",
              to_date: "",
              status: "",
            })
          }
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>

      {facultyLoading ? (
        <TableSkeleton columns={6} rows={5} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {[
                  "Employee",
                  "Employee ID",
                  "Branch",
                  "Date",
                  "Status",
                  "Check In",
                  "Check Out",
                  "Action",
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
              {faculty.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No employee attendance records found.
                  </td>
                </tr>
              ) : (
                faculty.map((fac, i) => (
                  <motion.tr
                    key={fac.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {(fac.user_name || "??")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {fac.user_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {fac.employee_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {fac.branch_name}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {fac.date}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs font-semibold ${
                        fac.status === "present" ? "bg-green-100 text-green-700" :
                        fac.status === "late" ? "bg-yellow-100 text-yellow-700" :
                        fac.status === "half_day" ? "bg-orange-100 text-orange-700" :
                        fac.status === "absent" ? "bg-red-100 text-red-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {fac.status_display || fac.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fac.checked_in_at ? new Date(fac.checked_in_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fac.checked_out_at ? new Date(fac.checked_out_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold hover:bg-muted"
                        onClick={() => navigate(`/attendance/faculty/${fac.user_id || fac.user || fac.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> View
                      </Button>
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
