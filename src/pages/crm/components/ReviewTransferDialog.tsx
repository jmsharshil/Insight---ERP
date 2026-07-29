import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Search, UserCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { userActions } from "@/redux/actions";
import { LeadTransferRequest } from "@/types/crm";

interface UserOption {
  id: string;
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

interface ReviewTransferDialogProps {
  request: LeadTransferRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ReviewTransferDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ReviewTransferDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsersLoading(true);
    setSearch("");
    setSelectedUser(null);

    dispatch({
      type: userActions.GET_USERS_FOR_ASSIGN,
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        setUsersLoading(false);
        const data = Array.isArray(res) ? res : res?.results ?? res?.data ?? [];
        setUsers(data);
      },
      getError: () => {
        setUsersLoading(false);
        toast.error("Failed to load users");
      },
    } as any);
  }, [open, dispatch, toast]);

  const ALLOWED_ROLES = ["counsellor"];

  const filtered = users.filter((u) => {
    if (!u.role || !ALLOWED_ROLES.includes(u.role)) {
      return false;
    }
    const q = search.toLowerCase();
    const displayName = u.name || u.full_name || u.first_name || "Unknown User";
    return (
      displayName.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleReview = useCallback(
    async (status: "approved" | "rejected") => {
      if (!request) return;
      if (status === "approved" && !selectedUser) {
        toast.error("Please select a counsellor to assign");
        return;
      }

      setIsSubmitting(true);
      try {
        const loginDataRaw = localStorage.getItem("Insight_Login_Data");
        const token = loginDataRaw ? JSON.parse(loginDataRaw)?.access : "";
        const body: any = { status };
        if (status === "approved" && selectedUser) {
          body.assigned_to = selectedUser.id;
        }

        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
        const res = await fetch(`${baseUrl}${API.LEADS.TRANSFER_REQUEST_REVIEW(request.id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`Failed to ${status} transfer request`);
        }

        toast.success(`Transfer request ${status} successfully.`);
        onSuccess();
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [request, selectedUser, toast, onSuccess, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Transfer Request
          </DialogTitle>
          <DialogDescription>
            {request?.requested_by} requested to transfer{" "}
            <span className="font-semibold text-foreground">
              {request?.lead_name || `Lead #${request?.lead_id}`}
            </span>{" "}
            to a counsellor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground border">
            <span className="font-semibold block mb-1">Reason:</span>
            {request?.reason || "No reason provided."}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search counsellors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No counsellors found
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <li key={u.id}>
                      <button
                         type="button"
                         onClick={() => setSelectedUser(isSelected ? null : u)}
                         className={cn(
                           "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                           isSelected
                             ? "bg-primary/10 text-primary"
                             : "hover:bg-muted/60"
                         )}
                      >
                         <span
                           className={cn(
                             "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                             isSelected
                               ? "bg-primary text-primary-foreground"
                               : "bg-muted text-muted-foreground"
                           )}
                         >
                           {(u.name || u.full_name || u.first_name || "?")?.[0]?.toUpperCase() ?? "?"}
                         </span>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium truncate">{u.name || u.full_name || u.first_name || "Unknown User"}</p>
                           {u.email && (
                             <p className="text-xs text-muted-foreground truncate">
                               {u.email}
                             </p>
                           )}
                         </div>
                         {isSelected && (
                           <UserCheck className="flex-shrink-0 w-4 h-4 text-primary" />
                         )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleReview("rejected")}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Reject
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleReview("approved")}
                disabled={!selectedUser || isSubmitting}
                className="gap-1.5 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve & Assign
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
