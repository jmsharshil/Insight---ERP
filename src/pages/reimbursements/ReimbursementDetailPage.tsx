import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { reimbursementActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/layout/PageHeader";
import type { Reimbursement } from "@/types/reimbursement.types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Trash2, Download, FileText, User, MapPin, CalendarDays, IndianRupee } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import RejectionModal from "./components/RejectionModal";
import { Skeleton } from "@/components/ui/skeleton";

const ADMIN_ROLES = ['super_admin', 'admin_senior_executive', 'admin_executive', 'accountant'];
const BRANCH_MGR = ['branch_manager'];
const ALL_APPROVERS = [...ADMIN_ROLES, ...BRANCH_MGR];

export default function ReimbursementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<Reimbursement | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isApprover = user && ALL_APPROVERS.includes(user.role);
  const isGlobalAdmin = user && ADMIN_ROLES.includes(user.role);

  const fetchClaim = () => {
    if (!id) return;
    dispatch({
      type: reimbursementActions.GET_REIMBURSEMENT_DETAIL,
      method: "GET",
      endPoint: API.REIMBURSEMENTS.DETAIL(id),
      auth: true,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: (res: any) => {
        if (res?.success) setClaim(res.data);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to load claim details");
        navigate("/reimbursements");
      },
    });
  };

  useEffect(() => {
    setPageTitle("Reimbursement Details");
    fetchClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApprove = () => {
    if (!id) return;
    dispatch({
      type: reimbursementActions.APPROVE_REIMBURSEMENT,
      method: "POST",
      endPoint: API.REIMBURSEMENTS.APPROVE(id),
      auth: true,
      setLoading: (val: boolean) => setActionLoading(val),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim approved successfully");
          fetchClaim();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to approve claim");
      },
    });
  };

  const handleReject = (reason: string) => {
    if (!id) return;
    dispatch({
      type: reimbursementActions.REJECT_REIMBURSEMENT,
      method: "POST",
      endPoint: API.REIMBURSEMENTS.REJECT(id),
      body: { rejection_reason: reason },
      auth: true,
      setLoading: (val: boolean) => setActionLoading(val),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim rejected");
          setIsRejectOpen(false);
          fetchClaim();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to reject claim");
      },
    });
  };

  const handleDelete = () => {
    if (!id) return;
    dispatch({
      type: reimbursementActions.DELETE_REIMBURSEMENT,
      method: "DELETE",
      endPoint: API.REIMBURSEMENTS.DETAIL(id),
      auth: true,
      setLoading: (val: boolean) => setActionLoading(val),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim deleted");
          setIsDeleteOpen(false);
          navigate("/reimbursements");
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete claim");
        setIsDeleteOpen(false);
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton width={40} height={40} borderRadius={8} />
          <div className="space-y-2">
            <Skeleton width={220} height={22} />
            <Skeleton width={300} height={14} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Expense Details */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
              <Skeleton width={140} height={18} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton width={40} height={40} borderRadius={8} />
                    <div className="space-y-1.5">
                      <Skeleton width={90} height={12} />
                      <Skeleton width={120} height={16} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border space-y-2">
                <Skeleton width={80} height={12} />
                <Skeleton height={14} count={2} />
              </div>
              <div className="pt-4 border-t border-border space-y-3">
                <Skeleton width={140} height={12} />
                <Skeleton height={56} borderRadius={8} />
              </div>
            </div>
          </div>

          {/* Right column — Status sidebar */}
          <div>
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
              <Skeleton width={130} height={18} />
              <div className="space-y-3">
                <Skeleton width={90} height={12} />
                <Skeleton width={120} height={28} borderRadius={16} />
              </div>
              <div className="pt-4 border-t border-border space-y-2">
                <Skeleton width={90} height={12} />
                <Skeleton width={140} height={14} />
                <Skeleton width={100} height={10} />
              </div>
              <div className="pt-4 border-t border-border space-y-3">
                <Skeleton height={40} borderRadius={8} />
                <Skeleton height={40} borderRadius={8} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!claim) return null;

  const canApproveReject = isApprover && claim.status === "pending" && (isGlobalAdmin || claim.branch === user?.branch);
  const canDelete = claim.status === "pending" && (claim.user === user?.id || isGlobalAdmin);

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={claim.title}
          subtitle={`Claim submitted by ${claim.user_name} on ${formatDate(claim.created_at)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Expense Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary-dark">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Claim Amount</p>
                  <p className="text-xl font-bold text-text-primary">₹{Number(claim.amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Expense Date</p>
                  <p className="font-medium text-text-primary">{formatDate(claim.expense_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Claimant</p>
                  <p className="font-medium text-text-primary">{claim.user_name}</p>
                  <p className="text-xs text-muted-foreground">{claim.user_role.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Branch</p>
                  <p className="font-medium text-text-primary">{claim.branch_name}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-medium mb-2">Description</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{claim.description || "No description provided."}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-medium mb-3">Supporting Document</p>
              {claim.proof ? (
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">Receipt Document</p>
                      <p className="text-xs text-muted-foreground">Uploaded with claim</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={claim.proof} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-2" /> View File
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No proof document uploaded.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Status & Review</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-2">Current Status</p>
                {claim.status === "pending" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/10 text-warning">
                    <Clock className="w-4 h-4 mr-2" /> Pending Approval
                  </span>
                )}
                {claim.status === "approved" && (
                  <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium", claim.is_paid ? "bg-primary/10 text-primary-dark" : "bg-success/10 text-success")}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> {claim.is_paid ? "Paid via Payroll" : "Approved"}
                  </span>
                )}
                {claim.status === "rejected" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive">
                    <XCircle className="w-4 h-4 mr-2" /> Rejected
                  </span>
                )}
              </div>

              {claim.status === "approved" && claim.approved_by_name && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Approved By</p>
                  <p className="font-medium text-text-primary">{claim.approved_by_name}</p>
                  <p className="text-xs text-muted-foreground">on {formatDate(claim.approved_at || "")}</p>
                  
                  {claim.payroll_run && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="font-medium">Payroll Integration</p>
                      <p className="text-muted-foreground">Processed in month {claim.payroll_month}/{claim.payroll_year}</p>
                    </div>
                  )}
                </div>
              )}

              {claim.status === "rejected" && claim.rejected_by_name && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Rejected By</p>
                  <p className="font-medium text-text-primary">{claim.rejected_by_name}</p>
                  <p className="text-xs text-muted-foreground">on {formatDate(claim.rejected_at || "")}</p>
                  
                  <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
                    <p className="font-medium text-destructive mb-1">Rejection Reason:</p>
                    <p className="text-muted-foreground">{claim.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>

            {canApproveReject && (
              <div className="pt-6 border-t border-border space-y-3">
                <Button className="w-full" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approve Claim
                </Button>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => setIsRejectOpen(true)} disabled={actionLoading}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Claim
                </Button>
              </div>
            )}

            {canDelete && !canApproveReject && (
              <div className="pt-6 border-t border-border">
                <Button variant="destructive" className="w-full" onClick={() => setIsDeleteOpen(true)} disabled={actionLoading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel / Delete Claim
                </Button>
              </div>
            )}
            
            {canDelete && canApproveReject && (
               <div className="pt-3">
                 <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleteOpen(true)} disabled={actionLoading}>
                   Delete Claim
                 </Button>
               </div>
            )}

          </div>
        </div>
      </div>

      <RejectionModal
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        onSubmit={handleReject}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Reimbursement Claim"
        description="Are you sure you want to delete this claim? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete Claim"
        variant="danger"
      />
    </div>
  );
}
