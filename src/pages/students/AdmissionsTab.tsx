import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { admissionActions } from "@/redux/actions";
import { setAdmissions, setAdmissionsLoading, setAdmissionsError } from "@/redux/slices/admissionSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { AdmissionRecord } from "@/redux/slices/admissionSlice";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function AdmissionsTab() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  
  const { admissions, loading: admissionsLoading } = useSelector((state: RootState) => state.admissions);
  const [rejectState, setRejectState] = useState<{ id: string | number; reason: string } | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    dispatch({
      type: admissionActions.GET_ADMISSIONS,
      method: "GET",
      endPoint: API.ADMISSIONS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setAdmissions(res.data));
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
  }, [dispatch, toast]);

  const admissionCols: DataTableColumn<AdmissionRecord>[] = [
    { key: "id", header: "ID", className: "font-mono text-xs w-16" },
    { key: "student", header: "Student", render: (r) => <span className="font-medium">{r.first_name} {r.surname}</span> },
    { key: "contact", header: "Contact", render: (r) => <div className="text-xs"><div>{r.phone_student}</div><div className="text-muted-foreground">{r.email}</div></div> },
    { key: "course", header: "Course", render: (r) => <span className="capitalize">{r.course.replace(/_/g, " ")}</span> },
    { key: "batch", header: "Batch Attempt", render: (r) => <span className="capitalize">{r.batch_attempt}</span> },
    { key: "status", header: "Status", render: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">{r.status_display}</span> },
    { key: "counsellor", header: "Counsellor", render: (r) => r.assigned_counsellor ? r.assigned_counsellor.name : "-" },
    { key: "submitted_at", header: "Submitted At", render: (r) => <span className="text-xs text-muted-foreground">{r.submitted_at}</span> },
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
                        endPoint: API.ADMISSIONS.LIST,
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
      <DataTable 
        columns={admissionCols} 
        data={admissions} 
        exportable={isSuperAdmin || user?.role === "branch_manager"} 
        onRowClick={(r) => navigate(`/admissions/${r.id}`)}
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
                endPoint: API.ADMISSIONS.LIST,
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
