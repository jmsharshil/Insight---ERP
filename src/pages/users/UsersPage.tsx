import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useDropdown } from "@/hooks/useDropdown";
import { userActions } from "@/redux/actions";
import {
  setUsers,
  setUsersLoading,
  setUsersError,
  setSelectedUser,
  setSelectedUserLoading,
  updateUserInList,
  type UserRecord,
} from "@/redux/slices/usersSlice";
import { RootState, AppDispatch } from "@/store";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/useToast";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  Loader2,
  FileSearch,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Filter,
  X,
  Pencil,
  Save,
  XCircle,
  Upload,
  Camera,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

import { cn, formatDate } from "@/lib/utils";
import { TableSkeleton, SheetSkeleton } from "@/components/common/Skeletons";

/* ─── Role choices ──────────────────────────────────────────── */

const ROLE_CHOICES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "admin_senior_executive", label: "Admin Senior Executive" },
  { value: "admin_executive", label: "Admin Executive" },
  { value: "front_desk", label: "Front Desk" },
  { value: "counsellor", label: "Counsellor" },
  { value: "sales_senior_executive", label: "Sales Senior Executive" },
  { value: "sales_executive", label: "Sales Executive" },
  { value: "tele_caller", label: "Tele Caller" },
  { value: "exam_supervisor", label: "Exam Supervisor" },
  { value: "paper_checker", label: "Paper Checker" },
  { value: "accountant", label: "Accountant" },
  { value: "student", label: "Student" },
  { value: "parents", label: "Parents" },
  { value: "faculty", label: "Faculty" },
] as const;

/* ─── Column definitions ────────────────────────────────────── */

