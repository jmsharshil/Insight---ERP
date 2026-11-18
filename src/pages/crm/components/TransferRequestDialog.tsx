import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { userActions } from "@/redux/actions";
import { API } from "@/service/api";
import { APILead } from "@/types/crm";
import { AppDispatch } from "@/store";

interface UserOption {
  id: string;
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

interface TransferRequestDialogProps {
  lead: APILead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TransferRequestDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: TransferRequestDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Fetch counsellors/users on dialog open ────────────────── */
  useEffect(() => {
    if (!open) return;
    setUsersLoading(true);
    setSearch("");
    setSelectedUser(null);
    setReason("");

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
        toast.error("Failed to load counsellors");
      },
    } as any);
  }, [open, dispatch, toast]);

  /* ─── Allowed CRM Roles ─────────────────────────────────────── */
  const ALLOWED_ROLES = [
    "cmo",
    "associate_bdm",
    "senior_bdm",
    "deputy_bdm",
    "sales_executive",
    "sales_senior_executive",
    "counsellor",
    "tele_caller",
  ];

  /* ─── Filter users ─────────────────────────────────────────── */
  const filtered = users.filter((u) => {
    if (!u.role || !ALLOWED_ROLES.includes(u.role)) {
      return false;
    }
    // Exclude current assignee of the lead
    if (lead?.assigned_to && String(u.id) === String(lead.assigned_to)) {
      return false;
    }
    // Exclude current logged in user
    if (user?.id && String(u.id) === String(user.id)) {
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

  const handleSubmit = async () => {
    if (!lead) return;
    if (!selectedUser) {
      toast.error("Please select a counsellor / team member to transfer to.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loginDataRaw = localStorage.getItem("Insight_Login_Data");
      const token = loginDataRaw ? JSON.parse(loginDataRaw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.LEADS.TRANSFER_REQUESTS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          assigned_to: selectedUser.id,
          reason: reason.trim(),
        }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          resData?.error ||
          resData?.message ||
          resData?.detail ||
          "Failed to submit transfer request"
        );
      }

      toast.success("Transfer request submitted successfully.");
      setReason("");
      setSelectedUser(null);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Lead Transfer</DialogTitle>
          <DialogDescription>
            Transfer a {" "}
            <span className="font-semibold text-foreground">
              {lead?.first_name} {lead?.surname}
            </span>{" "}
            to a counsellor or team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Counsellor Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Transfer To (Counsellor / Team Member) <span className="text-destructive">*</span>
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading counsellors…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">
                  No counsellors found
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    const displayName = u.name || u.full_name || u.first_name || "Unknown User";
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(isSelected ? null : u)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {displayName[0]?.toUpperCase() ?? "?"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{displayName}</p>
                            {u.email && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {u.email}
                              </p>
                            )}
                          </div>
                          {u.role && (
                            <span className="flex-shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize">
                              {u.role.replace(/_/g, " ")}
                            </span>
                          )}
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

            {selectedUser && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span>Selected:</span>
                <span className="font-semibold text-foreground">
                  {selectedUser.name || selectedUser.full_name || selectedUser.first_name}
                </span>
                {selectedUser.role && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium capitalize">
                    {selectedUser.role.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reason for Transfer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">
              Reason for Transfer <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="E.g., This lead has specific CS Professional questions..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[85px] text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUser || !reason.trim()}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
