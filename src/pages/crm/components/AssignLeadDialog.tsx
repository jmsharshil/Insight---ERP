import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Search, UserCheck, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import { APILead } from "@/types/crm";
import { useToast } from "@/hooks/useToast";
import { leadActions, userActions } from "@/redux/actions";
import { useAuth } from "@/hooks/useAuth";

/* ─── Types ──────────────────────────────────────────────────── */

interface UserOption {
  id: string;
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  branch?: any;
}

interface AssignLeadDialogProps {
  lead: APILead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (lead: APILead, assignedToName: string) => void;
}

/* ─── Component ──────────────────────────────────────────────── */

export default function AssignLeadDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: AssignLeadDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  /* ─── Fetch users on open ─────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setUsersLoading(true);
    setSearch("");
    setSelectedUser(null);
    setNote("");

    dispatch({
      type: userActions.GET_USERS_FOR_ASSIGN,
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        setUsersLoading(false);
        // Handle both paginated { results: [] } and plain array responses
        const data = Array.isArray(res) ? res : res?.results ?? res?.data ?? [];
        setUsers(data);
      },
      getError: () => {
        setUsersLoading(false);
        toast.error("Failed to load users");
      },
    } as any);
  }, [open, dispatch, toast]);

  /* ─── Allowed CRM Roles ───────────────────────────────────── */
  const ALLOWED_ROLES = ["counsellor", "tele_caller", "sales_senior_executive", "sales_executive"];

  /* ─── Filtered users ──────────────────────────────────────── */
  const filtered = users.filter((u) => {
    // Only show users who have one of the allowed roles
    if (!u.role || !ALLOWED_ROLES.includes(u.role)) {
      return false;
    }
    
    // // Filter by branch
    // if (user && user.role !== "super_admin" && user.branch) {
    //   const branchId = typeof u.branch === "object" && u.branch !== null ? u.branch.id : u.branch;
    //   if (branchId !== user.branch) return false;
    // }

    const q = search.toLowerCase();
    const displayName = u.name || u.full_name || u.first_name || "Unknown User";
    return (
      displayName.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  /* ─── Assign handler ──────────────────────────────────────── */
  const isReassign = !!lead?.assigned_to_name || !!lead?.assigned_to;

  const handleAssign = useCallback(() => {
    if (!lead || !selectedUser) return;
    setAssigning(true);

    dispatch({
      type: isReassign ? leadActions.REASSIGN_LEAD : leadActions.ASSIGN_LEAD,
      method: "PATCH",
      endPoint: isReassign ? API.LEADS.REASSIGN(lead.id) : API.LEADS.ASSIGN(lead.id),
      auth: true,
      body: {
        assigned_to: selectedUser.id,
        note: note.trim() || undefined,
      },
      getResponse: (res: any) => {
        setAssigning(false);
        toast.success(`Lead ${isReassign ? "reassigned" : "assigned"} to ${res?.data?.assigned_to_name ?? (selectedUser.name || selectedUser.full_name || selectedUser.first_name || "User")}`);
        onOpenChange(false);
        if (onSuccess) onSuccess(lead, res?.data?.assigned_to_name ?? (selectedUser.name || selectedUser.full_name || selectedUser.first_name || "User"));
      },
      getError: (err: any) => {
        setAssigning(false);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          `Failed to ${isReassign ? "reassign" : "assign"} lead`;
        toast.error(msg);
      },
    } as any);
  }, [lead, selectedUser, note, dispatch, toast, onOpenChange, onSuccess, isReassign]);

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            {isReassign ? "Reassign Lead" : "Assign Lead"}
          </DialogTitle>
          {lead && (
            <DialogDescription>
              {isReassign ? "Reassign" : "Assign"}{" "}
              <span className="font-semibold text-foreground">
                {lead.first_name} {lead.surname}
              </span>{" "}
              to a team member.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* User list */}
          <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No users found
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
                        {/* Avatar initial */}
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
                        {u.role && (
                          <span className="flex-shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {u.role}
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

          {/* Optional note */}
          <div>
            <Label htmlFor="assign-note" className="text-xs text-muted-foreground mb-1 block">
              Note <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="assign-note"
              placeholder="e.g. Assigned for follow-up..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && selectedUser) handleAssign();
              }}
              className="h-9 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!selectedUser || assigning}
              className="gap-1.5"
            >
              {assigning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {isReassign ? "Reassign" : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
