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
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
  Info,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

import { cn, formatDate } from "@/lib/utils";
import { TableSkeleton, SheetSkeleton } from "@/components/common/Skeletons";
import { ROLES } from "@/constants/roles";

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
  { value: "tele_caller", label: "Telecaller" },
  { value: "exam_supervisor", label: "Exam Supervisor" },
  { value: "paper_checker", label: "Paper Checker" },
  { value: "accountant", label: "Accountant" },
  { value: "student", label: "Student" },
  { value: "parents", label: "Parents" },
  { value: "faculty", label: "Faculty" },
  { value: "house_keeping", label: "House Keeping" },
  { value: "security", label: "Security" },
] as const;

const EMPLOYMENT_TYPE_CHOICES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "visiting", label: "Visiting" },
] as const;

const ALL_MODULES = [
  { id: "crm", label: "CRM" },
  { id: "students", label: "Students" },
  { id: "courses_batches", label: "Courses & Batches" },
  { id: "timetable", label: "Timetable" },
  { id: "attendance", label: "Attendance" },
  { id: "fees", label: "Fees" },
  { id: "exams", label: "Exams" },
  { id: "results", label: "Results" },
  { id: "faculty", label: "Faculty" },
  { id: "leave", label: "Leave" },
  { id: "chat", label: "Chat" },
  { id: "inventory", label: "Inventory" },
  { id: "notifications", label: "Notifications" },
  { id: "audit_logs", label: "Audit Logs" },
  { id: "payroll", label: "Payroll" },
  { id: "settings", label: "Settings" },
  { id: "users", label: "Users" },
  { id: "support", label: "Support" },
];

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
    branches: [] as string[],
    role: "",
    additional_roles: [] as string[],
    salary_retention_percentage: "0",
    is_active: true,
    employee_id: "",
    qualification: "",
    specialization: "",
    subject_expertise: "",
    level: "",
    employment_type: "",
    joining_date: "",
    hourly_rate: "",
    session_hours: "",
    salary: "",
    bank_account: "",
    ifsc_code: "",
    pan_number: "",
    aadhar_number: "",
    work_start_time: "",
    work_end_time: "",
    per_paper_rate: "",
    accessible_modules: [] as string[],
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
        username: selectedUser.username || "",
        role: selectedUser.role || "",
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        branch: selectedUser.branch || "",
        branches: selectedUser.branches || [],
        additional_roles: selectedUser.additional_roles || [],
        salary_retention_percentage:
          selectedUser.salary_retention_percentage !== undefined
            ? String(selectedUser.salary_retention_percentage)
            : "0",
        is_active: selectedUser.is_active ?? true,
        employee_id: selectedUser.employee_id || "",
        qualification: selectedUser.qualification || "",
        specialization: selectedUser.specialization || "",
        subject_expertise: selectedUser.subject_expertise || "",
        level: selectedUser.level || "",
        employment_type: selectedUser.employment_type || "",
        joining_date: selectedUser.joining_date || "",
        hourly_rate:
          selectedUser.hourly_rate !== undefined && selectedUser.hourly_rate !== null
            ? String(selectedUser.hourly_rate)
            : "",
        session_hours:
          selectedUser.session_hours !== undefined && selectedUser.session_hours !== null
            ? String(selectedUser.session_hours)
            : "",
        salary:
          selectedUser.salary !== undefined && selectedUser.salary !== null
            ? String(selectedUser.salary)
            : "",
        bank_account: selectedUser.bank_account || "",
        ifsc_code: selectedUser.ifsc_code || "",
        pan_number: selectedUser.pan_number || "",
        aadhar_number: selectedUser.aadhar_number || "",
        work_start_time: selectedUser.work_start_time || "",
        work_end_time: selectedUser.work_end_time || "",
        per_paper_rate:
          selectedUser.per_paper_rate !== undefined && selectedUser.per_paper_rate !== null
            ? String(selectedUser.per_paper_rate)
            : "",
        accessible_modules: selectedUser.accessible_modules || [],
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
      branches: [],
      role: "",
      additional_roles: [],
      salary_retention_percentage: "0",
      is_active: true,
      employee_id: "",
      qualification: "",
      specialization: "",
      subject_expertise: "",
      level: "",
      employment_type: "",
      joining_date: "",
      hourly_rate: "",
      session_hours: "",
      salary: "",
      bank_account: "",
      ifsc_code: "",
      pan_number: "",
      aadhar_number: "",
      work_start_time: "",
      work_end_time: "",
      per_paper_rate: "",
      accessible_modules: [],
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
      additional_roles: editForm.additional_roles,
      branches: editForm.branches,
      salary_retention_percentage: editForm.salary_retention_percentage,
      is_active: false,
      employee_id: editForm.employee_id,
      qualification: editForm.qualification,
      specialization: editForm.specialization,
      subject_expertise: editForm.subject_expertise,
      level: editForm.level,
      employment_type: editForm.employment_type,
      joining_date: editForm.joining_date,
      hourly_rate: editForm.hourly_rate ? Number(editForm.hourly_rate) : null,
      session_hours: editForm.session_hours ? Number(editForm.session_hours) : null,
      salary: editForm.salary ? Number(editForm.salary) : null,
      bank_account: editForm.bank_account,
      ifsc_code: editForm.ifsc_code,
      pan_number: editForm.pan_number,
      aadhar_number: editForm.aadhar_number,
      work_start_time: editForm.work_start_time,
      work_end_time: editForm.work_end_time,
      per_paper_rate: editForm.per_paper_rate ? Number(editForm.per_paper_rate) : null,
      accessible_modules: Array.from(
        new Set([
          ...(editForm.role && ROLES[editForm.role as keyof typeof ROLES]
            ? ROLES[editForm.role as keyof typeof ROLES].modules
            : []),
          ...(editForm?.additional_roles?.flatMap(r => 
            ROLES[r as keyof typeof ROLES] ? ROLES[r as keyof typeof ROLES].modules : []
          ) || []),
          ...editForm.accessible_modules,
        ]),
      ),
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
          err?.response?.data?.email ||
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
      branches: selectedUser.branches || [],
      role: selectedUser.role || "",
      additional_roles: selectedUser.additional_roles || [],
      salary_retention_percentage:
        selectedUser.salary_retention_percentage !== undefined
          ? String(selectedUser.salary_retention_percentage)
          : "0",
      is_active: selectedUser.is_active,
      employee_id: selectedUser.employee_id || "",
      qualification: selectedUser.qualification || "",
      specialization: selectedUser.specialization || "",
      subject_expertise: selectedUser.subject_expertise || "",
      level: selectedUser.level || "",
      employment_type: selectedUser.employment_type || "",
      joining_date: selectedUser.joining_date || "",
      hourly_rate:
        selectedUser.hourly_rate !== undefined && selectedUser.hourly_rate !== null
          ? String(selectedUser.hourly_rate)
          : "",
      session_hours:
        selectedUser.session_hours !== undefined && selectedUser.session_hours !== null
          ? String(selectedUser.session_hours)
          : "",
      salary:
        selectedUser.salary !== undefined && selectedUser.salary !== null
          ? String(selectedUser.salary)
          : "",
      bank_account: selectedUser.bank_account || "",
      ifsc_code: selectedUser.ifsc_code || "",
      pan_number: selectedUser.pan_number || "",
      aadhar_number: selectedUser.aadhar_number || "",
      work_start_time: selectedUser.work_start_time || "",
      work_end_time: selectedUser.work_end_time || "",
      per_paper_rate:
        selectedUser.per_paper_rate !== undefined && selectedUser.per_paper_rate !== null
          ? String(selectedUser.per_paper_rate)
          : "",
      accessible_modules: selectedUser.accessible_modules || [],
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

    const allModules = Array.from(
      new Set([
        ...(editForm.role && ROLES[editForm.role as keyof typeof ROLES]
          ? ROLES[editForm.role as keyof typeof ROLES].modules
          : []),
        ...editForm.additional_roles.flatMap(r => 
          ROLES[r as keyof typeof ROLES] ? ROLES[r as keyof typeof ROLES].modules : []
        ),
        ...editForm.accessible_modules,
      ]),
    );

    setUpdateLoading(true);

    const formData = new FormData();
    if (editForm.username) {
      formData.append("username", editForm.username);
    }
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("phone", editForm.phone);
    formData.append("is_active", String(editForm.is_active));
    formData.append("salary_retention_percentage", editForm.salary_retention_percentage);
    // --- BRANCHES ---
    if (editForm.branches.length === 1) {
      formData.append("branches", editForm.branches[0]);
      formData.append("branches", editForm.branches[0]);
    } else if (editForm.branches.length > 1) {
      editForm.branches.forEach((b: string) => formData.append("branches", b));
    }

    // --- ADDITIONAL ROLES ---
    if (!editForm.additional_roles || editForm.additional_roles.length === 0) {
      formData.append("additional_roles", []);
    } else if (editForm.additional_roles.length === 1) {
      formData.append("additional_roles", editForm.additional_roles[0]);
      formData.append("additional_roles", editForm.additional_roles[0]);
    } else {
      editForm.additional_roles.forEach((r: string) => {
        if (r && r !== "") formData.append("additional_roles", r);
      });
    }
    
    if (profilePicFile) {
      formData.append("profile_pic", profilePicFile);
    }

    if (editForm.employee_id !== undefined) formData.append("employee_id", editForm.employee_id);
    if (editForm.qualification !== undefined) formData.append("qualification", editForm.qualification);
    if (editForm.specialization !== undefined) formData.append("specialization", editForm.specialization);
    if (editForm.subject_expertise !== undefined) formData.append("subject_expertise", editForm.subject_expertise);
    if (editForm.level !== undefined) formData.append("level", editForm.level);
    if (editForm.employment_type !== undefined) formData.append("employment_type", editForm.employment_type);
    if (editForm.joining_date !== undefined) formData.append("joining_date", editForm.joining_date);
    if (editForm.hourly_rate !== undefined && editForm.hourly_rate !== "") formData.append("hourly_rate", editForm.hourly_rate);
    if (editForm.session_hours !== undefined && editForm.session_hours !== "") formData.append("session_hours", editForm.session_hours);
    if (editForm.salary !== undefined && editForm.salary !== "") formData.append("salary", editForm.salary);
    if (editForm.bank_account !== undefined) formData.append("bank_account", editForm.bank_account);
    if (editForm.ifsc_code !== undefined) formData.append("ifsc_code", editForm.ifsc_code);
    if (editForm.pan_number !== undefined) formData.append("pan_number", editForm.pan_number);
    if (editForm.aadhar_number !== undefined) formData.append("aadhar_number", editForm.aadhar_number);
    if (editForm.work_start_time !== undefined) formData.append("work_start_time", editForm.work_start_time);
    if (editForm.work_end_time !== undefined) formData.append("work_end_time", editForm.work_end_time);
    if (editForm.per_paper_rate !== undefined && editForm.per_paper_rate !== "") formData.append("per_paper_rate", editForm.per_paper_rate);

    // --- ACCESSIBLE MODULES ---
    if (allModules && allModules.length === 1) {
      formData.append("accessible_modules", allModules[0]);
      formData.append("accessible_modules", allModules[0]);
    } else if (allModules && allModules.length > 1) {
      allModules.forEach((m: string) => {
        if (m && m !== "") formData.append("accessible_modules", m);
      });
    }

    dispatch({
      type: userActions.UPDATE_USER,
      method: "PUT",
      endPoint: `/api/auth/users/${selectedUser.id}/`,
      body: formData,
      auth: true,
      setLoading: (val: boolean) => setUpdateLoading(val),
      getResponse: (res: any) => handleUpdateResponse(res),
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

  const handleUpdateResponse = (res: any) => {
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

  const activeRole = isAdding ? editForm.role : selectedUser?.role || editForm.role;
  const isEmployee = activeRole && activeRole !== "student" && activeRole !== "parents";
  const isFaculty = activeRole === "faculty";
  const isPartTimeOrVisiting =
    isFaculty &&
    (editForm.employment_type === "part_time" || editForm.employment_type === "visiting");
  const isPaperChecker = activeRole === "paper_checker";
  const isExaminer = activeRole === "exam_supervisor";
  const showSalary =
    isEmployee && !(isFaculty && isPartTimeOrVisiting) && !isPaperChecker && !isExaminer;

  const defaultModules = useMemo(() => {
    let mods: any[] = [];
    if (editForm.role) {
      const roleDef = ROLES[editForm.role as keyof typeof ROLES];
      if (roleDef) mods = [...mods, ...roleDef.modules];
    }
    editForm.additional_roles.forEach(r => {
      const roleDef = ROLES[r as keyof typeof ROLES];
      if (roleDef) mods = [...mods, ...roleDef.modules];
    });
    return Array.from(new Set(mods));
  }, [editForm.role, editForm.additional_roles]);

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
        <SheetContent className="sm:max-w-2xl overflow-y-auto scrollbar-hidden">
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
                              : selectedUser?.profile_pic
                                ? selectedUser?.profile_pic.startsWith("http")
                                  ? selectedUser?.profile_pic
                                  : import.meta.env.VITE_APP_BASE_URL + selectedUser?.profile_pic
                                : undefined
                          }
                          alt={selectedUser?.name}
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
                          {selectedUser?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{selectedUser?.username}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Form Fields (Unified for both View & Edit) */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {/* Username (Only when adding) */}
                  {/* {isAdding && (
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
                  )} */}

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
                        {selectedUser?.name}
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
                        {selectedUser?.email}
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
                        {selectedUser?.phone || "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Branches */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Branches
                    </Label>
                    {isEditing || isAdding ? (
                      <div className="border border-input bg-background rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                        {branchLoading ? (
                          <div className="text-xs text-muted-foreground p-2">Loading branches...</div>
                        ) : branchOptions.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2">No branches available</div>
                        ) : (
                          branchOptions.map((b) => {
                            const isChecked = editForm.branches.includes(String(b.value));
                            return (
                              <div key={b.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`branch-${b.value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setEditForm(f => {
                                      const newBranches = checked
                                        ? [...f.branches, String(b.value)]
                                        : f.branches.filter(v => v !== String(b.value));
                                      return { ...f, branches: newBranches };
                                    });
                                  }}
                                />
                                <Label htmlFor={`branch-${b.value}`} className="text-sm font-medium">
                                  {b.label}
                                </Label>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5 flex flex-wrap gap-1">
                        {selectedUser?.branches && selectedUser?.branches.length > 0
                          ? Array.from(new Set(selectedUser.branches)).map((bId: string) => {
                              const bLabel = branchOptions.find((o) => String(o.value) === String(bId))?.label || bId;
                              return <span key={bId} className="inline-flex bg-muted/50 px-2 py-0.5 rounded-md text-xs">{bLabel}</span>;
                            })
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Organization (Always read-only) */}
                  {!isAdding && selectedUser?.organization_name && (
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Organization
                      </Label>
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser?.organization_name}
                      </div>
                    </div>
                  )}

                  {/* Primary Role */}
                  {isAdding ? (
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Primary Role
                      </Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(val) => setEditForm((f) => ({ 
                          ...f, 
                          role: val,
                          additional_roles: f.additional_roles.filter(r => r !== val)
                        }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a primary role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_CHOICES.filter(
                            (r) =>
                              r.value !== "super_admin" &&
                              r.value !== "student" &&
                              r.value !== "parents",
                          ).map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-600/90 dark:text-amber-400 font-medium leading-relaxed">
                          The role with the highest level of access should be given as the primary role and cannot be changed later.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Primary Role
                      </Label>
                      <div className="pt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                          {selectedUser?.role_display || selectedUser?.role}
                        </span>
                      </div>
                      <div className="mt-2 p-2 bg-muted/50 border border-border rounded-md flex items-start gap-2">
                        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground font-medium">
                          The primary role cannot be changed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Secondary Roles */}
                  {isAdding || isEditing ? (
                    <div className="sm:col-span-2 space-y-2 pt-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Secondary Roles (Optional)
                      </Label>
                      <div className="grid grid-cols-2 gap-3 border border-input bg-background rounded-md p-3 max-h-40 overflow-y-auto">
                        {!editForm.role ? (
                          <div className="col-span-2 text-sm text-muted-foreground py-4 text-center">
                            Please select a Primary Role first
                          </div>
                        ) : (
                          ROLE_CHOICES.filter(
                              (r) =>
                                r.value !== "super_admin" &&
                                r.value !== "student" &&
                                r.value !== "parents" &&
                                r.value !== editForm.role
                          ).map((r) => {
                            const isChecked = editForm.additional_roles.includes(r.value);
                            return (
                              <div key={r.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`sec-role-${r.value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setEditForm(f => {
                                      const newRoles = checked
                                        ? [...f.additional_roles, r.value]
                                        : f.additional_roles.filter(v => v !== r.value);
                                      return { ...f, additional_roles: newRoles };
                                    });
                                  }}
                                />
                                <Label htmlFor={`sec-role-${r.value}`} className="text-sm font-medium">
                                  {r.label}
                                </Label>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    selectedUser?.additional_roles && selectedUser.additional_roles.length > 0 && (
                      <div className="sm:col-span-2 space-y-1 pt-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Secondary Roles
                        </Label>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Array.from(new Set(selectedUser.additional_roles)).map((rId: string) => {
                            const rLabel = ROLE_CHOICES.find(o => o.value === rId)?.label || rId;
                            return (
                              <span key={rId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground border border-secondary/20">
                                {rLabel}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}

                  {/* Status (Switch if editing, Badge if viewing) */}
                  <div className="sm:col-span-2 space-y-1">
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

                  {/* Accessible Modules */}
                  <div className="sm:col-span-2 space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Accessible Modules
                    </Label>
                    <div className="flex flex-wrap gap-2 p-1">
                      {ALL_MODULES.map((mod) => {
                        const isDefault = defaultModules.includes(mod.id as any);
                        const isChecked = isDefault || editForm.accessible_modules.includes(mod.id);

                        return (
                          <Label
                            key={mod.id}
                            htmlFor={`module-${mod.id}`}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                              (!isEditing && !isAdding)
                                ? ""
                                : "cursor-pointer hover:bg-muted/50",
                              isChecked
                                ? "bg-primary/10 border-primary/30 text-primary-dark"
                                : "bg-background border-input text-muted-foreground",
                              isDefault ? "opacity-70 cursor-default" : ""
                            )}
                          >
                            <Checkbox
                              id={`module-${mod.id}`}
                              checked={isChecked}
                              disabled={isDefault || (!isEditing && !isAdding)}
                              className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              onCheckedChange={(checked) => {
                                if (isDefault || (!isEditing && !isAdding)) return;
                                setEditForm((f) => {
                                  const newModules = checked
                                    ? [...f.accessible_modules, mod.id]
                                    : f.accessible_modules.filter((m) => m !== mod.id);
                                  return { ...f, accessible_modules: newModules };
                                });
                              }}
                            />
                            <span>{mod.label}</span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Salary Retention Percentage */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Salary Retention Percentage
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editForm.salary_retention_percentage}
                        onValueChange={(val) =>
                          setEditForm((f) => ({ ...f, salary_retention_percentage: val }))
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select percentage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="15">15%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm font-medium text-text-primary pt-0.5">
                        {selectedUser?.salary_retention_percentage !== undefined
                          ? `${selectedUser.salary_retention_percentage}%`
                          : "0%"}
                      </div>
                    )}
                  </div>

                  {/* --- Employee Specific Fields --- */}
                  {isEmployee && (
                    <>
                      {/* <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Employee ID</Label>
                        {isEditing ? (
                          <Input value={editForm.employee_id} onChange={e => setEditForm(f => ({...f, employee_id: e.target.value}))} placeholder="Employee ID" className="bg-background" />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">{selectedUser?.employee_id || "N/A"}</div>
                        )}
                      </div> */}

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Joining Date
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editForm.joining_date}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, joining_date: e.target.value }))
                            }
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.joining_date || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Bank Account
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.bank_account}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, bank_account: e.target.value }))
                            }
                            placeholder="Bank Account Number"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.bank_account || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          IFSC Code
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.ifsc_code}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, ifsc_code: e.target.value }))
                            }
                            placeholder="IFSC Code"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.ifsc_code || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          PAN Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.pan_number}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, pan_number: e.target.value }))
                            }
                            placeholder="PAN Number"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.pan_number || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Aadhar Number
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.aadhar_number}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, aadhar_number: e.target.value }))
                            }
                            placeholder="Aadhar Number"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.aadhar_number || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Work Start Time
                        </Label>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={editForm.work_start_time}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, work_start_time: e.target.value }))
                            }
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.work_start_time || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Work End Time
                        </Label>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={editForm.work_end_time}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, work_end_time: e.target.value }))
                            }
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.work_end_time || "N/A"}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isFaculty && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Qualification
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.qualification}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, qualification: e.target.value }))
                            }
                            placeholder="Qualification"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.qualification || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Specialization
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editForm.specialization}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, specialization: e.target.value }))
                            }
                            placeholder="Specialization"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.specialization || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Employment Type
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editForm.employment_type}
                            onValueChange={(val) =>
                              setEditForm((f) => ({ ...f, employment_type: val }))
                            }
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Employment Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_TYPE_CHOICES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {EMPLOYMENT_TYPE_CHOICES.find(
                              (c) => c.value === selectedUser?.employment_type,
                            )?.label ||
                              selectedUser?.employment_type ||
                              "N/A"}
                          </div>
                        )}
                      </div>


                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Session Hours
                        </Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editForm.session_hours}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, session_hours: e.target.value }))
                            }
                            placeholder="Session Hours"
                            className="bg-background"
                          />
                        ) : (
                          <div className="text-sm font-medium text-text-primary pt-0.5">
                            {selectedUser?.session_hours || "N/A"}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isFaculty && isPartTimeOrVisiting && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Hourly Rate
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editForm.hourly_rate}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, hourly_rate: e.target.value }))
                          }
                          placeholder="Hourly Rate"
                          className="bg-background"
                        />
                      ) : (
                        <div className="text-sm font-medium text-text-primary pt-0.5">
                          {selectedUser?.hourly_rate || "N/A"}
                        </div>
                      )}
                    </div>
                  )}

                  {showSalary && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Salary
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editForm.salary}
                          onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))}
                          placeholder="Salary"
                          className="bg-background"
                        />
                      ) : (
                        <div className="text-sm font-medium text-text-primary pt-0.5">
                          {selectedUser?.salary || "N/A"}
                        </div>
                      )}
                    </div>
                  )}

                  {isPaperChecker && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Per Paper Rate
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editForm.per_paper_rate}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, per_paper_rate: e.target.value }))
                          }
                          placeholder="Per Paper Rate"
                          className="bg-background"
                        />
                      ) : (
                        <div className="text-sm font-medium text-text-primary pt-0.5">
                          {selectedUser?.per_paper_rate || "N/A"}
                        </div>
                      )}
                    </div>
                  )}

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