const columns: ColumnDef<UserRecord>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const profilePic = row.original.profile_pic;
      const initials = name?.substring(0, 2).toUpperCase() || "U";
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
            <AvatarImage
              src={
                profilePic
                  ? profilePic.startsWith("http")
                    ? profilePic
                    : import.meta.env.VITE_APP_BASE_URL + profilePic
                  : undefined
              }
              alt={name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary-dark font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="font-medium text-text-primary">{name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "role_display",
    header: "Role",
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
        {row.getValue("role_display")}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.getValue("created_at") as string)}</span>
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
            isActive ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive",
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function UsersPage() {
  const { setPageTitle } = useUI();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const { users, loading, selectedUser, selectedUserLoading } = useSelector(
    (state: RootState) => state.users,
  );
  
  const { user } = useAuth();
  const filteredUsers = useMemo(() => {
    if (!user || user.role === "super_admin" || !user.branch) return users;
    return users.filter((u: any) => {
      const branchId = typeof u.branch === "object" && u.branch !== null ? u.branch.id : u.branch;
      return branchId === user.branch;
    });
  }, [users, user]);

  const {
    options: branchOptions,
    fetchOptions: fetchBranchOptions,
    loading: branchLoading,
  } = useDropdown("branches", false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /* ── Edit mode state ── */
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    branch: "",
    role: "",
    is_active: true,
  });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Server-side filter state ── */
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch users with query params ── */
  const fetchUsers = useCallback(
    (params?: { search?: string; role?: string; is_active?: string }) => {
      const queryParts: string[] = [];
      const search = params?.search ?? searchQuery;
      const role = params?.role ?? roleFilter;
      const isActive = params?.is_active ?? statusFilter;

      if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
      if (role) queryParts.push(`role=${encodeURIComponent(role)}`);
      if (isActive) queryParts.push(`is_active=${encodeURIComponent(isActive)}`);

      const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

      dispatch({
        type: userActions.GET_USERS,
        method: "GET",
        endPoint: `/api/auth/users/${qs}`,
        auth: true,
        setLoading: (val: boolean) => dispatch(setUsersLoading(val)),
        getResponse: (res: any) => {
          if (res?.success && res?.data) {
            dispatch(setUsers(res.data));
          } else {
            dispatch(setUsersError("Unexpected response format"));
            toast.error("Failed to load users data.");
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to fetch users";
          dispatch(setUsersError(msg));
          toast.error(msg);
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, roleFilter, statusFilter],
  );

  /* ── Initial load ── */
  useEffect(() => {
    setPageTitle("Users");
    fetchUsers({ search: "", role: "", is_active: "" });
    fetchBranchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sync editForm when selectedUser details load ── */
  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        branch: selectedUser.branch || "",
        is_active: selectedUser.is_active ?? true,
      });
    }
  }, [selectedUser]);

  /* ── Debounced search ── */
  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      fetchUsers({ search: value });
    }, 1300);
  };

  /* ── Filter handlers ── */
  const handleRoleChange = (value: string) => {
    const newRole = value === "all" ? "" : value;
    setRoleFilter(newRole);
    fetchUsers({ role: newRole });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value === "all" ? "" : value;
    setStatusFilter(newStatus);
    fetchUsers({ is_active: newStatus });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchUsers({ search: "", role: "", is_active: "" });
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  const handleRowClick = (userId: string) => {
    setIsEditing(false);
    setIsAdding(false);
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setIsSheetOpen(true);
    dispatch({
      type: userActions.GET_USER_DETAILS,
      method: "GET",
      endPoint: `/api/auth/users/${userId}/`,
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedUserLoading(val)),
      getResponse: (res: any) => {
        const userData = res?.id ? res : res?.data;
        if (userData) {
          dispatch(setSelectedUser(userData));
        } else {
          toast.error("Failed to parse user details.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch user details";
        toast.error(msg);
      },
    });
  };

  const handleAddUserClick = () => {
    setEditForm({
      username: "",
      name: "",
      email: "",
      phone: "",
      branch: "",
      role: "",
      is_active: true,
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setIsAdding(true);
    setIsEditing(true);
    dispatch(setSelectedUser(null));
    setIsSheetOpen(true);
  };

  const addUser = () => {
    setUpdateLoading(true);

    const payload = {
      username: editForm.username,
      email: editForm.email,
      phone: editForm.phone,
      name: editForm.name,
      role: editForm.role,
      branch: editForm.branch,
      is_active: editForm.is_active,
    };

    dispatch({
      type: userActions.ADD_USER,
      method: "POST",
      endPoint: `/api/auth/users/add/`,
      body: payload,
      auth: true,
      setLoading: (val: boolean) => setUpdateLoading(val),
      getResponse: (res: any) => {
        if (res) {
          toast.success("User added successfully!");
          setIsAdding(false);
          setIsEditing(false);
          setIsSheetOpen(false);
          fetchUsers();
        }
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to add user";
        toast.error(msg);
      },
    });
  };

  /* ── Enter edit mode ── */
  const startEditing = () => {
    if (!selectedUser) return;
    setEditForm({
      username: selectedUser.username || "",
      name: selectedUser.name || "",
      email: selectedUser.email || "",
      phone: selectedUser.phone || "",
      branch: selectedUser.branch || "",
      role: selectedUser.role || "",
      is_active: selectedUser.is_active,
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (isAdding) {
      setIsSheetOpen(false);
    }
    setIsEditing(false);
    setIsAdding(false);
    setProfilePicFile(null);
    setProfilePicPreview(null);
  };

  /* ── Handle profile pic file selection ── */
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePicPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /* ── Submit update ── */
  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("phone", editForm.phone);
    formData.append("is_active", String(editForm.is_active));
    if (editForm.branch) formData.append("branch", editForm.branch);
    if (profilePicFile) formData.append("profile_pic", profilePicFile);

    setUpdateLoading(true);
    dispatch({
      type: userActions.UPDATE_USER,
      method: "PATCH",
      endPoint: `/api/auth/users/${selectedUser.id}/`,
      body: formData,
      auth: true,
      setLoading: (val: boolean) => setUpdateLoading(val),
      getResponse: (res: any) => {
        const updatedUser = res?.id ? res : res?.data;
        if (updatedUser) {
          dispatch(updateUserInList(updatedUser));
          dispatch(setSelectedUser(updatedUser));
          toast.success("User updated successfully!");
          setIsEditing(false);
          setProfilePicFile(null);
          setProfilePicPreview(null);
          // Refresh the list to ensure consistency
          fetchUsers();
        }
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update user";
        toast.error(msg);
      },
    });
  };

  /* ── Table ── */

  const table = useReactTable({
    data: filteredUsers,
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

  return (
    <div>
      <PageHeader
        title="Users Management"
        subtitle="View and manage all users across the organization."
        actions={
          <Button
            onClick={handleAddUserClick}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add User
          </Button>
        }
      />

      <div className="space-y-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter || "all"} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[180px] bg-card">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_CHOICES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}

          {/* Refresh */}
          <div className="ml-auto">
            <Button variant="outline" onClick={() => fetchUsers()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Table Container ── */}
        {loading ? (
          <TableSkeleton rows={10} columns={6} />
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
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48">
                      <EmptyState
                        icon={FileSearch}
                        title="No users found"
                        description={
                          hasActiveFilters
                            ? "No users match your filter criteria. Try adjusting your filters."
                            : "There are no users in the system yet."
                        }
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
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{" "}
              {table.getRowModel().rows.length} records
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

      {/* ── User Details Sheet ── */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) cancelEditing();
        }}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto scrollbar-hidden">
          <SheetHeader>
            <SheetTitle>
              {isAdding ? "Add New User" : isEditing ? "Edit User" : "User Details"}
            </SheetTitle>
            <SheetDescription>
              {isAdding
                ? "Enter the details below to create a new user."
                : isEditing
                  ? "Update the user's information below."
                  : "View complete information for this user."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedUserLoading && !isAdding ? (
              <SheetSkeleton />
            ) : isAdding || selectedUser ? (
              <div className="space-y-6">
                {/* Profile Picture Header Section */}
                {!isAdding && (
                  <div className="flex flex-col items-center text-center pb-4 border-b border-border">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                        <AvatarImage
                          src={
                            profilePicPreview
                              ? profilePicPreview
                              : selectedUser.profile_pic
                                ? selectedUser.profile_pic.startsWith("http")
                                  ? selectedUser.profile_pic
                                  : import.meta.env.VITE_APP_BASE_URL + selectedUser.profile_pic
                                : undefined
                          }
                          alt={selectedUser.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary-dark font-medium">
                          {editForm.name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePicChange}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-xs text-primary-dark hover:underline flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          {profilePicFile ? profilePicFile.name : "Change photo"}
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="mt-4 text-xl font-semibold text-text-primary">
                          {selectedUser.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Form Fields (Unified for both View & Edit) */}
                <div className="space-y-4">
                  {/* Username (Only when adding) */}
                  {isAdding && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="edit-username"
                        className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                      >
                        Username
                      </Label>
                      <Input
                        id="edit-username"
                        value={editForm.username}
                        onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                        placeholder="Username"
                        className="bg-background"
                      />
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="edit-name"
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Full name"
                        className="bg-background"
                      />
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser.name}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="edit-email"
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="user@example.com"
                        className="bg-background"
                      />
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="edit-phone"
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="bg-background"
                      />
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser.phone || "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Branch */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="edit-branch"
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Branch
                    </Label>
                    {isEditing || isAdding ? (
                      <Select
                        value={editForm.branch}
                        onValueChange={(val) => setEditForm((f) => ({ ...f, branch: val }))}
                        disabled={branchLoading}
                      >
                        <SelectTrigger className="bg-background" id="edit-branch">
                          <SelectValue
                            placeholder={branchLoading ? "Loading branches..." : "Select a branch"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions.map((b) => (
                            <SelectItem key={b.value} value={String(b.value)}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {branchOptions.find((b) => String(b.value) === String(selectedUser.branch))
                          ?.label ||
                          selectedUser.branch ||
                          "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Organization (Always read-only) */}
                  {!isAdding && selectedUser?.organization_name && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Organization
                      </Label>
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser.organization_name}
                      </div>
                    </div>
                  )}

                  {/* Role */}
                  {isAdding ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Role
                      </Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(val) => setEditForm((f) => ({ ...f, role: val }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_CHOICES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Role
                      </Label>
                      <div className="pt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                          {selectedUser?.role_display || selectedUser?.role}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status (Switch if editing, Badge if viewing) */}
                  <div className="space-y-1">
                    {isEditing && !isAdding ? (
                      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-muted/30">
                        <div>
                          <Label
                            htmlFor="edit-active"
                            className="text-sm font-medium text-text-primary"
                          >
                            Active Status
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {editForm.is_active
                              ? "User can access the system"
                              : "User is blocked from access"}
                          </p>
                        </div>
                        <Switch
                          id="edit-active"
                          checked={editForm.is_active}
                          onCheckedChange={(checked) =>
                            setEditForm((f) => ({ ...f, is_active: checked }))
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Status
                        </Label>
                        <div className="pt-1">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              selectedUser?.is_active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {selectedUser?.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-border">
                  {!isEditing ? (
                    <Button
                      className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
                      onClick={startEditing}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Update Details
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={cancelEditing}
                        disabled={updateLoading}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
                        onClick={isAdding ? addUser : handleUpdateUser}
                        disabled={updateLoading}
                      >
                        {updateLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />{" "}
                            {isAdding ? "Add User" : "Save Changes"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                Failed to load user details.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
