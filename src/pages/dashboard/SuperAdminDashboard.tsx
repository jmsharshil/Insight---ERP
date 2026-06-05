import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import {
  Building2,
  UserPlus,
  Users,
  Wallet,
  Mail,
  Phone,
  MapPin,
  User,
  Clock,
  Camera,
  Upload,
  Plus,
  Search,
  X,
  Loader2,
  ArrowUpDown,
  FileSearch,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { branchAction } from "@/redux/actions";
import { cn, formatDate } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setBranchList,
  updateBranchInList,
  deleteBranchFromList,
  addBranchToList,
} from "@/redux/slices/branchSlice";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface BranchRecord {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  principal_name: string;
  logo: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const columns: ColumnDef<BranchRecord>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold text-text-primary hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Branch Name
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const logo = row.original.logo;
      const initials = name?.substring(0, 2).toUpperCase() || "B";
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50 shadow-sm rounded-xl">
            <AvatarImage
              src={
                logo
                  ? (logo.startsWith("http") ? logo : import.meta.env.VITE_APP_BASE_URL + logo)
                  : undefined
              }
              alt={name}
              className="object-cover rounded-xl"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium rounded-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="font-semibold text-text-primary">{name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => (
      <span className="text-sm text-text-primary">
        {row.getValue("city") || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-sm text-text-primary">
        {formatDate(row.getValue("created_at") as string)}
      </span>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            isActive ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

export default function SuperAdminDashboard() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    principal_name: "",
    is_active: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const isFirstRender = useRef(true);

  const [statusFilter, setStatusFilter] = useState("");

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  const { branchList } = useSelector((state: RootState) => state.branch);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const filteredBranches = useMemo(() => {
    return branchList.filter((branch: any) => {
      if (statusFilter === "true" && !branch.is_active) return false;
      if (statusFilter === "false" && branch.is_active) return false;
      return true;
    });
  }, [branchList, statusFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: filteredBranches,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  const handleRowClick = (branch: any) => {
    setSelectedBranch(branch);
    setIsSheetOpen(true);
    dispatch({
      type: branchAction.GET_BRANCH_STUDENTS,
      method: "GET",
      endPoint: `/api/v1/branches/${branch.id}/`,
      auth: true,
      getResponse: (res: any) => {
        if (res && typeof res === "object" && !Array.isArray(res)) {
          setSelectedBranch(res);
        }
      },
      getError: (err: any) => {
        console.log(err);
      },
    });
  };

  const handleAddBranchClick = () => {
    setEditForm({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      principal_name: "",
      is_active: true,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setIsAdding(true);
    setIsSheetOpen(true);
  };

  const handleCreateBranch = () => {
    setUpdateLoading(true);

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("address", editForm.address);
    formData.append("city", editForm.city);
    formData.append("state", editForm.state);
    formData.append("pincode", editForm.pincode);
    formData.append("phone", editForm.phone);
    formData.append("email", editForm.email);
    formData.append("principal_name", editForm.principal_name);
    formData.append("is_active", String(editForm.is_active));

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    dispatch({
      type: branchAction.CREATE_BRANCH,
      method: "POST",
      endPoint: "/api/v1/branches/",
      body: formData,
      auth: true,
      getResponse: (res: any) => {
        setUpdateLoading(false);
        if (res) {
          const created = res.id ? res : res.data || { ...editForm, logo: logoPreview };
          if (!created.created_at) {
            created.created_at = new Date().toISOString();
          }
          dispatch(addBranchToList(created));
          setIsSheetOpen(false);
          setIsAdding(false);
          setLogoFile(null);
          setLogoPreview(null);
          toast.success("Branch created successfully!");
        }
      },
      getError: (err: any) => {
        setUpdateLoading(false);
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to create branch";
        toast.error(errorMsg);
      },
    });
  };

  const startEditing = () => {
    if (!selectedBranch) return;
    setEditForm({
      name: selectedBranch.name || "",
      address: selectedBranch.address || "",
      city: selectedBranch.city || "",
      state: selectedBranch.state || "",
      pincode: selectedBranch.pincode || "",
      phone: selectedBranch.phone || "",
      email: selectedBranch.email || "",
      principal_name: selectedBranch.principal_name || "",
      is_active: selectedBranch.is_active ?? true,
    });
    setLogoFile(null);
    setLogoPreview(selectedBranch.logo || null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBranch = () => {
    if (!selectedBranch) return;
    setUpdateLoading(true);

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("address", editForm.address);
    formData.append("city", editForm.city);
    formData.append("state", editForm.state);
    formData.append("pincode", editForm.pincode);
    formData.append("phone", editForm.phone);
    formData.append("email", editForm.email);
    formData.append("principal_name", editForm.principal_name);
    formData.append("is_active", String(editForm.is_active));

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    dispatch({
      type: branchAction.UPDATE_BRANCH,
      method: "PATCH",
      endPoint: `/api/v1/branches/${selectedBranch.id}/`,
      body: formData,
      auth: true,
      getResponse: (res: any) => {
        setUpdateLoading(false);
        if (res) {
          const updated = res.id
            ? res
            : res.data || { ...selectedBranch, ...editForm, logo: logoPreview };
          setSelectedBranch(updated);
          dispatch(updateBranchInList(updated));
          setIsEditing(false);
          setLogoFile(null);
          setLogoPreview(null);
          toast.success("Branch updated successfully!");
        }
      },
      getError: (err: any) => {
        setUpdateLoading(false);
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to update branch";
        toast.error(errorMsg);
      },
    });
  };

  const handleDeleteBranch = () => {
    if (!selectedBranch) return;
    setDeleteLoading(true);
    dispatch({
      type: branchAction.DELETE_BRANCH,
      method: "DELETE",
      endPoint: `/api/v1/branches/${selectedBranch.id}/`,
      auth: true,
      getResponse: () => {
        setDeleteLoading(false);
        dispatch(deleteBranchFromList(selectedBranch.id));
        setIsSheetOpen(false);
        setSelectedBranch(null);
        toast.success("Branch deleted successfully!");
      },
      getError: (err: any) => {
        setDeleteLoading(false);
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete branch";
        toast.error(errorMsg);
      },
    });
  };

  const fetchBranches = (searchVal = "") => {
    setLoading(true);
    dispatch({
      type: branchAction.GET_BRANCH,
      method: "GET",
      endPoint: `/api/v1/branches/${searchVal ? `?search=${encodeURIComponent(searchVal)}` : ""}`,
      auth: true,
      getResponse: (res: any) => {
        setLoading(false);
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        dispatch(setBranchList(list));
      },
      getError: (err: any) => {
        setLoading(false);
        console.log(err);
      },
    });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchBranches("");
      return;
    }

    const handler = setTimeout(() => {
      fetchBranches(searchQuery);
    }, 2000);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  return (
    <div>
      <PageHeader
        title="Branches Management"
        subtitle="View and manage all branches across the organization."
        actions={
          <Button
            onClick={handleAddBranchClick}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </Button>
        }
      />

      <div className="space-y-4 mt-6">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchQuery || statusFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive cursor-pointer">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}

          {/* Refresh */}
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={() => fetchBranches(searchQuery)}
              disabled={loading}
              className="flex items-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Table Container ── */}
        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48">
                      <EmptyState
                        icon={FileSearch}
                        title="No branches found"
                        description="No branches match your filter criteria or registered in the system."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Pagination ── */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()} · {table.getRowModel().rows.length} records
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedBranch(null);
            setBranchStudents([]);
            setIsEditing(false);
            setIsAdding(false);
            setLogoFile(null);
            setLogoPreview(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {isAdding
                ? "Add New Branch"
                : selectedBranch
                  ? isEditing
                    ? `Edit ${selectedBranch.name}`
                    : `${selectedBranch.name} Details`
                  : "Branch Details"}
            </SheetTitle>
            <SheetDescription>
              {isAdding
                ? "Enter the details below to create a new branch."
                : selectedBranch
                  ? isEditing
                    ? "Modify the branch details below and save changes."
                    : `Detailed information and registered students for the ${selectedBranch.name} branch.`
                  : "Overview of the selected branch details and student roster."}
            </SheetDescription>
          </SheetHeader>

          {(selectedBranch && isEditing) || isAdding ? (
            <div className="space-y-4">
              {/* Picture Upload Area */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-border mb-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 rounded-xl object-cover border border-primary/20 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <Label className="font-semibold text-sm block">Branch Logo</Label>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP images accepted.</p>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="h-8 px-3 text-xs flex items-center gap-1 border border-border rounded hover:bg-muted font-semibold transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Logo
                    </button>
                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(selectedBranch.logo || null);
                        }}
                        className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 border border-transparent rounded font-semibold transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="branch-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Branch Name
                </Label>
                <Input
                  id="branch-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Junagadh Insight"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="branch-principal"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Principal Name
                </Label>
                <Input
                  id="branch-principal"
                  value={editForm.principal_name}
                  onChange={(e) => setEditForm({ ...editForm, principal_name: e.target.value })}
                  placeholder="e.g. Zeelsh Jatinbhai Sonagara"
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="branch-email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="branch-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. branch@example.com"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="branch-phone"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Phone
                  </Label>
                  <Input
                    id="branch-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. 9664838362"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="branch-address"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Street Address
                </Label>
                <Input
                  id="branch-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="e.g. Zanjarda Road"
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="branch-city"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    City
                  </Label>
                  <Input
                    id="branch-city"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="Junagadh"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="branch-state"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    State
                  </Label>
                  <Input
                    id="branch-state"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="Gujarat"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="branch-pincode"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Pincode
                  </Label>
                  <Input
                    id="branch-pincode"
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    placeholder="362002"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-muted/30">
                <div>
                  <Label htmlFor="branch-active" className="text-sm font-medium text-text-primary">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editForm.is_active ? "Branch is open and active" : "Branch is marked inactive"}
                  </p>
                </div>
                <Switch
                  id="branch-active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={updateLoading}
                  className="flex-1 py-2 px-4 border border-border rounded-md hover:bg-muted/50 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isAdding ? handleCreateBranch : handleUpdateBranch}
                  disabled={updateLoading}
                  className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {updateLoading
                    ? isAdding
                      ? "Creating..."
                      : "Saving..."
                    : isAdding
                      ? "Create Branch"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {selectedBranch && (
                <div className="space-y-6 mb-6">
                  {/* Branch Header with Logo */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
                    {selectedBranch.logo ? (
                      <img
                        src={selectedBranch.logo}
                        alt={`${selectedBranch.name} logo`}
                        className="w-20 h-20 rounded-xl object-cover border border-border bg-muted"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <Building2 className="w-10 h-10" />
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-text-primary leading-tight truncate">
                          {selectedBranch.name}
                        </h3>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                            selectedBranch.is_active
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                          }`}
                        >
                          {selectedBranch.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {selectedBranch.principal_name && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="w-4 h-4 shrink-0 text-primary" />
                          <span>
                            Principal:{" "}
                            <strong className="text-text-primary">
                              {selectedBranch.principal_name}
                            </strong>
                          </span>
                        </div>
                      )}
                      {selectedBranch.city && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 text-primary" />
                          <span>
                            {selectedBranch.city}
                            {selectedBranch.state ? `, ${selectedBranch.state}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch Detail Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Information */}
                    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        {selectedBranch.email && (
                          <a
                            href={`mailto:${selectedBranch.email}`}
                            className="flex items-center gap-2 text-sm text-text-primary hover:text-primary transition-colors truncate"
                          >
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{selectedBranch.email}</span>
                          </a>
                        )}
                        {selectedBranch.phone && (
                          <a
                            href={`tel:${selectedBranch.phone}`}
                            className="flex items-center gap-2 text-sm text-text-primary hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedBranch.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Location Address
                      </h4>
                      <div className="space-y-1 text-sm text-text-primary leading-snug">
                        <div>{selectedBranch.address || "N/A"}</div>
                        <div>
                          {selectedBranch.city && `${selectedBranch.city}, `}
                          {selectedBranch.state && `${selectedBranch.state} `}
                          {selectedBranch.pincode && `- ${selectedBranch.pincode}`}
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3 col-span-1 md:col-span-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        System Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Created: {formatDate(selectedBranch.created_at)}</span>
                        </div>
                        {selectedBranch.updated_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Last Updated: {formatDate(selectedBranch.updated_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={startEditing}
                  className="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition-colors cursor-pointer"
                >
                  Update Details
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBranch}
                  disabled={deleteLoading}
                  className="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
                >
                  {deleteLoading ? "Deleting..." : "Delete Branch"}
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
