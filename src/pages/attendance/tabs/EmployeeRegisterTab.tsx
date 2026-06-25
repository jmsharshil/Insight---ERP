import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, CalendarDays, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  absent: { label: "Absent", className: "bg-red-50 text-red-700 border-red-200" },
  late: { label: "Late", className: "bg-amber-50 text-amber-700 border-amber-200" },
  half_day: { label: "Half Day", className: "bg-blue-50 text-blue-700 border-blue-200" },
  on_leave: { label: "On Leave", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

interface Props {
  dropdowns?: any;
}

export default function EmployeeRegisterTab({ dropdowns }: Props) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const isBranchManager = user && user.role === "branch_manager";
  const branches = dropdowns?.branches || [];

  const [branchId, setBranchId] = useState(isBranchManager && user.branch ? user.branch : "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (isBranchManager && user.branch && branchId !== user.branch) {
      setBranchId(user.branch);
    }
  }, [user]);

  const filteredBranches = useMemo(() => {
    if (!isBranchManager) return branches;
    return branches.filter((b: any) => b.id === user.branch);
  }, [branches, user]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!branchId || branchId === "all") {
      setEmployees([]);
      return;
    }

    setLoadingEmployees(true);
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: `/api/auth/users/?branch=${branchId}`,
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(list)) {
          // Format users appropriately. Make sure they don't have "student" or "parents" role.
          const staff = list.filter(
            (u: any) => u.role !== "student" && u.role !== "parents" && u.role !== "super_admin",
          );
          const formatted = staff.map((item: any) => ({
            id: item.id,
            user_id: item.id,
            name:
              item.full_name ||
              item.name ||
              `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
              item.email,
          }));
          setEmployees(formatted);
        } else {
          setEmployees([]);
        }
        setLoadingEmployees(false);
      },
      getError: () => {
        setEmployees([]);
        setLoadingEmployees(false);
        toast.error("Failed to load staff list.");
      },
    } as any);
  }, [branchId, dispatch, toast]);

  const [records, setRecords] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isAllFilter = !branchId || branchId === "all";

  useEffect(() => {
    if (employees.length > 0) {
      const initRecords: Record<string, string> = {};
      employees.forEach((emp: any) => {
        initRecords[emp.id] = "present"; // Default
      });
      setRecords(initRecords);
    } else {
      setRecords({});
    }
  }, [employees, date]); // reset on date change too

  const handleStatusChange = (empId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [empId]: status }));
  };

  const handleMarkAll = (status: string) => {
    const updated: Record<string, string> = {};
    employees.forEach((emp: any) => {
      updated[emp.id] = status;
    });
    setRecords(updated);
  };

  const handleSubmit = () => {
    if (isAllFilter) {
      toast.error("Please select a specific branch.");
      return;
    }
    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    const payloadRecords = employees.map((emp: any) => ({
      user_id: emp.id,
      status: records[emp.id],
    }));

    if (payloadRecords.length === 0) {
      toast.error("No employees to mark attendance for.");
      return;
    }

    setSubmitting(true);
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: "/api/v1/attendance/employee/",
      body: {
        branch_id: branchId,
        date: date,
        records: payloadRecords,
      },
      auth: true,
      getResponse: (res: any) => {
        toast.success(res?.message || "Employee attendance marked successfully!");
        setSubmitting(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to mark attendance.");
        setSubmitting(false);
      },
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full bg-muted/10">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {filteredBranches.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loadingEmployees ? (
        <div className="text-center py-12 text-muted-foreground text-sm bg-white rounded-xl border border-border">
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm bg-white rounded-xl border border-border">
          {isAllFilter
            ? "Please select a branch to view employees."
            : "No employees found for the selected branch."}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <div>
              <h3 className="font-semibold text-foreground">Employee List</h3>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleMarkAll("present")}
              >
                Mark All Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleMarkAll("absent")}
              >
                Mark All Absent
              </Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Attendance Status
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any, i: number) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(emp.name || "E").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={records[emp.id] === "present" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${records[emp.id] === "present" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                        onClick={() => handleStatusChange(emp.id, "present")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Present
                      </Button>
                      <Button
                        size="sm"
                        variant={records[emp.id] === "absent" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${records[emp.id] === "absent" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                        onClick={() => handleStatusChange(emp.id, "absent")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={records[emp.id] === "late" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${records[emp.id] === "late" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}`}
                        onClick={() => handleStatusChange(emp.id, "late")}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" /> Late
                      </Button>
                      <Button
                        size="sm"
                        variant={records[emp.id] === "half_day" ? "default" : "outline"}
                        className={`h-8 px-3 text-xs ${records[emp.id] === "half_day" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        onClick={() => handleStatusChange(emp.id, "half_day")}
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-1" /> Half Day
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-border flex justify-end bg-muted/10">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
