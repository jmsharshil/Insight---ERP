import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  CheckCircle,
  ShieldAlert,
  DollarSign,
  Wallet,
  MapPin,
  Clock,
} from "lucide-react";
import { dropdownActions, facultyAction } from "@/redux/actions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";
import PageHeader from "@/components/layout/PageHeader";

export default function FacultyPayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayrollDetail = (payrollId: string) => {
    setLoading(true);
    dispatch({
      type: facultyAction.GET_PAYROLL_DETAILS,
      method: "GET",
      endPoint: `/api/v1/payroll/${payrollId}/`,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        if (data) {
          setPayrollData(data);
        } else {
          toast.error("Failed to load payroll details.");
        }
        setLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to fetch payroll detail");
        setLoading(false);
      },
    } as any);
  };

  useEffect(() => {
    if (id) {
      fetchPayrollDetail(id);
    }
  }, [id]);

  const handleApprove = () => {
    dispatch({
      type: facultyAction.APPROVE_PAYROLL,
      method: "POST",
      endPoint: `/api/v1/payroll/${id}/approve/`,
      auth: true,
      getResponse: () => {
        toast.success("Payroll approved successfully.");
        fetchPayrollDetail(id!);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to approve payroll");
      },
    } as any);
  };

  const handleDisburse = () => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: `/api/v1/payroll/${id}/disburse/`,
      auth: true,
      getResponse: () => {
        toast.success("Payroll disbursed successfully.");
        fetchPayrollDetail(id!);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to disburse payroll");
      },
    } as any);
  };

  const handleSaveNote = (payslipId: string, note: string) => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "PATCH",
      endPoint: `/api/v1/payslips/${payslipId}/`,
      body: { deduction_note: note },
      auth: true,
      getResponse: () => {
        toast.success("Deduction note updated.");
        fetchPayrollDetail(id!);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update note");
      },
    } as any);
  };

  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  );

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "draft") return "bg-gray-100 text-gray-700 border-gray-200";
    if (s === "pending" || s === "pending_approval")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (s === "approved") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "disbursed") return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-150 text-gray-800";
  };

  const formatAmount = (amtStr: string | number) => {
    const amt = parseFloat(String(amtStr));
    return isNaN(amt)
      ? `₹${amtStr}`
      : `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading payroll details...</p>
        </div>
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">
          No payroll details found
        </h3>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="h-9 text-sm border-border hover:bg-muted"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payrolls
        </Button>
        <div className="flex items-center gap-3">
          {payrollData.status === "draft" && (
            <Button
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={handleApprove}
            >
              Approve Payroll
            </Button>
          )}
          {payrollData.status === "approved" && (
            <Button
              className="h-9 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={handleDisburse}
            >
              Disburse Payroll
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Payroll Details: ${monthNames[payrollData.month - 1] || payrollData.month} ${payrollData.year}`}
        subtitle={`Detailed view of payroll calculations for branch and faculty members`}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-primary" /> Branch / campus
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {payrollData.branch_name || payrollData.branch}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-primary" /> Total Amount
          </div>
          <div className="text-2xl font-extrabold text-primary">
            {formatAmount(payrollData.total_amount)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-primary" /> Status
          </div>
          <div>
            <Badge
              className={`text-xs font-semibold px-2.5 py-0.5 ${getStatusBadge(payrollData.status)}`}
            >
              {payrollData.status_display || payrollData.status}
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <User className="w-4 h-4 text-primary" /> Faculties
          </div>
          <div className="text-lg font-bold text-foreground">
            {payrollData.payslips?.length || 0} Members
          </div>
        </div>
      </div>

      {/* Meta Audit Trail */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 border-b border-border/60 pb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Processing Audit Trail
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground block font-medium">Generated By</span>
            <span className="font-semibold text-foreground">
              {payrollData.generated_by_name || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {payrollData.generated_at ? new Date(payrollData.generated_at).toLocaleString() : ""}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block font-medium">Approved By</span>
            <span className="font-semibold text-foreground">
              {payrollData.approved_by_name || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {payrollData.approved_at ? new Date(payrollData.approved_at).toLocaleString() : ""}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground block font-medium">Disbursed At</span>
            <span className="font-semibold text-foreground">
              {payrollData.disbursed_at ? new Date(payrollData.disbursed_at).toLocaleString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Faculty Payslips Details */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Faculty Payslips calculations
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            Showing {payrollData.payslips?.length || 0} payslips
          </span>
        </div>

        <DataTable
          data={payrollData.payslips || []}
          columns={[
            {
              key: "faculty_name",
              header: "Faculty",
              render: (r: any) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{r.faculty_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{r.employee_id}</div>
                </div>
              ),
            },
            {
              key: "basic_salary",
              header: "Basic Salary",
              render: (r: any) => formatAmount(r.basic_salary),
            },
            {
              key: "sessions_conducted",
              header: "Sessions / Hours",
              render: (r: any) => (
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground">{r.sessions_conducted} Sessions</div>
                  <div className="text-[10px] text-muted-foreground">
                    {r.total_session_hours} hrs
                  </div>
                </div>
              ),
            },
            {
              key: "hour_based_amount",
              header: "Hour-based Pay",
              render: (r: any) => formatAmount(r.hour_based_amount),
            },
            {
              key: "deductions",
              header: "Deductions & Reason",
              render: (r: any) => {
                const late = parseFloat(r.late_penalty || 0);
                const abs = parseFloat(r.absence_deductions || 0);
                const leave = parseFloat(r.leave_deductions || 0);
                const other = parseFloat(r.other_deductions || 0);
                const totalDeduction = late + abs + leave + other;

                return (
                  <div className="space-y-1">
                    <span
                      className={`font-semibold ${totalDeduction > 0 ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      {formatAmount(totalDeduction)}
                    </span>
                    {totalDeduction > 0 && (
                      <div className="text-[10px] text-red-600/90 flex flex-col gap-0.5 mt-0.5">
                        {late > 0 && <span>• Late Penalty: {formatAmount(late)}</span>}
                        {abs > 0 && <span>• Absence: {formatAmount(abs)}</span>}
                        {leave > 0 && <span>• Leave: {formatAmount(leave)}</span>}
                        {other > 0 && <span>• Other: {formatAmount(other)}</span>}
                      </div>
                    )}
                    {["draft", "pending", "pending_approval"].includes(payrollData.status?.toLowerCase()) ? (
                      <Input
                        placeholder="Add deduction note..."
                        defaultValue={r.deduction_note || ""}
                        className="h-7 text-[10px] mt-1.5 bg-muted/20 text-muted-foreground placeholder:text-muted-foreground/60"
                        onBlur={(e) => {
                          if (e.target.value !== (r.deduction_note || "")) {
                            handleSaveNote(r.id, e.target.value);
                          }
                        }}
                      />
                    ) : r.deduction_note ? (
                      <div className="text-[10px] text-muted-foreground italic mt-1.5 p-1.5 bg-muted/30 rounded border border-border/50">
                        <span className="font-semibold not-italic">Deduction Note:</span> {r.deduction_note}
                      </div>
                    ) : null}
                  </div>
                );
              },
            },
            {
              key: "bonus",
              header: "Bonus",
              render: (r: any) => (
                <span
                  className={`font-semibold ${parseFloat(r.bonus) > 0 ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {formatAmount(r.bonus)}
                </span>
              ),
            },
            {
              key: "net_salary",
              header: "Net Payable",
              render: (r: any) => (
                <span className="font-bold text-primary text-sm">{formatAmount(r.net_salary)}</span>
              ),
            },
            {
              key: "is_disbursed",
              header: "Status",
              render: (r: any) => (
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize font-semibold ${r.is_disbursed ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}
                >
                  {r.is_disbursed ? "Disbursed" : "Unpaid"}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
