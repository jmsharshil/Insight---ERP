import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { useToast } from "@/hooks/useToast";
import { API } from "@/service/api";
import { LeadTransferRequest } from "@/types/crm";
import { formatDate } from "@/lib/utils";
import ReviewTransferDialog from "./ReviewTransferDialog";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function TransferRequestsTab() {
  const toast = useToast();
  const [requests, setRequests] = useState<LeadTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<LeadTransferRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const loginDataRaw = localStorage.getItem("Insight_Login_Data");
      const token = loginDataRaw ? JSON.parse(loginDataRaw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.LEADS.TRANSFER_REQUESTS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transfer requests");
      }

      const data = await res.json();
      setRequests(data?.results || data?.data || data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transfer requests");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const cols: DataTableColumn<LeadTransferRequest>[] = [
    {
      key: "id",
      header: "Req ID",
      className: "font-mono text-xs w-20",
      render: (r) => `#${r.id}`,
    },
    {
      key: "lead_name",
      header: "Lead",
      render: (r) => (
        <div>
          <div className="font-medium">{r.lead_name || `Lead #${r.lead_id}`}</div>
        </div>
      ),
    },
    {
      key: "requested_by",
      header: "Requested By",
      render: (r) => (
        <span className="text-sm">{r.requested_by_name || r.requested_by || "Unknown Telecaller"}</span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => (
        <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={r.reason}>
          {r.reason}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) => <span className="text-sm">{formatDate(r.created_at)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        if (r.status === "approved") {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          );
        }
        if (r.status === "rejected") {
          return (
             <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
               Rejected
             </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
             <Clock className="w-3 h-3" /> Pending
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        if (r.status !== "pending") return null;
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setReviewRequest(r);
            }}
          >
            Review
          </Button>
        );
      },
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lead Transfer Requests</h3>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
        <DataTable columns={cols} data={requests} />
      )}

      <ReviewTransferDialog
        request={reviewRequest}
        open={!!reviewRequest}
        onOpenChange={(open) => {
          if (!open) setReviewRequest(null);
        }}
        onSuccess={() => {
          setReviewRequest(null);
          fetchRequests();
        }}
      />
    </div>
  );
}
