import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Eye, CheckCircle2, Send, Trash2, RefreshCw } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setRuns, setRunsLoading, addRun,
  updateRunInList, removeRun, setSelectedRun,
} from "@/redux/slices/payrollSlice";
import type { PayrollRun } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const MONTHS = [
  {v:"all",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [
  {v:"all",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},
  {v:"2026",l:"2026"},{v:"2027",l:"2027"},
];
const MONTH_NUMS = MONTHS.slice(1); // no "All" for generate
const YEAR_NUMS  = YEARS.slice(1);

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  disbursed:        "bg-blue-100 text-blue-700",
};

const MONTH_NAMES: Record<string, string> = {
  "1":"Jan","2":"Feb","3":"Mar","4":"Apr","5":"May","6":"Jun",
  "7":"Jul","8":"Aug","9":"Sep","10":"Oct","11":"Nov","12":"Dec",
};

interface PayrollRunsTabProps {
  branches:       { id: string; name: string }[];
  onViewPayslips: (run: PayrollRun) => void;
}

export default function PayrollRunsTab({ branches, onViewPayslips }: PayrollRunsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { runs, runsLoading } = useSelector((s: RootState) => s.payroll);

  const role = user?.role ?? "";
  const isAdmin    = ["super_admin","branch_manager"].includes(role);
  const canApprove = ["super_admin","branch_manager"].includes(role);
  const canDisburse= ["super_admin","accountant"].includes(role);
  const canGenerate= ["super_admin","branch_manager"].includes(role);
  const canDelete  = ["super_admin","branch_manager"].includes(role);

  // Filter state
  const d = new Date();
  const [fMonth,    setFMonth]    = useState("all");
  const [fYear,     setFYear]     = useState(String(d.getFullYear()));
  const [fStatus,   setFStatus]   = useState("all");
  const [fBranch,   setFBranch]   = useState("all");

  // Generate form state
  const [genMonth,  setGenMonth]  = useState(String(d.getMonth() + 1));
  const [genYear,   setGenYear]   = useState(String(d.getFullYear()));
  const [genBranch, setGenBranch] = useState(branches[0]?.id ?? "");
  const [genLoading, setGenLoading] = useState(false);

  // Action state
  const [actionTarget, setActionTarget] = useState<{ run: PayrollRun; type: "approve"|"disburse"|"delete"|"submit" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRuns = () => {
    const p = new URLSearchParams();
    if (fMonth && fMonth !== "all")  p.set("month",     fMonth);
    if (fYear && fYear !== "all")   p.set("year",      fYear);
    if (fStatus && fStatus !== "all") p.set("status",    fStatus);
    if (fBranch && fBranch !== "all") p.set("branch_id", fBranch);
    dispatch({
      type: payrollActions.GET_RUNS,
      method: "GET",
      endPoint: `${API.PAYROLL.RUNS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setRunsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setRuns(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load payroll runs"),
    });
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleGenerate = () => {
    if (!genBranch) { toast.error("Please select a branch."); return; }
    dispatch({
      type: payrollActions.GENERATE_PAYROLL,
      method: "POST",
      endPoint: API.PAYROLL.RUNS,
      body: { branch_id: genBranch, month: Number(genMonth), year: Number(genYear) },
      auth: true,
      setLoading: (v: boolean) => setGenLoading(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Payroll generated.");
          fetchRuns();
        } else toast.error("Failed to generate payroll.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to generate payroll"),
    });
  };

  const executeAction = () => {
    if (!actionTarget) return;
    const { run, type } = actionTarget;

    const actionMap = {
      approve:  { actionType: payrollActions.APPROVE_RUN,  method: "POST" as const,  endPoint: API.PAYROLL.APPROVE(run.id),  successMsg: "Payroll approved." },
      disburse: { actionType: payrollActions.DISBURSE_RUN, method: "POST" as const,  endPoint: API.PAYROLL.DISBURSE(run.id), successMsg: "Payroll disbursed." },
      submit:   { actionType: payrollActions.UPDATE_RUN,   method: "PATCH" as const, endPoint: API.PAYROLL.RUN_DETAIL(run.id), successMsg: "Submitted for approval." },
      delete:   { actionType: payrollActions.DELETE_RUN,   method: "DELETE" as const,endPoint: API.PAYROLL.RUN_DETAIL(run.id), successMsg: "Payroll run deleted." },
    };

    const cfg = actionMap[type];

    dispatch({
      type: cfg.actionType,
      method: cfg.method,
      endPoint: cfg.endPoint,
      body: type === "submit" ? { status: "pending_approval" } : undefined,
      auth: true,
      setLoading: (v: boolean) => setActionLoading(v),
      getResponse: (res: any) => {
        toast.success(cfg.successMsg);
        setActionTarget(null);
        if (type === "delete") dispatch(removeRun(run.id));
        else fetchRuns();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to ${type}.`);
        setActionTarget(null);
      },
    });
  };

  const confirmMessages: Record<string, { title: string; desc: string; label: string; variant?: "danger" }> = {
    approve:  { title: "Approve Payroll Run?", desc: "This will lock the payroll and notify employees.", label: "Approve" },
    disburse: { title: "Disburse Payroll?",    desc: "This is final. All employees will receive salary notifications.", label: "Disburse" },
    submit:   { title: "Submit for Approval?", desc: "The payroll run will be sent to the branch manager for review.", label: "Submit" },
    delete:   { title: "Delete Payroll Run?",  desc: "This is irreversible. All payslip data will be removed.", label: "Delete", variant: "danger" },
  };

  return (
    <div className="space-y-5">
      {/* Generate Panel */}
      {canGenerate && (
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Generate New Payroll Run
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">
                Branch <span className="text-red-500">*</span>
              </Label>
              <Select value={genBranch} onValueChange={setGenBranch}>
                <SelectTrigger className="h-9 text-sm w-48">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger className="h-9 text-sm w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NUMS.map((m) => (
                    <SelectItem key={m.v} value={m.v}>
                      {m.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={genYear} onValueChange={setGenYear}>
                <SelectTrigger className="h-9 text-sm w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_NUMS.map((y) => (
                    <SelectItem key={y.v} value={y.v}>
                      {y.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={genLoading || !genBranch}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {genLoading ? "Generating…" : "Generate Payroll"}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={fMonth} onValueChange={setFMonth}>
            <SelectTrigger className="h-9 text-sm w-36">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.v} value={m.v}>
                  {m.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={fYear} onValueChange={setFYear}>
            <SelectTrigger className="h-9 text-sm w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y.v} value={y.v}>
                  {y.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={fBranch} onValueChange={setFBranch}>
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={fetchRuns}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Runs Table */}
      {runsLoading ? (
        <TableSkeleton columns={6} rows={5} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Payroll Runs</span>
            <span className="text-xs text-muted-foreground">{runs.length} run(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    "Period",
                    "Branch",
                    "Employees",
                    "Total Amount",
                    "Status",
                    "Generated",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">
                      No payroll runs found.
                    </td>
                  </tr>
                ) : (
                  runs.map((run, i) => (
                    <motion.tr
                      key={run.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {MONTH_NAMES[String(run.month)] ?? run.month} {run.year}
                      </td>
                      <td className="px-4 py-3 text-xs">{run.branch_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{run.faculty_count} employees</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                        ₹{Number(run.total_amount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs capitalize ${STATUS_BADGE[run.status] ?? ""}`}>
                          {run.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(run.generated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* View Payslips */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 px-2"
                            onClick={() => {
                              dispatch(setSelectedRun(run));
                              onViewPayslips(run);
                            }}
                          >
                            <Eye className="w-3 h-3" /> Payslips
                          </Button>

                          {/* Submit for Review (draft → pending_approval) */}
                          {run.status === "draft" && canApprove && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 px-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                              onClick={() => setActionTarget({ run, type: "submit" })}
                            >
                              Submit
                            </Button>
                          )}

                          {/* Approve */}
                          {run.status === "pending_approval" && canApprove && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 px-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setActionTarget({ run, type: "approve" })}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </Button>
                          )}

                          {/* Disburse */}
                          {run.status === "approved" && canDisburse && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setActionTarget({ run, type: "disburse" })}
                            >
                              <Send className="w-3 h-3" /> Disburse
                            </Button>
                          )}

                          {/* Delete */}
                          {["draft", "pending_approval"].includes(run.status) && canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setActionTarget({ run, type: "delete" })}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {actionTarget && (
        <ConfirmDialog
          open={!!actionTarget}
          onOpenChange={(o) => !o && setActionTarget(null)}
          title={confirmMessages[actionTarget.type].title}
          description={confirmMessages[actionTarget.type].desc}
          confirmLabel={actionLoading ? "Processing…" : confirmMessages[actionTarget.type].label}
          variant={confirmMessages[actionTarget.type].variant}
          onConfirm={executeAction}
        />
      )}
    </div>
  );
}
