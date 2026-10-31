import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { reimbursementActions, userActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useDropdown } from "@/hooks/useDropdown";
import StatCard from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import type { Reimbursement, ReimbursementSummary } from "@/types/reimbursement.types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Eye, Trash2, FileText, CheckCircle2, XCircle, Clock, ExternalLink, Search, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import ReimbursementFormModal from "../../reimbursements/components/ReimbursementFormModal";
import { useNavigate } from "react-router-dom";

// We'll create these constants locally since they don't exist yet
const ADMIN_ROLES = ['super_admin', 'accountant'];
const ALL_APPROVERS = [...ADMIN_ROLES];

export default function ReimbursementsTab() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Reimbursement[]>([]);
  const [summary, setSummary] = useState<ReimbursementSummary | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [myClaimsOnly, setMyClaimsOnly] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState("all");
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPaidFilter, setIsPaidFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { options: branchOptions, fetchOptions: fetchBranchOptions } = useDropdown("branches", false);

  const isApprover = user && ALL_APPROVERS.includes(user.role);
  const isGlobalAdmin = user && ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    if (isApprover) {
      dispatch({
        type: userActions.GET_USERS,
        method: "GET",
        endPoint: API.USERS.LIST,
        auth: true,
        getResponse: (res: any) => {
          const raw = res?.data?.results || res?.results || res?.data || res || [];
          const list = Array.isArray(raw) ? raw : [];
          const staff = list.filter((u: any) => u.role !== "student" && u.role !== "parents" && u.role !== "parent");
          setUserOptions(
            staff.map((u: any) => ({
              id: String(u.id),
              name: u.full_name || u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown",
            }))
          );
        },
        getError: () => {},
      });
    }
  }, [isApprover, dispatch]);

  const fetchData = () => {
    const filters: any = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (branchFilter !== "all") filters.branch_id = branchFilter;
    if (myClaimsOnly || !isApprover) filters.my = 1;

    if (userIdFilter && userIdFilter !== "all") filters.user_id = userIdFilter;
    if (search) filters.search = search;
    if (fromDate) filters.from_date = fromDate;
    if (toDate) filters.to_date = toDate;
    if (fromDate && !toDate) filters.date = fromDate;
    else if (fromDate && toDate && fromDate === toDate) filters.date = fromDate;
    if (isPaidFilter !== "all") filters.is_paid = isPaidFilter;

    const qs = new URLSearchParams(filters).toString();
    const query = qs ? `?${qs}` : "";

    dispatch({
      type: reimbursementActions.GET_REIMBURSEMENTS,
      method: "GET",
      endPoint: API.REIMBURSEMENTS.LIST + query,
      auth: true,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: (res: any) => {
        if (res?.success) setData(res.data);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to load reimbursements");
      },
    });

    dispatch({
      type: reimbursementActions.GET_REIMBURSEMENTS_SUMMARY,
      method: "GET",
      endPoint: API.REIMBURSEMENTS.SUMMARY + query,
      auth: true,
      setLoading: () => {}, // Handled by the list call
      getResponse: (res: any) => {
        if (res?.success) setSummary(res.summary);
      },
      getError: () => {},
    });
  };

  useEffect(() => {
    if (isGlobalAdmin) fetchBranchOptions();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter, branchFilter, myClaimsOnly, isApprover, isGlobalAdmin,
    fromDate, toDate, isPaidFilter, userIdFilter
  ]);

  const handleFormSubmit = (formData: FormData) => {
    dispatch({
      type: reimbursementActions.SUBMIT_REIMBURSEMENT,
      method: "POST",
      endPoint: API.REIMBURSEMENTS.LIST,
      body: formData,
      auth: true,
      setLoading: (val: boolean) => setFormLoading(val),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim submitted successfully");
          setIsFormOpen(false);
          fetchData();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to submit claim");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    dispatch({
      type: reimbursementActions.DELETE_REIMBURSEMENT,
      method: "DELETE",
      endPoint: API.REIMBURSEMENTS.DETAIL(deleteId),
      auth: true,
      setLoading: () => {},
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim deleted");
          fetchData();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete claim");
      },
    });
    setDeleteId(null);
  };

  const columns = useMemo<ColumnDef<Reimbursement>[]>(() => [
    {
      accessorKey: "title",
      header: "Claim",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <span className="font-semibold text-text-primary truncate">{row.original.title}</span>
          <span className="text-xs text-muted-foreground truncate">{row.original.description}</span>
        </div>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[130px]">
          <span className="text-sm font-medium text-text-primary">{row.original.user_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.branch_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-sm">₹{Number(row.original.amount).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "expense_date",
      header: "Expense Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.expense_date)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const paid = row.original.is_paid;
        let color = "bg-warning/10 text-warning";
        let icon = <Clock className="w-3.5 h-3.5 mr-1" />;
        let label = "Pending";

        if (s === "approved") {
          color = paid ? "bg-primary/10 text-primary-dark" : "bg-success/10 text-success";
          icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
          label = paid ? "Paid" : "Approved";
        } else if (s === "rejected") {
          color = "bg-destructive/10 text-destructive";
          icon = <XCircle className="w-3.5 h-3.5 mr-1" />;
          label = "Rejected";
        }

        return (
          <div className="flex flex-col gap-1">
            <span className={cn("inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium", color)}>
              {icon} {label}
            </span>
            {s === "approved" && row.original.approved_by_name && (
              <span className="text-[11px] text-muted-foreground">by {row.original.approved_by_name}</span>
            )}
            {s === "rejected" && row.original.rejected_by_name && (
              <span className="text-[11px] text-muted-foreground">by {row.original.rejected_by_name}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "proof",
      header: "Proof",
      cell: ({ row }) => {
        const proof = row.original.proof;
        if (!proof) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <a
            href={proof}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View
          </a>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original;
        const canEditOrDelete = r.status === "pending" && (r.user === user?.id || isGlobalAdmin);

        return (
          <div className="flex items-center justify-end gap-1">
            {canEditOrDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteId(r.id)}
                title="Delete Claim"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [user, isGlobalAdmin, navigate]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleClearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setUserIdFilter("all");
    setStatusFilter("all");
    setBranchFilter("all");
    setIsPaidFilter("all");
    setMyClaimsOnly(false);
    setTimeout(fetchData, 0);
  };

  const hasActiveFilters = Boolean(
    search ||
    fromDate ||
    toDate ||
    (userIdFilter && userIdFilter !== "all") ||
    myClaimsOnly ||
    isPaidFilter !== "all" ||
    statusFilter !== "all" ||
    branchFilter !== "all"
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Reimbursements</h2>
          <p className="text-sm text-muted-foreground">Manage your expense claims</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      </div>

      {/* Summary Cards */}
      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Claimed"
            value={`₹${Number(summary.total_amount).toLocaleString()}`}
            icon={FileText}
            iconClassName="text-primary"
            iconBgClassName="bg-primary/10"
          />
          <StatCard
            title="Pending Approval"
            value={`₹${Number(summary.pending_amount).toLocaleString()}`}
            icon={Clock}
            iconClassName="text-warning"
            iconBgClassName="bg-warning/10"
          />
          <StatCard
            title="Approved (Unpaid)"
            value={`₹${Number(summary.approved_amount).toLocaleString()}`}
            icon={CheckCircle2}
            iconClassName="text-success"
            iconBgClassName="bg-success/10"
          />
          <StatCard
            title="Settled (Paid)"
            value={`₹${Number(summary.paid_amount).toLocaleString()}`}
            icon={CheckCircle2}
            iconClassName="text-primary-dark"
            iconBgClassName="bg-primary-light"
          />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <Skeleton width={100} height={12} />
              <Skeleton width={80} height={28} />
            </div>
          ))}
        </div>
      ) : null}

      {/* Filters & Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col w-full max-w-full overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 w-full">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search claims..."
              className="pl-9 h-9 text-xs sm:text-sm bg-card w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs sm:text-sm bg-card">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch Filter (Global Admin only) */}
          {isGlobalAdmin && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm bg-card">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={String(b.value)} value={String(b.value)}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range Filter */}
          <div className="flex items-center h-9 rounded-md border border-input bg-card px-2.5 gap-2 text-xs shadow-xs focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-colors">
            <span className="text-xs text-muted-foreground font-medium select-none">From:</span>
            <input
              type="date"
              aria-label="From Date"
              value={fromDate}
              onChange={(e) => {
                const val = e.target.value;
                setFromDate(val);
                if (toDate && val > toDate) setToDate(val);
              }}
              className="h-full text-xs sm:text-sm bg-transparent text-foreground focus:outline-none cursor-pointer w-[125px]"
            />
            <span className="text-muted-foreground/30 font-light select-none">|</span>
            <span className="text-xs text-muted-foreground font-medium select-none">To:</span>
            <input
              type="date"
              aria-label="To Date"
              min={fromDate || undefined}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-full text-xs sm:text-sm bg-transparent text-foreground focus:outline-none cursor-pointer w-[125px]"
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Employee Dropdown (Approvers only) */}
          {isApprover && (
            <Select value={userIdFilter} onValueChange={setUserIdFilter}>
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm bg-card">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* My Claims Toggle (Approvers only) */}
          {isApprover && (
            <Button
              variant={myClaimsOnly ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setMyClaimsOnly(!myClaimsOnly)}
            >
              My Claims
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5" onClick={fetchData}>
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="relative overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[minmax(180px,2fr)_minmax(140px,1.5fr)_90px_100px_110px_60px_90px_40px] items-center gap-4 py-2">
                  {/* Claim */}
                  <div className="flex flex-col gap-1.5">
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="55%" height={10} />
                  </div>
                  {/* Employee */}
                  <div className="flex flex-col gap-1.5">
                    <Skeleton width="75%" height={14} />
                    <Skeleton width="50%" height={10} />
                  </div>
                  {/* Amount */}
                  <Skeleton width={70} height={14} />
                  {/* Expense Date */}
                  <Skeleton width={85} height={14} />
                  {/* Status */}
                  <Skeleton width={90} height={24} borderRadius={12} />
                  {/* Proof */}
                  <Skeleton width={45} height={14} />
                  {/* Submitted */}
                  <Skeleton width={80} height={14} />
                  {/* Actions */}
                  <Skeleton width={32} height={32} borderRadius={6} />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/reimbursements/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                      No reimbursement claims found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination placeholder if needed */}
      </div>

      <ReimbursementFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={formLoading}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Reimbursement Claim"
        description="Are you sure you want to delete this claim? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete Claim"
        variant="danger"
      />
    </div>
  );
}
