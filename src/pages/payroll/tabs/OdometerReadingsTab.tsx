import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gauge,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Download,
  Eye,
  Camera,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  CalendarCheck,
  X,
  FileText,
  Car,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/common/Skeletons";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/service/api";
import { salesActions, userActions } from "@/redux/actions";
import type { AppDispatch } from "@/store";

export interface OdometerReadingItem {
  id: string;
  activity: string;
  activity_date: string;
  user: string;
  user_name: string;
  user_email?: string;
  vehicle_type?: string;
  vehicle_type_display?: string;
  start_kms: string;
  end_kms: string;
  total_kms: string;
  expense_per_km: string;
  total_expense: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string;
  adjustment_reason?: string;
  payroll_run?: string | null;
  payslip?: string | null;
  is_paid: boolean;
  start_odometer_photo?: string;
  end_odometer_photo?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "Approved", cls: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-800 border-red-200" },
};

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

const formatKmsDisplay = (kms: number) => {
  if (kms >= 10000000) {
    return {
      compact: `${(kms / 10000000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Cr`,
      unit: "km",
      full: `${kms.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`,
    };
  }
  if (kms >= 100000) {
    return {
      compact: `${(kms / 100000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`,
      unit: "km",
      full: `${kms.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`,
    };
  }
  if (kms >= 10000) {
    return {
      compact: `${(kms / 1000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
      unit: "km",
      full: `${kms.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`,
    };
  }
  return {
    compact: kms.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    unit: "km",
    full: `${kms.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`,
  };
};

const formatExpenseDisplay = (amt: number) => {
  if (amt >= 10000000) {
    return {
      compact: `₹${(amt / 10000000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Cr`,
      full: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }
  if (amt >= 100000) {
    return {
      compact: `₹${(amt / 100000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`,
      full: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }
  if (amt >= 10000) {
    return {
      compact: `₹${(amt / 1000).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
      full: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }
  return {
    compact: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    full: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
};

export default function OdometerReadingsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<OdometerReadingItem[]>([]);

  // Filters: Just users and date filter as in SalesActivitiesTab
  const [fromDate, setFromDate] = useState(searchParams.get("from_date") || "");
  const [toDate, setToDate] = useState(searchParams.get("to_date") || "");
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get("user_id") || "");
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // Approval Modal state (with invalid kms deduction)
  const [approveTarget, setApproveTarget] = useState<OdometerReadingItem | null>(null);
  const [invalidKms, setInvalidKms] = useState("");
  const [deductionNote, setDeductionNote] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);

  // Rejection Modal state
  const [rejectTarget, setRejectTarget] = useState<OdometerReadingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Photo viewer & details modal
  const [photoViewer, setPhotoViewer] = useState<{
    open: boolean;
    title: string;
    startPhoto?: string;
    endPhoto?: string;
    startKms?: string;
    endKms?: string;
    totalKms?: string;
    rate?: string;
    expense?: string;
    userName?: string;
    date?: string;
    status?: string;
    approvedByName?: string | null;
    approvedAt?: string | null;
    adjustmentReason?: string;
    rejectionReason?: string;
    vehicleType?: string;
  } | null>(null);

  // Bulk Monthly Settlement State (Monthly Approval, Rejection & Adjustment)
  const [bulkSettlementOpen, setBulkSettlementOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState<number>(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
  const [bulkUserId, setBulkUserId] = useState<string>("");
  const [bulkExpensePerKm2W, setBulkExpensePerKm2W] = useState<string>("5.00");
  const [bulkExpensePerKm4W, setBulkExpensePerKm4W] = useState<string>("12.00");
  const [bulkRejectionReason, setBulkRejectionReason] = useState<string>("");
  const [bulkAdjustmentReason, setBulkAdjustmentReason] = useState<string>("");
  const [deductKms2W, setDeductKms2W] = useState<string>("");
  const [deductKms4W, setDeductKms4W] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSummaryLoading, setBulkSummaryLoading] = useState(false);
  const [bulkOdoSummary, setBulkOdoSummary] = useState<{
    pending2W: number;
    pending4W: number;
    pendingCount2W: number;
    pendingCount4W: number;
    approved2W: number;
    approved4W: number;
    approvedCount2W: number;
    approvedCount4W: number;
  } | null>(null);

  const role = user?.role ?? "";
  const canApprove = ["super_admin", "branch_manager", "accountant"].includes(role);

  // Normalize date string to YYYY-MM-DD
  const normalizeToYMD = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    const clean = dateStr.split("T")[0].trim();
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split(/[-/]/);
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
      const dt = new Date(parsed);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }
    return clean;
  };

  const isUUID = (val?: string | null): boolean => {
    if (!val || typeof val !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  };

  // Fetch users for dropdown
  const fetchUsers = () => {
    dispatch({
      type: userActions.GET_USERS,
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        const raw = res?.data?.results || res?.results || res?.data || res || [];
        const list = Array.isArray(raw) ? raw : [];
        const staff = list.filter(
          (u: any) => u.role !== "student" && u.role !== "parents" && u.role !== "parent"
        );
        const mappedUsers = staff.map((u: any) => ({
          id: String(u.id),
          name:
            u.full_name ||
            u.name ||
            `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            u.email ||
            `User ${String(u.id).slice(0, 6)}`,
        }));
        setUserOptions(mappedUsers);

        // If selectedUserId is a name (not UUID), resolve it to UUID
        if (selectedUserId && selectedUserId !== "all" && !isUUID(selectedUserId)) {
          const match = mappedUsers.find(
            (u: any) =>
              u.name.toLowerCase().trim() === selectedUserId.toLowerCase().trim() ||
              u.id === selectedUserId
          );
          if (match && isUUID(match.id)) {
            setSelectedUserId(match.id);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("user_id", match.id);
              return next;
            });
          }
        }
      },
      getError: () => {},
    } as any);
  };

  // Combine fetched users with any unique users discovered from readings
  const combinedUserOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    userOptions.forEach((u) => {
      if (u.id) map.set(String(u.id), u);
    });

    readings.forEach((r) => {
      if (r.user && !map.has(String(r.user))) {
        map.set(String(r.user), {
          id: String(r.user),
          name: r.user_name || r.user_email || `User ${r.user.slice(0, 8)}`,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [userOptions, readings]);

  // Fetch readings passing user_id and date params as in SalesActivitiesTab
  const fetchReadings = (customUserId?: string, customFrom?: string, customTo?: string) => {
    setLoading(true);
    const activeUserId = customUserId !== undefined ? customUserId : selectedUserId;
    const activeFrom = customFrom !== undefined ? customFrom : fromDate;
    const activeTo = customTo !== undefined ? customTo : toDate;

    const params = new URLSearchParams();

    // User ID param - when approver/admin, require a selected user before fetching
    let targetUserId: string | null = null;
    if (canApprove) {
      if (activeUserId && activeUserId !== "all") {
        targetUserId = activeUserId;
      } else {
        setLoading(false);
        setReadings([]);
        return;
      }
    } else if (user?.id) {
      targetUserId = String(user.id);
    }

    // Only append user_id if it is a valid UUID to prevent Django ValidationError: ['“...” is not a valid UUID']
    let validUserUuid: string | null = null;
    if (isUUID(targetUserId)) {
      validUserUuid = targetUserId;
    } else if (targetUserId) {
      const match =
        userOptions.find(
          (u) =>
            u.name.toLowerCase().trim() === targetUserId?.toLowerCase().trim() ||
            u.id === targetUserId
        ) ||
        readings.find(
          (r) =>
            r.user_name?.toLowerCase().trim() === targetUserId?.toLowerCase().trim() ||
            r.user_email?.toLowerCase().trim() === targetUserId?.toLowerCase().trim()
        );
      const cand = match ? ("user" in match ? (match as any).user : match.id) : null;
      if (isUUID(cand)) {
        validUserUuid = String(cand);
      }
    }

    if (validUserUuid) {
      params.append("user_id", validUserUuid);
    }

    // Date params as in SalesActivitiesTab
    if (activeFrom) {
      params.append("from_date", activeFrom);
    }
    if (activeTo) {
      params.append("to_date", activeTo);
    } else if (activeFrom) {
      params.append("to_date", activeFrom);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const endPoint = `${API.SALES.ODOMETER_READINGS}${query}`;

    dispatch({
      type: salesActions.GET_ODOMETER_READINGS,
      method: "GET",
      endPoint,
      auth: true,
      getResponse: (res: any) => {
        setLoading(false);
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data?.results)
          ? res.data.results
          : [];
        setReadings(data);

        // If activeUserId was a name, attempt resolution to UUID from loaded readings
        if (activeUserId && activeUserId !== "all" && !isUUID(activeUserId)) {
          const match = data.find(
            (r: any) =>
              r.user_name?.toLowerCase().trim() === activeUserId.toLowerCase().trim() ||
              r.user_email?.toLowerCase().trim() === activeUserId.toLowerCase().trim()
          );
          if (match && isUUID(match.user)) {
            setSelectedUserId(String(match.user));
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("user_id", String(match.user));
              return next;
            });
          }
        }
      },
      getError: (err: any) => {
        setLoading(false);
        toast.error(err?.response?.data?.message || "Failed to load odometer readings");
      },
    } as any);
  };

  useEffect(() => {
    const pUser = searchParams.get("user_id");
    const pFrom = searchParams.get("from_date");
    const pTo = searchParams.get("to_date");

    if (pFrom) setFromDate(pFrom);
    if (pTo) setToDate(pTo);

    if (canApprove) {
      fetchUsers();
      if (pUser && pUser !== "all") {
        setSelectedUserId(pUser);
        fetchReadings(pUser, pFrom || undefined, pTo || undefined);
      } else {
        setSelectedUserId("");
        setReadings([]);
        setLoading(false);
      }
    } else if (user?.id) {
      fetchReadings(String(user.id), pFrom || undefined, pTo || undefined);
    }
  }, [searchParams, canApprove, user?.id]);

  // Clear km deduction when summary changes
  useEffect(() => {
    setDeductKms2W("");
    setDeductKms4W("");
  }, [bulkOdoSummary]);

  // Fetch monthly travel summary for the chosen employee & month
  useEffect(() => {
    if (bulkSettlementOpen && bulkUserId && bulkMonth && bulkYear) {
      setBulkSummaryLoading(true);
      const start = `${bulkYear}-${String(bulkMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(bulkYear, bulkMonth, 0).getDate();
      const end = `${bulkYear}-${String(bulkMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      dispatch({
        type: salesActions.GET_ODOMETER_READINGS,
        method: "GET",
        endPoint: `${API.SALES.ODOMETER_READINGS}?user_id=${bulkUserId}&from_date=${start}&to_date=${end}`,
        auth: true,
        getResponse: (res: any) => {
          setBulkSummaryLoading(false);
          const list = Array.isArray(res?.results)
            ? res.results
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];
          let p2W = 0, p4W = 0, pC2W = 0, pC4W = 0;
          let a2W = 0, a4W = 0, aC2W = 0, aC4W = 0;
          list.forEach((r: any) => {
            const vType = (r.vehicle_type || "").toUpperCase();
            const kms = parseFloat(r.total_kms) || 0;
            if (r.status === "pending") {
              if (vType === "4W") {
                p4W += kms;
                pC4W++;
              } else {
                p2W += kms;
                pC2W++;
              }
            } else if (r.status === "approved" && !r.is_paid) {
              if (vType === "4W") {
                a4W += kms;
                aC4W++;
              } else {
                a2W += kms;
                aC2W++;
              }
            }
          });
          setBulkOdoSummary({
            pending2W: p2W,
            pending4W: p4W,
            pendingCount2W: pC2W,
            pendingCount4W: pC4W,
            approved2W: a2W,
            approved4W: a4W,
            approvedCount2W: aC2W,
            approvedCount4W: aC4W,
          });
        },
        getError: () => {
          setBulkSummaryLoading(false);
          setBulkOdoSummary(null);
        },
      } as any);
    } else {
      setBulkOdoSummary(null);
    }
  }, [bulkSettlementOpen, bulkUserId, bulkMonth, bulkYear, dispatch]);

  // Derived breakdown where km deduction in input adjusts the payable distance & amount
  const monthlyBreakdown = useMemo(() => {
    const pendingKms2W = bulkOdoSummary?.pending2W || 0;
    const pendingKms4W = bulkOdoSummary?.pending4W || 0;
    const approvedKms2W = bulkOdoSummary?.approved2W || 0;
    const approvedKms4W = bulkOdoSummary?.approved4W || 0;

    const rate2W = parseFloat(bulkExpensePerKm2W || "0") || 0;
    const rate4W = parseFloat(bulkExpensePerKm4W || "0") || 0;

    const numDeduct2W = Math.max(0, parseFloat(deductKms2W || "0") || 0);
    const numDeduct4W = Math.max(0, parseFloat(deductKms4W || "0") || 0);

    const approvedPending2W = Math.max(0, pendingKms2W - numDeduct2W);
    const approvedPending4W = Math.max(0, pendingKms4W - numDeduct4W);

    const totalClaimedKms = pendingKms2W + pendingKms4W + approvedKms2W + approvedKms4W;
    const totalDeductedKms = numDeduct2W + numDeduct4W;
    const totalPayableKms = approvedPending2W + approvedPending4W + approvedKms2W + approvedKms4W;

    const originalTotalExpense = (pendingKms2W + approvedKms2W) * rate2W + (pendingKms4W + approvedKms4W) * rate4W;
    const totalDeductionExpense = (numDeduct2W * rate2W) + (numDeduct4W * rate4W);
    const finalPayableExpense = Math.max(0, originalTotalExpense - totalDeductionExpense);

    return {
      pendingKms2W,
      pendingKms4W,
      approvedKms2W,
      approvedKms4W,
      rate2W,
      rate4W,
      numDeduct2W,
      numDeduct4W,
      approvedPending2W,
      approvedPending4W,
      totalClaimedKms,
      totalDeductedKms,
      totalPayableKms,
      originalTotalExpense,
      totalDeductionExpense,
      finalPayableExpense,
    };
  }, [bulkOdoSummary, bulkExpensePerKm2W, bulkExpensePerKm4W, deductKms2W, deductKms4W]);

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    if (!canApprove || (selectedUserId && selectedUserId !== "all")) {
      fetchReadings(selectedUserId, val, toDate);
    }
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    if (!canApprove || (selectedUserId && selectedUserId !== "all")) {
      fetchReadings(selectedUserId, fromDate, val);
    }
  };

  const handleUserChange = (val: string) => {
    setSelectedUserId(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val && val !== "all") {
        next.set("user_id", val);
      } else {
        next.delete("user_id");
      }
      return next;
    });
    if (val && val !== "all") {
      fetchReadings(val, fromDate, toDate);
    } else {
      setReadings([]);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (canApprove && (!selectedUserId || selectedUserId === "all")) {
      toast.info("Please select an employee first.");
      return;
    }
    fetchReadings();
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedUserId("");
    setStatusFilter("all");
    setReadings([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("user_id");
      next.delete("from_date");
      next.delete("to_date");
      return next;
    });
  };

  // Check ownership for employee role scoping
  const isItemOwner = (item: OdometerReadingItem) => {
    if (canApprove) return true;
    const itemUserId = String(item.user || "");
    const currentUserId = String(user?.id || "");
    const itemEmail = (item.user_email || "").toLowerCase().trim();
    const currentEmail = (user?.email || "").toLowerCase().trim();
    const itemUserName = (item.user_name || "").toLowerCase().trim();
    const currentUserName = (user?.name || "").toLowerCase().trim();

    return (
      (itemUserId && currentUserId && itemUserId === currentUserId) ||
      (itemEmail && currentEmail && itemEmail === currentEmail) ||
      (itemUserName && currentUserName && itemUserName === currentUserName)
    );
  };

  // Filtered readings (Admins see all or filtered user; employees see only their own readings)
  const filteredReadings = useMemo(() => {
    return readings.filter((item) => {
      // If employee (non-admin), restrict to their own trips
      if (!isItemOwner(item)) return false;

      // Filter by selected user if approver selected a user
      if (canApprove && selectedUserId !== "all") {
        const matchesUser =
          String(item.user) === selectedUserId ||
          (item.user_name && item.user_name.toLowerCase().trim() === selectedUserId.toLowerCase().trim()) ||
          (item.user_email && item.user_email.toLowerCase().trim() === selectedUserId.toLowerCase().trim());
        if (!matchesUser) return false;
      }

      // Status filter (from clicking stat cards)
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // Date filtering (from_date and to_date) matching SalesActivitiesTab
      const itemDate = normalizeToYMD(item.activity_date);
      const normFrom = normalizeToYMD(fromDate);
      const normTo = normalizeToYMD(toDate);

      if (normFrom && normTo) {
        if (itemDate < normFrom || itemDate > normTo) return false;
      } else if (normFrom) {
        if (itemDate < normFrom) return false;
      } else if (normTo) {
        if (itemDate > normTo) return false;
      }

      return true;
    });
  }, [readings, statusFilter, fromDate, toDate, canApprove, user, selectedUserId]);

  // Statistics (computed for all readings or filtered user/dates if admin, or for user's readings if employee)
  const stats = useMemo(() => {
    const source = readings
      .filter(isItemOwner)
      .filter((item) => {
        if (canApprove && selectedUserId !== "all" && String(item.user) !== selectedUserId) return false;

        const itemDate = normalizeToYMD(item.activity_date);
        const normFrom = normalizeToYMD(fromDate);
        const normTo = normalizeToYMD(toDate);

        if (normFrom && normTo) {
          if (itemDate < normFrom || itemDate > normTo) return false;
        } else if (normFrom) {
          if (itemDate < normFrom) return false;
        } else if (normTo) {
          if (itemDate > normTo) return false;
        }

        return true;
      });

    const totalCount = source.length;
    const pendingCount = source.filter((r) => r.status === "pending").length;
    const totalKmsSum = source
      .filter((r) => r.status === "approved")
      .reduce((acc, r) => acc + (Number(r.total_kms) || 0), 0);
    const totalExpenseSum = source
      .filter((r) => r.status === "approved")
      .reduce((acc, r) => acc + (Number(r.total_expense) || 0), 0);

    return { totalCount, pendingCount, totalKmsSum, totalExpenseSum };
  }, [readings, canApprove, user, selectedUserId, fromDate, toDate]);

  const kmsInfo = useMemo(() => formatKmsDisplay(stats.totalKmsSum), [stats.totalKmsSum]);
  const expenseInfo = useMemo(() => formatExpenseDisplay(stats.totalExpenseSum), [stats.totalExpenseSum]);

  // Open Approval Dialog
  const handleOpenApprove = (item: OdometerReadingItem) => {
    setApproveTarget(item);
    setInvalidKms("");
    setDeductionNote("");
  };

  // Submit Approval
  const handleSubmitApprove = () => {
    if (!approveTarget) return;

    const originalTotalKms = Number(approveTarget.total_kms) || 0;
    const deductionVal = Math.max(0, Number(invalidKms) || 0);

    if (deductionVal > originalTotalKms) {
      toast.error(`Invalid kilometers cannot exceed total kilometers (${originalTotalKms} km)`);
      return;
    }

    const approvedKmsVal = Math.max(0, originalTotalKms - deductionVal);

    setApproveLoading(true);
    dispatch({
      type: salesActions.APPROVE_ODOMETER,
      method: "POST",
      endPoint: API.SALES.ODOMETER_READING_APPROVE(approveTarget.id),
      auth: true,
      body: {
        minus_kms: deductionVal,
        invalid_kms: deductionVal,
        deduction_kms: deductionVal,
        approved_kms: approvedKmsVal,
        adjustment_reason: deductionNote.trim(),
        deduction_reason: deductionNote.trim(),
        notes: deductionNote.trim(),
        reason: deductionNote.trim(),
      },
      getResponse: (res: any) => {
        setApproveLoading(false);
        toast.success(res?.message || "Odometer reading approved successfully.");
        setApproveTarget(null);
        fetchReadings();
      },
      getError: (err: any) => {
        setApproveLoading(false);
        toast.error(err?.response?.data?.message || "Failed to approve reading.");
      },
    } as any);
  };

  // Open Rejection Dialog
  const handleOpenReject = (item: OdometerReadingItem) => {
    setRejectTarget(item);
    setRejectionReason("");
  };

  // Submit Rejection
  const handleSubmitReject = () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setRejectLoading(true);
    dispatch({
      type: salesActions.REJECT_ODOMETER,
      method: "POST",
      endPoint: API.SALES.ODOMETER_READING_REJECT(rejectTarget.id),
      auth: true,
      body: {
        rejection_reason: rejectionReason.trim(),
      },
      getResponse: (res: any) => {
        setRejectLoading(false);
        toast.success(res?.message || "Odometer reading rejected.");
        setRejectTarget(null);
        fetchReadings();
      },
      getError: (err: any) => {
        setRejectLoading(false);
        toast.error(err?.response?.data?.message || "Failed to reject reading.");
      },
    } as any);
  };

  // Open Bulk Monthly Settlement Modal
  const handleOpenMonthlySettlement = () => {
    if (selectedUserId && selectedUserId !== "all") {
      if (isUUID(selectedUserId)) {
        setBulkUserId(selectedUserId);
      } else {
        const matched = combinedUserOptions.find(
          (u) =>
            u.id === selectedUserId ||
            u.name.toLowerCase().trim() === selectedUserId.toLowerCase().trim()
        );
        if (matched && isUUID(matched.id)) {
          setBulkUserId(matched.id);
        }
      }
    } else if (combinedUserOptions.length > 0) {
      setBulkUserId(combinedUserOptions[0].id);
    }

    if (fromDate) {
      const parts = fromDate.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y)) setBulkYear(y);
        if (!isNaN(m)) setBulkMonth(m);
      }
    }

    setBulkRejectionReason("");
    setBulkAdjustmentReason("");
    setDeductKms2W("");
    setDeductKms4W("");
    setBulkSettlementOpen(true);
  };

  // Submit Monthly Approval
  const handleBulkApprove = () => {
    if (!bulkUserId || !bulkMonth || !bulkYear) {
      toast.error("Please select Employee, Month, and Year.");
      return;
    }

    if (monthlyBreakdown.numDeduct2W > monthlyBreakdown.pendingKms2W) {
      toast.error(
        `2W deduction cannot exceed pending distance (${monthlyBreakdown.pendingKms2W.toFixed(2)} km).`
      );
      return;
    }

    if (monthlyBreakdown.numDeduct4W > monthlyBreakdown.pendingKms4W) {
      toast.error(
        `4W deduction cannot exceed pending distance (${monthlyBreakdown.pendingKms4W.toFixed(2)} km).`
      );
      return;
    }

    const body: Record<string, any> = {
      user_id: bulkUserId,
      month: bulkMonth,
      year: bulkYear,
      expense_per_km_2w: monthlyBreakdown.rate2W,
      expense_per_km_4w: monthlyBreakdown.rate4W,
      total_expense: monthlyBreakdown.finalPayableExpense,
      deducted_kms: monthlyBreakdown.totalDeductedKms,
      deducted_kms_2w: monthlyBreakdown.numDeduct2W,
      deducted_kms_4w: monthlyBreakdown.numDeduct4W,
      minus_kms: monthlyBreakdown.totalDeductedKms,
      invalid_kms: monthlyBreakdown.totalDeductedKms,
      approved_kms: monthlyBreakdown.totalPayableKms,
    };

    if (bulkAdjustmentReason.trim()) {
      body.adjustment_reason = bulkAdjustmentReason.trim();
      body.deduction_reason = bulkAdjustmentReason.trim();
      body.notes = bulkAdjustmentReason.trim();
      body.reason = bulkAdjustmentReason.trim();
    }

    setBulkLoading(true);
    dispatch({
      type: salesActions.BULK_APPROVE_ODOMETER,
      method: "POST",
      endPoint: API.SALES.ODOMETER_MONTHLY_APPROVE,
      auth: true,
      body,
      getResponse: (res: any) => {
        setBulkLoading(false);
        toast.success(res?.message || "Monthly odometer claims approved successfully.");
        setBulkSettlementOpen(false);
        fetchReadings();
      },
      getError: (err: any) => {
        setBulkLoading(false);
        toast.error(err?.response?.data?.message || err?.message || "Failed to approve monthly claims.");
      },
    } as any);
  };

  // Submit Monthly Rejection
  const handleBulkReject = () => {
    if (!bulkUserId || !bulkMonth || !bulkYear) {
      toast.error("Please select Employee, Month, and Year.");
      return;
    }
    if (!bulkRejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    setBulkLoading(true);
    dispatch({
      type: salesActions.BULK_REJECT_ODOMETER,
      method: "POST",
      endPoint: API.SALES.ODOMETER_MONTHLY_REJECT,
      auth: true,
      body: {
        user_id: bulkUserId,
        month: bulkMonth,
        year: bulkYear,
        rejection_reason: bulkRejectionReason.trim(),
      },
      getResponse: (res: any) => {
        setBulkLoading(false);
        toast.success(res?.message || "Monthly odometer claims rejected successfully.");
        setBulkSettlementOpen(false);
        fetchReadings();
      },
      getError: (err: any) => {
        setBulkLoading(false);
        toast.error(err?.response?.data?.message || err?.message || "Failed to reject monthly claims.");
      },
    } as any);
  };

  // Helper to open photo & details inspection modal
  const openDetailsModal = (row: OdometerReadingItem) => {
    setPhotoViewer({
      open: true,
      title: "Odometer Reading Details",
      startPhoto: row.start_odometer_photo,
      endPhoto: row.end_odometer_photo,
      startKms: row.start_kms,
      endKms: row.end_kms,
      totalKms: row.total_kms,
      rate: row.expense_per_km,
      expense: row.total_expense,
      userName: row.user_name,
      date: row.activity_date,
      status: row.status,
      approvedByName: row.approved_by_name,
      approvedAt: row.approved_at,
      adjustmentReason: row.adjustment_reason,
      rejectionReason: row.rejection_reason,
      vehicleType: row.vehicle_type_display || row.vehicle_type || "2W",
    });
  };

  // CSV Export
  const exportCsv = () => {
    if (canApprove && (!selectedUserId || selectedUserId === "all")) {
      toast.info("Please select an employee to export readings.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Employee",
      "Email",
      "Vehicle",
      "Start Kms",
      "End Kms",
      "Total Kms",
      "Rate/Km",
      "Total Expense",
      "Status",
      "Approved By",
      "Adjustment Reason",
      "Rejection Reason",
      "Paid",
    ].join(",");

    const rows = filteredReadings.map((r) =>
      [
        `"${r.id}"`,
        `"${r.activity_date}"`,
        `"${r.user_name}"`,
        `"${r.user_email || ""}"`,
        `"${r.vehicle_type_display || r.vehicle_type || ""}"`,
        `"${r.start_kms}"`,
        `"${r.end_kms}"`,
        `"${r.total_kms}"`,
        `"${r.expense_per_km}"`,
        `"${r.total_expense}"`,
        `"${r.status}"`,
        `"${r.approved_by_name || ""}"`,
        `"${r.adjustment_reason || ""}"`,
        `"${r.rejection_reason || ""}"`,
        `"${r.is_paid ? "Yes" : "No"}"`,
      ].join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Odometer_Readings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards Header */}
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Logs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setStatusFilter("all")}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[92px] ${
              statusFilter === "all" ? "border-primary/50 ring-1 ring-primary/20 bg-primary/[0.02]" : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mb-1">
                {canApprove ? "Total Travel Logs" : "My Travel Logs"}
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground truncate">
                {stats.totalCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {canApprove
                  ? selectedUserId && selectedUserId !== "all"
                    ? "Employee travel logs"
                    : "Select an employee"
                  : "Your recorded travel trips"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Gauge className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 2: Pending Approval */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => setStatusFilter("pending")}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[92px] ${
              statusFilter === "pending" ? "border-amber-400 ring-1 ring-amber-300 bg-amber-50/20" : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mb-1">
                Pending Approval
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 truncate">
                {stats.pendingCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {canApprove
                  ? selectedUserId && selectedUserId !== "all"
                    ? stats.pendingCount === 1
                      ? "1 claim awaits review"
                      : `${stats.pendingCount} claims await review`
                    : "Select an employee"
                  : "Awaiting manager approval"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 3: Approved Distance */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setStatusFilter("approved")}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[92px] ${
              statusFilter === "approved" ? "border-purple-400 ring-1 ring-purple-300 bg-purple-50/20" : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mb-1">
                Approved Distance
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-2xl font-bold font-mono tracking-tight text-foreground truncate cursor-help whitespace-nowrap flex items-baseline gap-1">
                    <span>{kmsInfo.compact}</span>
                    <span className="text-xs font-medium text-muted-foreground font-sans">
                      {kmsInfo.unit}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white text-xs font-mono font-semibold px-3 py-1.5 shadow-xl">
                  {kmsInfo.full}
                </TooltipContent>
              </Tooltip>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {canApprove
                  ? selectedUserId && selectedUserId !== "all"
                    ? "Verified travel distance"
                    : "Select an employee"
                  : "Your approved travel distance"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 4: Approved Expense */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setStatusFilter("approved")}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[92px] ${
              statusFilter === "approved" ? "border-green-400 ring-1 ring-green-300 bg-green-50/20" : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mb-1">
                Approved Travel Expense
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-2xl font-bold font-mono tracking-tight text-green-600 truncate cursor-help whitespace-nowrap">
                    {expenseInfo.compact}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white text-xs font-mono font-semibold px-3 py-1.5 shadow-xl">
                  {expenseInfo.full}
                </TooltipContent>
              </Tooltip>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {canApprove
                  ? selectedUserId && selectedUserId !== "all"
                    ? "Total approved payout"
                    : "Select an employee"
                  : "Your approved travel payout"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>
        </div>
      </TooltipProvider>

      {/* Filter Bar (Just users and date filter as in SalesActivitiesTab) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">From:</span>
            <Input
              type="date"
              title="From Date"
              className="h-9 w-40 text-sm"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">To:</span>
            <Input
              type="date"
              title="To Date"
              className="h-9 w-40 text-sm"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
            />
          </div>

          {canApprove && (
            <Select
              value={
                combinedUserOptions.find(
                  (u) =>
                    u.id === selectedUserId ||
                    u.name.toLowerCase().trim() === selectedUserId.toLowerCase().trim()
                )?.id || (selectedUserId !== "all" ? selectedUserId : "")
              }
              onValueChange={handleUserChange}
            >
              <SelectTrigger className="h-9 w-48 text-sm">
                <SelectValue placeholder="Select Employee..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {combinedUserOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(fromDate || toDate || (canApprove && selectedUserId && selectedUserId !== "all") || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-xs gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canApprove && (
            <Button
              size="sm"
              onClick={handleOpenMonthlySettlement}
              className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5" /> Monthly Approval / Rejection
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Main Table */}
      {canApprove && (!selectedUserId || selectedUserId === "all") ? (
        <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Select an Employee
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Please select an employee to view their odometer readings and review travel claims.
          </p>
          {combinedUserOptions.length > 0 && (
            <div className="max-w-xs mx-auto">
              <Select value={selectedUserId || ""} onValueChange={handleUserChange}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {combinedUserOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ) : loading ? (
        <TableSkeleton columns={11} rows={5} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {[
                    canApprove ? "Date & Employee" : "Date & Activity",
                    "Vehicle",
                    "Photos",
                    "Odometer (Start → End)",
                    "Total Distance",
                    "Rate",
                    "Amount",
                    "Status",
                    "Reviewed Info",
                    "Adjust Info",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReadings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-14 text-muted-foreground text-sm">
                      <Gauge className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      {canApprove
                        ? "No odometer readings found."
                        : "No odometer travel logs found for your account."}
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map((row, idx) => {
                    const badge = STATUS_BADGE[row.status] || STATUS_BADGE.pending;

                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        {/* Employee & Date */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground text-xs">{row.user_name}</div>
                          <div className="text-[11px] text-muted-foreground">{row.user_email}</div>
                          <div className="text-[11px] font-mono text-primary flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {row.activity_date}
                          </div>
                        </td>

                        {/* Vehicle Type */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[11px] font-semibold">
                            {row.vehicle_type_display || row.vehicle_type || "2W"}
                          </Badge>
                        </td>

                        {/* Photos Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {row.start_odometer_photo ? (
                              <button
                                type="button"
                                onClick={() => openDetailsModal(row)}
                                className="relative w-8 h-8 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity shrink-0"
                                title="View photos & details"
                              >
                                <img
                                  src={row.start_odometer_photo}
                                  alt="Start"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : null}

                            {row.end_odometer_photo ? (
                              <button
                                type="button"
                                onClick={() => openDetailsModal(row)}
                                className="relative w-8 h-8 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity shrink-0"
                                title="View photos & details"
                              >
                                <img
                                  src={row.end_odometer_photo}
                                  alt="End"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : null}

                            {!row.start_odometer_photo && !row.end_odometer_photo && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </td>

                        {/* Start and End Kms */}
                        <td className="px-4 py-3 font-mono text-xs">
                          <div>
                            <span className="text-muted-foreground text-[10px]">Start: </span>
                            {Number(row.start_kms).toLocaleString("en-IN")}
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px]">End: </span>
                            {Number(row.end_kms).toLocaleString("en-IN")}
                          </div>
                        </td>

                        {/* Total Distance */}
                        <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                          {Number(row.total_kms).toLocaleString("en-IN")} km
                        </td>

                        {/* Rate / Km */}
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          ₹{Number(row.expense_per_km).toFixed(2)}/km
                        </td>

                        {/* Total Expense */}
                        <td className="px-4 py-3 font-mono text-sm font-bold text-green-600">
                          ₹{Number(row.total_expense).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            {row.is_paid ? (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                Disbursed in Payroll
                              </Badge>
                            ) : null}
                          </div>
                        </td>

                        {/* Reviewed Info */}
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {row.status === "approved" && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] text-muted-foreground leading-tight">
                                Approved by <span className="font-semibold text-foreground">{row.approved_by_name || "Admin"}</span>
                              </div>
                              {row.approved_at && (
                                <div className="text-[10px] text-muted-foreground/80 font-mono">{row.approved_at}</div>
                              )}
                            </div>
                          )}
                          {row.status === "rejected" && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] text-red-600 font-medium">Claim Rejected</div>
                              {row.rejected_by_name && (
                                <div className="text-[10px] text-muted-foreground leading-tight">
                                  by <span className="font-semibold text-foreground">{row.rejected_by_name}</span>
                                </div>
                              )}
                              {row.rejected_at && (
                                <div className="text-[10px] text-muted-foreground/80 font-mono">{row.rejected_at}</div>
                              )}
                            </div>
                          )}
                          {row.status === "pending" && (
                            <span className="text-yellow-700 text-xs font-medium bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 inline-block">
                              Awaiting Review
                            </span>
                          )}
                        </td>

                        {/* Adjust Info */}
                        <td className="px-4 py-3 text-xs max-w-[220px]">
                          {row.status === "approved" && (() => {
                            const claimedKms = Math.max(0, (Number(row.end_kms) || 0) - (Number(row.start_kms) || 0));
                            const approvedKms = Number(row.total_kms) || 0;
                            const deductedKms = Math.max(0, claimedKms - approvedKms);
                            const hasDeduction = deductedKms > 0.001;
                            const reasonText = (row.adjustment_reason || "").trim();

                            if (!reasonText && !hasDeduction) {
                              return <span className="text-muted-foreground text-xs">—</span>;
                            }

                            return (
                              <div className="bg-amber-50 border border-amber-200/80 rounded-md p-1.5 text-[11px] text-amber-900 leading-snug">
                                <span className="font-bold text-amber-950 block text-[10px] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  Adjustment Reason:
                                </span>
                                {reasonText ? (
                                  <span className="break-words font-medium">{reasonText}</span>
                                ) : (
                                  <span className="text-amber-800 italic">Distance adjusted upon approval</span>
                                )}
                                {hasDeduction && (
                                  <div className="text-[10px] font-mono text-amber-900/90 font-medium mt-0.5">
                                    Deducted: -{deductedKms.toFixed(2)} km
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {row.status === "rejected" && (
                            row.rejection_reason ? (
                              <div className="bg-red-50 border border-red-200 rounded-md p-1.5 text-[11px] text-red-900 leading-snug">
                                <span className="font-bold text-red-950 block text-[10px] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <XCircle className="w-3 h-3 text-red-600 shrink-0" />
                                  Rejection Reason:
                                </span>
                                <span className="break-words font-medium">{row.rejection_reason}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )
                          )}
                          {row.status === "pending" && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {row.status === "pending" && canApprove ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenApprove(row)}
                                  className="h-7 text-xs px-2.5 bg-green-600 hover:bg-green-700 text-white gap-1"
                                  title="Approve / Deduct invalid kms"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReject(row)}
                                  className="h-7 text-xs px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                  title="Reject claim"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openDetailsModal(row)}
                                title="View Photos & Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── APPROVE MODAL (WITH INVALID KMS DEDUCTION) ─────────── */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-border">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-background shrink-0 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle className="text-base font-bold text-foreground">
                  Approve Travel Claim
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                  {approveTarget?.user_name} · {approveTarget?.activity_date} · Review distance and apply deductions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content Body */}
          {approveTarget && (
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
              {/* Top Meta Strip */}
              <div className="bg-muted/40 rounded-xl border border-border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {approveTarget.user_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-xs">{approveTarget.user_name}</div>
                    <div className="text-[11px] text-muted-foreground">{approveTarget.user_email || "No email provided"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-mono bg-background">
                    <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                    {approveTarget.activity_date}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold bg-background">
                    <Car className="w-3 h-3 mr-1 text-muted-foreground" />
                    {approveTarget.vehicle_type_display || approveTarget.vehicle_type || "2W"}
                  </Badge>
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ── LEFT COLUMN: Metrics & Photos ── */}
                <div className="space-y-4">
                  {/* Distance & Rate Card */}
                  <div className="bg-background rounded-xl border border-border p-3.5 shadow-sm space-y-2.5">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Trip Overview
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/60">
                        <span className="text-muted-foreground text-[10px] block">Start Odometer</span>
                        <span className="font-mono font-semibold text-foreground text-sm">
                          {Number(approveTarget.start_kms).toLocaleString("en-IN")} km
                        </span>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/60">
                        <span className="text-muted-foreground text-[10px] block">End Odometer</span>
                        <span className="font-mono font-semibold text-foreground text-sm">
                          {Number(approveTarget.end_kms).toLocaleString("en-IN")} km
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Claimed Total Distance:</span>
                      <span className="font-bold font-mono text-foreground text-sm">
                        {Number(approveTarget.total_kms).toLocaleString("en-IN")} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Approved Rate per Km:</span>
                      <span className="font-mono text-muted-foreground">₹{Number(approveTarget.expense_per_km).toFixed(2)}/km</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                      <span className="font-medium text-foreground">Original Claimed Amount:</span>
                      <span className="font-mono font-bold text-foreground">
                        ₹{Number(approveTarget.total_expense).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Photos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                        Odometer Verification Photos
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Click to enlarge</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {approveTarget.start_odometer_photo ? (
                        <div
                          onClick={() => window.open(approveTarget.start_odometer_photo, "_blank")}
                          className="group relative rounded-xl border border-border overflow-hidden bg-black/5 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                        >
                          <img
                            src={approveTarget.start_odometer_photo}
                            alt="Start Odometer"
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                            <div className="text-[10px] font-medium">Start Photo</div>
                            <div className="text-[11px] font-mono font-bold">{approveTarget.start_kms} km</div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border flex items-center justify-center p-4 text-[11px] text-muted-foreground text-center bg-muted/20 h-28">
                          No start photo
                        </div>
                      )}

                      {approveTarget.end_odometer_photo ? (
                        <div
                          onClick={() => window.open(approveTarget.end_odometer_photo, "_blank")}
                          className="group relative rounded-xl border border-border overflow-hidden bg-black/5 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                        >
                          <img
                            src={approveTarget.end_odometer_photo}
                            alt="End Odometer"
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                            <div className="text-[10px] font-medium">End Photo</div>
                            <div className="text-[11px] font-mono font-bold">{approveTarget.end_kms} km</div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border flex items-center justify-center p-4 text-[11px] text-muted-foreground text-center bg-muted/20 h-28">
                          No end photo
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Deduction & Live Calculation ── */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Deduction Input Field */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                      <Label htmlFor="invalid-kms" className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Invalid / Personal Kilometers to Deduct
                        </span>
                        {Number(invalidKms) > 0 && (
                          <button
                            type="button"
                            onClick={() => setInvalidKms("")}
                            className="text-[11px] text-amber-700 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </Label>

                      <div className="relative">
                        <Input
                          id="invalid-kms"
                          type="number"
                          min="0"
                          max={Number(approveTarget.total_kms)}
                          step="0.01"
                          placeholder="0.00"
                          value={invalidKms}
                          onChange={(e) => setInvalidKms(e.target.value)}
                          className="h-10 text-base font-mono font-semibold pr-12 bg-white border-amber-300 focus-visible:ring-amber-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                          km
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-800 leading-tight">
                        Enter any non-work or unapproved distance to deduct from the total.
                      </p>
                    </div>

                    {/* Adjustment Reason Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="deduction-note" className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Adjustment Reason / Deduction Note</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {Number(invalidKms) > 0 ? "(Visible to employee & all roles)" : "(Optional)"}
                        </span>
                      </Label>
                      <Input
                        id="deduction-note"
                        placeholder="e.g. Invalid / personal detour distance deducted"
                        value={deductionNote}
                        onChange={(e) => setDeductionNote(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Live Breakdown Box */}
                  {(() => {
                    const totalKms = Number(approveTarget.total_kms) || 0;
                    const rate = Number(approveTarget.expense_per_km) || 0;
                    const deduction = Math.max(0, Math.min(totalKms, Number(invalidKms) || 0));
                    const finalKms = Math.max(0, totalKms - deduction);
                    const finalExpense = finalKms * rate;
                    const deductedExpense = deduction * rate;

                    return (
                      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2 text-xs shadow-sm">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Final Approval Breakdown
                        </div>

                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Original Claimed Distance:</span>
                          <span className="font-mono">{totalKms.toFixed(2)} km</span>
                        </div>

                        {deduction > 0 && (
                          <div className="flex justify-between items-center text-red-600 font-medium">
                            <span>Deducted Distance:</span>
                            <span className="font-mono">-{deduction.toFixed(2)} km (-₹{deductedExpense.toFixed(2)})</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-border text-foreground font-semibold">
                          <span>Payable Distance:</span>
                          <span className="font-mono text-sm">{finalKms.toFixed(2)} km</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-border/60">
                          <span className="font-bold text-foreground">Approved Payable Amount:</span>
                          <span className="font-mono font-bold text-base text-green-600">
                            ₹{finalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveTarget(null)}
              disabled={approveLoading}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitApprove}
              disabled={approveLoading || !approveTarget}
              className="h-9 bg-green-600 hover:bg-green-700 text-white gap-1.5 px-4 text-xs font-semibold shadow-sm"
            >
              {approveLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {Number(invalidKms) > 0 ? "Approve with Deduction" : "Approve Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── REJECT MODAL ──────────────────────────────────────── */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-border">
          <DialogHeader className="px-6 py-4 border-b border-border bg-background shrink-0 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle className="text-base font-bold text-destructive">
                  Reject Odometer Reading
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Provide a clear reason for rejecting this travel claim.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {rejectTarget && (
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-semibold text-foreground">{rejectTarget.user_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Activity Date:</span>
                  <span className="font-mono">{rejectTarget.activity_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Claimed:</span>
                  <span className="font-bold font-mono text-foreground">
                    {rejectTarget.total_kms} km (₹{rejectTarget.total_expense})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
                  Reason for Rejection <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="e.g. Photos do not match dial readings, or unauthorized personal route..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectTarget(null)}
              disabled={rejectLoading}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSubmitReject}
              disabled={rejectLoading || !rejectionReason.trim()}
              className="h-9 gap-1.5 px-4 text-xs font-semibold shadow-sm"
            >
              {rejectLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── FULL PHOTO & DETAILS INSPECTION MODAL ───────────── */}
      <Dialog
        open={!!photoViewer?.open}
        onOpenChange={(open) => !open && setPhotoViewer(null)}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-border">
          <DialogHeader className="px-6 py-4 border-b border-border bg-background shrink-0 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle className="text-base font-bold text-foreground">
                  {photoViewer?.title || "Odometer Reading Details"}
                </DialogTitle>
                {photoViewer?.userName && (
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {photoViewer.userName} · {photoViewer.date} · {photoViewer.vehicleType || "2W"}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {photoViewer && (
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              {/* Trip & Review Summary Strip */}
              <div className="bg-muted/40 rounded-xl border border-border p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Odometer Range</span>
                    <span className="font-bold font-mono text-xs text-foreground">
                      {photoViewer.startKms} km → {photoViewer.endKms} km
                    </span>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Approved Distance</span>
                    <span className="font-bold font-mono text-sm text-foreground">
                      {photoViewer.totalKms || "—"} km
                    </span>
                  </div>
                  {photoViewer.expense && (
                    <div className="border-l border-border pl-4">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Payable Payout</span>
                      <span className="font-bold font-mono text-sm text-green-600">₹{photoViewer.expense}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {photoViewer.status && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                        STATUS_BADGE[photoViewer.status]?.cls || "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {STATUS_BADGE[photoViewer.status]?.label || photoViewer.status}
                    </span>
                  )}
                  {photoViewer.approvedByName && (
                    <span className="text-muted-foreground text-[11px]">
                      by <strong className="text-foreground">{photoViewer.approvedByName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Adjustment Reason Banner (Visible to all roles) */}
              {(() => {
                const claimed = Math.max(0, (Number(photoViewer.endKms) || 0) - (Number(photoViewer.startKms) || 0));
                const approved = Number(photoViewer.totalKms) || 0;
                const deducted = Math.max(0, claimed - approved);
                const hasDeduction = deducted > 0.001;
                const adjReason = (photoViewer.adjustmentReason || "").trim();

                if (!adjReason && !hasDeduction) return null;

                return (
                  <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5 shadow-sm">
                    <div className="font-bold text-amber-900 flex items-center justify-between uppercase tracking-wider text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Adjustment / Deduction Details
                      </span>
                      {hasDeduction && (
                        <span className="font-mono text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          -{deducted.toFixed(2)} km deducted
                        </span>
                      )}
                    </div>
                    {adjReason ? (
                      <p className="leading-relaxed font-medium pl-5 text-amber-950">{adjReason}</p>
                    ) : (
                      <p className="leading-relaxed font-normal pl-5 text-amber-800 italic">
                        Kilometers were adjusted/deducted during admin review and approval.
                      </p>
                    )}
                    {hasDeduction && (
                      <div className="pl-5 pt-1 border-t border-amber-200/60 flex items-center gap-4 text-[11px] font-mono text-amber-900">
                        <span>Claimed: {claimed.toFixed(2)} km</span>
                        <span>→</span>
                        <span>Approved: {approved.toFixed(2)} km</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Rejection Reason Banner (Visible to all roles) */}
              {photoViewer.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-950 space-y-1">
                  <div className="font-bold text-red-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    Rejection Reason
                  </div>
                  <p className="leading-relaxed font-medium pl-5">{photoViewer.rejectionReason}</p>
                </div>
              )}

              {/* Photos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photoViewer.startPhoto ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Start of Day Photo</span>
                      <span className="font-mono text-muted-foreground font-bold">{photoViewer.startKms} km</span>
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center">
                      <img
                        src={photoViewer.startPhoto}
                        alt="Start Odometer"
                        className="w-full max-h-[50vh] object-contain"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => window.open(photoViewer.startPhoto, "_blank")}
                    >
                      Open Full Resolution Image
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border flex items-center justify-center p-8 text-xs text-muted-foreground text-center">
                    No start odometer photo uploaded
                  </div>
                )}

                {photoViewer.endPhoto ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>End of Day Photo</span>
                      <span className="font-mono text-muted-foreground font-bold">{photoViewer.endKms} km</span>
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center">
                      <img
                        src={photoViewer.endPhoto}
                        alt="End Odometer"
                        className="w-full max-h-[50vh] object-contain"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => window.open(photoViewer.endPhoto, "_blank")}
                    >
                      Open Full Resolution Image
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border flex items-center justify-center p-8 text-xs text-muted-foreground text-center">
                    No end odometer photo uploaded
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => setPhotoViewer(null)} className="h-8 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── BULK MONTHLY SETTLEMENT DIALOG (APPROVAL, REJECTION & ADJUSTMENT) ─── */}
      <Dialog open={bulkSettlementOpen} onOpenChange={setBulkSettlementOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-border">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-background shrink-0 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle className="text-base font-bold text-foreground">
                  Monthly Approval, Rejection & Adjustment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Process monthly travel claims for an employee in bulk with rate adjustments and deduction notes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto space-y-5 text-xs">
            {/* 1. Target Selectors: Month, Year, Employee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/80">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-foreground">Month *</Label>
                <Select value={String(bulkMonth)} onValueChange={(v) => setBulkMonth(Number(v))}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {MONTH_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-foreground">Year *</Label>
                <Select value={String(bulkYear)} onValueChange={(v) => setBulkYear(Number(v))}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((yr) => (
                      <SelectItem key={yr} value={String(yr)} className="text-xs">
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-foreground">Employee / Member *</Label>
                <Select value={bulkUserId} onValueChange={setBulkUserId}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {combinedUserOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading Indicator */}
            {bulkSummaryLoading && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">Loading monthly travel records...</span>
              </div>
            )}

            {/* If no records */}
            {!bulkSummaryLoading && bulkOdoSummary && (bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W + bulkOdoSummary.approvedCount2W + bulkOdoSummary.approvedCount4W === 0) && (
              <div className="py-8 text-center bg-muted/20 border border-dashed border-border rounded-xl">
                <Gauge className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No travel logs found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No odometer records found for this member in {MONTH_OPTIONS.find((m) => m.value === bulkMonth)?.label} {bulkYear}.
                </p>
              </div>
            )}

            {/* Travel Summary & Rate Config */}
            {!bulkSummaryLoading && bulkOdoSummary && (bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W + bulkOdoSummary.approvedCount2W + bulkOdoSummary.approvedCount4W > 0) && (
              <div className="space-y-4">
                {/* Pending vs Approved Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pending Claims */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Approval ({bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W})
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">
                        Awaiting Review
                      </Badge>
                    </div>
                    <div className="space-y-1 pt-1 text-xs text-amber-900">
                      <div className="flex justify-between items-center">
                        <span>2W Travel ({bulkOdoSummary.pendingCount2W} logs):</span>
                        <span className="font-semibold font-mono">{bulkOdoSummary.pending2W.toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>4W Travel ({bulkOdoSummary.pendingCount4W} logs):</span>
                        <span className="font-semibold font-mono">{bulkOdoSummary.pending4W.toFixed(2)} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Approved (Unpaid) Claims */}
                  <div className="bg-green-50/60 border border-green-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Already Approved / Unpaid ({bulkOdoSummary.approvedCount2W + bulkOdoSummary.approvedCount4W})
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800 border-green-300">
                        Ready for Settlement
                      </Badge>
                    </div>
                    <div className="space-y-1 pt-1 text-xs text-green-900">
                      <div className="flex justify-between items-center">
                        <span>2W Travel ({bulkOdoSummary.approvedCount2W} logs):</span>
                        <span className="font-semibold font-mono">{bulkOdoSummary.approved2W.toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>4W Travel ({bulkOdoSummary.approvedCount4W} logs):</span>
                        <span className="font-semibold font-mono">{bulkOdoSummary.approved4W.toFixed(2)} km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rates Configuration */}
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border">
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-primary" /> Expense Rates per Kilometer
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground mb-1 block">2W Rate (₹/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bulkExpensePerKm2W}
                        onChange={(e) => setBulkExpensePerKm2W(e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground mb-1 block">4W Rate (₹/km)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bulkExpensePerKm4W}
                        onChange={(e) => setBulkExpensePerKm4W(e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── MONTHLY KM DEDUCTION & ADJUSTMENT SECTION ─── */}
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Invalid / Personal Kilometers to Deduct (km)
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      Claimed: {monthlyBreakdown.totalClaimedKms.toFixed(2)} km
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground -mt-1 leading-relaxed">
                    Enter the invalid or personal kilometers to deduct. Any entered value will be deducted from total distance.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[11px] font-semibold text-foreground">
                          2W Kilometers to Deduct (km)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Pending: {monthlyBreakdown.pendingKms2W.toFixed(2)} km
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={monthlyBreakdown.pendingKms2W}
                          placeholder="0.00"
                          value={deductKms2W}
                          onChange={(e) => setDeductKms2W(e.target.value)}
                          className="h-9 text-xs font-mono font-semibold pr-10 bg-background"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground pointer-events-none">
                          km
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[11px] font-semibold text-foreground">
                          4W Kilometers to Deduct (km)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Pending: {monthlyBreakdown.pendingKms4W.toFixed(2)} km
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={monthlyBreakdown.pendingKms4W}
                          placeholder="0.00"
                          value={deductKms4W}
                          onChange={(e) => setDeductKms4W(e.target.value)}
                          className="h-9 text-xs font-mono font-semibold pr-10 bg-background"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground pointer-events-none">
                          km
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-foreground mb-1 block">
                      Deduction Note / Audit Remarks (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. Deducted personal travel, unauthorized weekend trips..."
                      value={bulkAdjustmentReason}
                      onChange={(e) => setBulkAdjustmentReason(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  {/* Final Breakdown Banner (Matches Individual Modal Style) */}
                  <div className="bg-amber-100/60 border border-amber-300/80 rounded-lg p-3 text-xs space-y-1.5 mt-2">
                    <div className="font-bold text-amber-950 uppercase tracking-wider text-[10px]">
                      Final Monthly Approval Breakdown
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Claimed Distance:</span>
                      <span className="font-mono font-medium">
                        {monthlyBreakdown.totalClaimedKms.toFixed(2)} km (₹{monthlyBreakdown.originalTotalExpense.toFixed(2)})
                      </span>
                    </div>
                    {monthlyBreakdown.totalDeductedKms > 0 ? (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>Deducted Distance:</span>
                        <span className="font-mono">
                          -{monthlyBreakdown.totalDeductedKms.toFixed(2)} km (-₹{monthlyBreakdown.totalDeductionExpense.toFixed(2)})
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Deducted Distance:</span>
                        <span className="font-mono">0.00 km (No deduction)</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-amber-200/80 flex justify-between items-center text-sm">
                      <span className="font-bold text-amber-950">Approved Payable Distance:</span>
                      <span className="font-mono font-bold text-amber-950">
                        {monthlyBreakdown.totalPayableKms.toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-green-700">Approved Payable Amount:</span>
                      <span className="font-mono font-bold text-green-700 text-base">
                        ₹{monthlyBreakdown.finalPayableExpense.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── ACTION BLOCKS: APPROVE & REJECT ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Approve Block */}
                  <div className="p-3.5 bg-green-50/50 rounded-xl border border-green-200 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-semibold text-xs text-green-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Approve Pending Claims
                      </h4>
                      <p className="text-[11px] text-green-800 mt-1 leading-snug">
                        Approve {bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W} pending log(s) for a final payable total of{" "}
                        <strong className="font-mono font-bold text-green-700">
                          ₹{monthlyBreakdown.finalPayableExpense.toFixed(2)}
                        </strong>{" "}
                        ({monthlyBreakdown.totalPayableKms.toFixed(2)} km).
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={bulkLoading || (bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W === 0)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      {bulkLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Monthly Claims
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Reject Block */}
                  <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-200 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-semibold text-xs text-red-950 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Reject Pending Claims
                      </h4>
                      <p className="text-[11px] text-red-800 mt-1 leading-snug">
                        Reject all {bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W} pending log(s) for this month.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Rejection reason * (required)"
                        value={bulkRejectionReason}
                        onChange={(e) => setBulkRejectionReason(e.target.value)}
                        className="h-8 text-xs bg-background border-red-200"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkReject}
                        disabled={
                          bulkLoading ||
                          (bulkOdoSummary.pendingCount2W + bulkOdoSummary.pendingCount4W === 0) ||
                          !bulkRejectionReason.trim()
                        }
                        className="w-full h-9 text-xs font-semibold gap-1.5 shadow-sm"
                      >
                        {bulkLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Reject Monthly Claims
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/30 shrink-0 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => setBulkSettlementOpen(false)} className="h-8 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
