import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { admissionActions } from "@/redux/actions";
import { setAdmissions, setAdmissionsLoading, setAdmissionsError } from "@/redux/slices/admissionSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useDropdown } from "@/hooks/useDropdown";

import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import type { AdmissionRecord } from "@/redux/slices/admissionSlice";
import { TableSkeleton } from "@/components/common/Skeletons";
import { formatCurrency } from "@/lib/utils";

export default function AdmissionsTab() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  
  const { admissions, count: admissionsCount, loading: admissionsLoading } = useSelector((state: RootState) => state.admissions);
  const [rejectState, setRejectState] = useState<{ id: string | number; reason: string } | null>(null);

  const [page, setPage] = useState<number>(1);
  const pageSize = 50;
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");

  const { options: branches, fetchOptions: fetchBranches } = useDropdown("branches", false);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const isSuperAdmin = user?.role === "super_admin";

  const buildEndPoint = (pageNumber = page) => {
    let url = API.ADMISSIONS.LIST;
    const params = new URLSearchParams();

    params.append("page", String(pageNumber));
    params.append("page_size", String(pageSize));

    if (user && user.role === "branch_manager" && user.branch) {
      params.append("branch", user.branch);
    } else if (isSuperAdmin && filterBranch !== "all") {
      params.append("branch", filterBranch);
    }

    if (filterBatch !== "all") {
      params.append("batch_attempt", filterBatch);
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };

  const filteredAdmissions = useMemo(() => {
    if (!user || user.role === "super_admin") return admissions;

    let filtered = admissions;

    if (user.branch) {
      filtered = filtered.filter((a: any) => {
        const branchId = typeof a.branch === "object" && a.branch !== null ? a.branch.id : a.branch;
        return branchId === user.branch;
      });
    }

    if (user.role === "counsellor") {
      filtered = filtered.filter((a: any) => {
        const counsellorId = typeof a.assigned_counsellor === "object" && a.assigned_counsellor !== null
          ? a.assigned_counsellor.id || a.assigned_counsellor._id
          : a.assigned_counsellor;
        return counsellorId === user.id;
      });
    }

    return filtered;
  }, [admissions, user]);

  useEffect(() => {
    dispatch({
      type: admissionActions.GET_ADMISSIONS,
      method: "GET",
      endPoint: buildEndPoint(page),
      auth: true,
      setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setAdmissions({ data: res.data, count: res.count ?? res.data?.length ?? 0 }));
        } else {
          dispatch(setAdmissionsError("Unexpected response format"));
          toast.error("Failed to load admissions data.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch admissions";
        dispatch(setAdmissionsError(msg));
        toast.error(msg);
      },
    });
  }, [dispatch, toast, user, isSuperAdmin, filterBranch, filterBatch, page]);

  const admissionCols: DataTableColumn<AdmissionRecord>[] = [
    { key: "id", header: "ID", className: "font-mono text-xs w-16" },
    { key: "student", header: "Student", exportValue: (r) => `${r.first_name || ""} ${r.surname || ""}`.trim(), render: (r) => <span className="font-medium">{r.first_name || ""} {r.surname || ""}</span> },
    { key: "contact", header: "Contact", exportValue: (r) => `${r.phone_student || ""} ${r.email || ""}`.trim(), render: (r) => <div className="text-xs"><div>{r.phone_student || "—"}</div><div className="text-muted-foreground">{r.email || "—"}</div></div> },
    { 
      key: "course", 
      header: "Course", 
      exportValue: (r) => (typeof r.course === "string" ? r.course : (r.course as any)?.name || ""), 
      render: (r) => (
        <span className="capitalize">
          {typeof r.course === "string" 
            ? r.course.replace(/_/g, " ") 
            : (r.course as any)?.name?.replace(/_/g, " ") || "—"}
        </span>
      ) 
    },
    { key: "batch", header: "Batch Attempt", exportValue: (r) => r.batch_attempt || "", render: (r) => <span className="capitalize">{r.batch_attempt || "—"}</span> },
    {
      key: "payment_plan",
      header: "Payment Plan",
      exportValue: (r) => r.payment_type || "N/A",
      render: (r) => {
        if (!r.payment_type) return <span className="text-xs text-muted-foreground">—</span>;
        if (r.payment_type === "token") {
          return (
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-[10px] px-1.5 py-0 font-medium capitalize">
                  Token {r.payment_mode ? `• ${r.payment_mode}` : "Plan"}
                </Badge>
              </div>
              {r.remaining_fees ? (
                <div className="text-[11px] font-semibold text-amber-700">
                  Due: {formatCurrency(Number(r.remaining_fees))}
                </div>
              ) : null}
            </div>
          );
        }
        if (r.payment_type === "full_payment") {
          return (
            <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0 font-medium">
              Full Payment
            </Badge>
          );
        }
        if (r.payment_type === "finance") {
          return (
            <Badge variant="outline" className="border-blue-400 bg-blue-50 text-blue-800 text-[10px] px-1.5 py-0 font-medium">
              Finance
            </Badge>
          );
        }
        return <span className="text-xs capitalize">{r.payment_type}</span>;
      },
    },
    { key: "status", header: "Status", exportValue: (r) => r.status_display || r.status || "", render: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">{r.status_display || r.status || "—"}</span> },
    { key: "counsellor", header: "Counsellor", exportValue: (r) => r.assigned_counsellor ? r.assigned_counsellor.name : "-", render: (r) => r.assigned_counsellor ? r.assigned_counsellor.name : "-" },
    { key: "submitted_at", header: "Submitted At", render: (r) => <span className="text-xs text-muted-foreground">{r.submitted_at || "—"}</span> },
    {
      key: "actions", header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admissions/${r.id}`); }}>View Profile</DropdownMenuItem>
            {(r.status === "approval_pending" || r.status === "payment_submitted") && (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  dispatch({
                    type: admissionActions.APPROVE_ADMISSION,
                    method: "POST",
                    endPoint: API.ADMISSIONS.APPROVE(r.id),
                    auth: true,
                    setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
                    getResponse: () => {
                      toast.success("Admission approved successfully!");
                      dispatch({
                        type: admissionActions.GET_ADMISSIONS,
                        method: "GET",
                        endPoint: buildEndPoint(),
                        auth: true,
                        setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
                        getResponse: (res: any) => {
                          if (res?.success && res?.data) {
                            dispatch(setAdmissions(res.data));
                          }
                        },
                        getError: () => {}
                      });
                    },
                    getError: (err: any) => {
                      toast.error(err?.response?.data?.message || err?.message || "Failed to approve admission");
                    }
                  });
                }}>
                  Approve
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectState({ id: r.id, reason: "Student does not meet the eligibility criteria." });
                  }}
                >
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (admissionsLoading && admissions.length === 0) {
    return <TableSkeleton columns={8} rows={6} className="mt-0" />;
  }

  return (
    <div className="mt-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {isSuperAdmin && (
            <div className="w-full sm:w-64 space-y-1">
              <Label className="text-xs">Branch</Label>
              <Select value={filterBranch} onValueChange={(val) => { setFilterBranch(val); setPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={String(b.value)} value={String(b.value)}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-full sm:w-64 space-y-1">
            <Label className="text-xs">Batch Attempt</Label>
            <Select value={filterBatch} onValueChange={(val) => { setFilterBatch(val); setPage(1); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="june">June</SelectItem>
                <SelectItem value="oct">October</SelectItem>
                <SelectItem value="dec">December</SelectItem>
                <SelectItem value="feb">February</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-end pb-0.5">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium bg-muted/40 border-border">
            Total Admissions: <span className="font-bold ml-1.5 text-foreground">{admissionsCount || filteredAdmissions.length}</span>
          </Badge>
        </div>
      </div>

      <DataTable 
        columns={admissionCols} 
        data={filteredAdmissions} 
        exportable={isSuperAdmin} 
        onRowClick={(r) => navigate(`/admissions/${r.id}`)}
        serverPagination={true}
        currentPage={page}
        totalCount={admissionsCount || filteredAdmissions.length}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        loading={admissionsLoading}
      />

      <ConfirmDialog
        open={!!rejectState}
        onOpenChange={(o) => !o && setRejectState(null)}
        title="Reject Admission"
        description="Please provide a reason for rejecting this admission."
        variant="danger"
        confirmLabel="Reject"
        onConfirm={() => {
          if (!rejectState) return;
          dispatch({
            type: admissionActions.REJECT_ADMISSION,
            method: "POST",
            endPoint: API.ADMISSIONS.REJECT(rejectState.id),
            body: { reason: rejectState.reason },
            auth: true,
            setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
            getResponse: () => {
              toast.success("Admission rejected.");
              dispatch({
                type: admissionActions.GET_ADMISSIONS,
                method: "GET",
                endPoint: buildEndPoint(),
                auth: true,
                setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
                getResponse: (res: any) => {
                  if (res?.success && res?.data) {
                    dispatch(setAdmissions(res.data));
                  }
                },
                getError: () => {}
              });
            },
            getError: (err: any) => {
              toast.error(err?.response?.data?.message || err?.message || "Failed to reject admission");
            }
          });
        }}
      >
        <div className="mt-2">
          <Label className="mb-1 block text-sm">Reason for rejection</Label>
          <Textarea 
            value={rejectState?.reason || ""} 
            onChange={(e) => setRejectState(prev => prev ? { ...prev, reason: e.target.value } : null)}
            placeholder="Enter reason..."
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
