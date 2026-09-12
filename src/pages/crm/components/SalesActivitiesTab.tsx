import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Calendar,
  Camera,
  Plus,
  RefreshCw,
  Gauge,
  User,
  Image as ImageIcon,
  CheckCircle2,
  Navigation,
  FileText,
  Clock,
  Eye,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/service/api";
import {
  SalesDailyActivity,
  SalesActivityPhoto,
  SalesPhotoType,
  PHOTO_TYPE_LABELS,
  OdometerReading,
  SalesDailyPlan,
} from "@/types/salesActivity";
import { TableSkeleton } from "@/components/common/Skeletons";

const PHOTO_TYPES: { value: SalesPhotoType; label: string; isMeter?: boolean }[] = [
  { value: "start_selfie", label: "Start of Day Selfie" },
  { value: "start_odometer", label: "Start of Day Odometer", isMeter: true },
  { value: "school_interior", label: "School Interior" },
  { value: "school_exterior", label: "School Exterior" },
  { value: "exhibition", label: "Exhibition (Max 6)" },
  { value: "end_odometer", label: "End of Day Odometer", isMeter: true },
  { value: "end_selfie", label: "End of Day Selfie" },
];

export default function SalesActivitiesTab() {
  const toast = useToast();
  const { user } = useAuth();

  const [plans, setPlans] = useState<SalesDailyPlan[]>([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [loading, setLoading] = useState(false);
  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [teamUsers, setTeamUsers] = useState<any[]>([]);

  const fetchTeamUsers = useCallback(async () => {
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.USERS.LIST}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allUsers = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // Filter out non-staff members like students and parents
        setTeamUsers(allUsers.filter((u: any) => u.role !== "student" && u.role !== "parents" && u.role !== "parent"));
      }
    } catch (err) {
      console.error("Failed to fetch team users:", err);
    }
  }, []);

  useEffect(() => {
    fetchTeamUsers();
  }, [fetchTeamUsers]);

  // Create Activity Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [planDescription, setPlanDescription] = useState("");
  const [planDate, setPlanDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Upload Photo Dialog
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SalesDailyActivity | null>(null);
  const [photoType, setPhotoType] = useState<SalesPhotoType>("start_selfie");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [odometerKms, setOdometerKms] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  // Preview Image Modal
  const [previewPhoto, setPreviewPhoto] = useState<SalesActivityPhoto | null>(null);

  // Odometer Approval/Rejection State
  const [odometerReadings, setOdometerReadings] = useState<OdometerReading[]>([]);
  const [approveOdoReading, setApproveOdoReading] = useState<OdometerReading | null>(null);
  const [expensePerKm, setExpensePerKm] = useState<string>("6.50");
  const [rejectOdoReading, setRejectOdoReading] = useState<OdometerReading | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Bulk Settlement State
  const [bulkSettlementOpen, setBulkSettlementOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState<number>(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
  const [bulkUserId, setBulkUserId] = useState<string>("");
  const [bulkExpensePerKm, setBulkExpensePerKm] = useState<string>("7.50");
  const [bulkRejectionReason, setBulkRejectionReason] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const isSalesStaff =
    user?.role === "sales_executive" ||
    user?.role === "sales_senior_executive" ||
    user?.role === "tele_caller";

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const params = new URLSearchParams();
      if (dateFilter && dateFilter !== 'all') params.append("date", dateFilter);
      if (search) params.append("search", search);
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);
      if (userIdFilter && userIdFilter !== "all") params.append("user_id", userIdFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (isPaidFilter && isPaidFilter !== "all") params.append("is_paid", isPaidFilter);

      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`${baseUrl}${API.SALES.PLANS}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch sales plans");
      const data = await res.json();
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      setPlans(list);
      return list;

      // Fetch odometer readings
      const odoRes = await fetch(`${baseUrl}${API.SALES.ODOMETER_READINGS}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (odoRes.ok) {
        const odoData = await odoRes.json();
        const odoList = Array.isArray(odoData?.results)
          ? odoData.results
          : Array.isArray(odoData?.data)
            ? odoData.data
            : Array.isArray(odoData)
              ? odoData
              : [];
        setOdometerReadings(odoList);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load sales plans");
    } finally {
      setLoading(false);
    }
  }, [toast, search, fromDate, toDate, userIdFilter, statusFilter, isPaidFilter]);

  const handleApproveOdo = async () => {
    if (!approveOdoReading) return;
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.SALES.ODOMETER_READING_APPROVE(approveOdoReading.id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expense_per_km: parseFloat(expensePerKm) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to approve odometer reading");
      }
      toast.success("Odometer reading approved successfully");
      setApproveOdoReading(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleRejectOdo = async () => {
    if (!rejectOdoReading) return;
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.SALES.ODOMETER_READING_REJECT(rejectOdoReading.id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || "Failed to reject odometer reading");
      }
      toast.success("Odometer reading rejected successfully");
      setRejectOdoReading(null);
      setRejectionReason("");
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkUserId || !bulkMonth || !bulkYear) {
      toast.error("Please select User, Month, and Year");
      return;
    }
    setBulkLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.SALES.ODOMETER_MONTHLY_APPROVE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: bulkUserId,
          month: bulkMonth,
          year: bulkYear,
          expense_per_km: parseFloat(bulkExpensePerKm),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || "Failed to bulk approve");
      toast.success(data.message || "Bulk approval successful");
      setBulkSettlementOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!bulkUserId || !bulkMonth || !bulkYear) {
      toast.error("Please select User, Month, and Year");
      return;
    }
    if (!bulkRejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setBulkLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.SALES.ODOMETER_MONTHLY_REJECT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: bulkUserId,
          month: bulkMonth,
          year: bulkYear,
          rejection_reason: bulkRejectionReason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || "Failed to bulk reject");
      toast.success(data.message || "Bulk rejection successful");
      setBulkSettlementOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans().then(fetched => {
      if (isSalesStaff && !fromDate && !toDate && fetched?.length === 0) {
        setCreateOpen(true);
      }
    });
  }, [fetchPlans, isSalesStaff, fromDate, toDate]);

  // Geolocation fetcher
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
        toast.success("Current GPS location acquired");
      },
      (err) => {
        setGettingLocation(false);
        toast.error(`Unable to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCreatePlan = async () => {
    setCreateLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.SALES.PLANS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_date: planDate,
          description: planDescription,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || "Failed to initialize daily plan");
      }

      toast.success("Daily plan initialized successfully.");
      setCreateOpen(false);
      setPlanDescription("");
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedActivity) return;
    if (!photoFile) {
      toast.error("Please select a photo to upload");
      return;
    }
    if (!latitude || !longitude) {
      toast.error("GPS Coordinates (Latitude & Longitude) are required");
      return;
    }

    const isMeterType = photoType === "start_odometer" || photoType === "end_odometer";
    if (isMeterType && (!odometerKms || isNaN(Number(odometerKms)))) {
      toast.error("Valid odometer reading in kilometers is required for meter photos");
      return;
    }

    // Check exhibition photo count
    if (photoType === "exhibition") {
      const exhibitionCount = selectedActivity.photos.filter((p) => p.photo_type === "exhibition").length;
      if (exhibitionCount >= 6) {
        toast.error("A maximum of 6 exhibition photos is allowed per activity day.");
        return;
      }
    }

    setPhotoLoading(true);
    try {
      const raw = localStorage.getItem("Insight_Login_Data");
      const token = raw ? JSON.parse(raw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("photo_type", photoType);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      if (isMeterType) {
        formData.append("odometer_kms", odometerKms);
      }
      formData.append("captured_at", new Date().toISOString());

      const res = await fetch(`${baseUrl}${API.SALES.ACTIVITY_PHOTOS(selectedActivity.id)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || "Failed to upload photo evidence");
      }

      toast.success("Photo verification uploaded successfully.");
      setPhotoOpen(false);
      setPhotoFile(null);
      setOdometerKms("");
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during upload");
    } finally {
      setPhotoLoading(false);
    }
  };

  const filteredPlans = plans.filter((act) => {
    if (statusFilter !== "all" || isPaidFilter !== "all") {
      const actOdoReading = odometerReadings.find((r: any) => (r.activity?.id || r.activity) === act.id) || (act as any).odometer_reading || (act as any).odometer_claim;
      if (!actOdoReading) return false;
      if (statusFilter !== "all" && actOdoReading.status !== statusFilter) return false;
      if (isPaidFilter !== "all" && String(actOdoReading.is_paid) !== isPaidFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">From:</span>
            <Input
              type="date"
              title="From Date"
              className="h-9 w-40 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">To:</span>
            <Input
              type="date"
              title="To Date"
              className="h-9 w-40 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Select value={userIdFilter} onValueChange={setUserIdFilter}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue placeholder="Team Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {teamUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.first_name ? `${u.first_name} ${u.last_name}` : (u.name || u.username || u.email || u.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={isPaidFilter} onValueChange={setIsPaidFilter}>
            <SelectTrigger className="h-9 w-32 text-sm">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="true">Paid</SelectItem>
              <SelectItem value="false">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          {(search || fromDate || toDate || (userIdFilter && userIdFilter !== "all") || (statusFilter && statusFilter !== "all") || (isPaidFilter && isPaidFilter !== "all")) && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
                setUserIdFilter("all");
                setStatusFilter("all");
                setIsPaidFilter("all");
                setTimeout(fetchPlans, 0); // Trigger fetch after clear
              }}
            >
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={fetchPlans}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {!isSalesStaff && (
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-1 bg-primary text-primary-foreground"
              onClick={() => setBulkSettlementOpen(true)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Monthly Settlement
            </Button>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
          <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="font-semibold text-foreground text-sm">No Field Activities Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {isSalesStaff
              ? "You haven't logged any field activities yet. Click the button above to start your day's log."
              : "No field activities match the current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPlans.map((plan) => {
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-card rounded-xl border border-border/60 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-foreground">
                        {plan.user_name || "Sales Executive"}
                      </span>
                      <Badge variant="outline" className="text-xs font-medium gap-1 bg-primary/5 text-primary">
                        <Calendar className="w-3 h-3" />
                        {plan.plan_date}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-0.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{plan.description}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Iterate over nested activities */}
                {plan.activities && plan.activities.length > 0 ? plan.activities.map((act) => {
                  const startOdo = act.photos.find((p) => p.photo_type === "start_odometer")?.odometer_kms;
                  const endOdo = act.photos.find((p) => p.photo_type === "end_odometer")?.odometer_kms;
                  const distance =
                    startOdo && endOdo
                      ? (Number(endOdo) - Number(startOdo)).toFixed(1)
                      : null;
                      
                  return (
                    <div key={act.id} className="mt-4 pt-4 border-t border-dashed border-border/50">
                      {act.notes && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-0.5 mb-3">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{act.notes}</span>
                        </p>
                      )}
                      {/* Verification Photos Timeline */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" /> Geo-Tagged Evidence ({act.photos.length})
                          </h4>
                        </div>

                  {act.photos.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic bg-muted/20 rounded-lg p-3">
                      No verification photos uploaded yet for this day.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {act.photos.map((p) => (
                        <div
                          key={p.id}
                          className="group relative rounded-lg border border-border/80 bg-background overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setPreviewPhoto(p)}
                        >
                          <div className="aspect-video w-full bg-muted/40 relative flex items-center justify-center overflow-hidden">
                            <img
                              src={p.photo}
                              alt={p.photo_type_display || p.photo_type}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as any).src = "https://placehold.co/400x300?text=Photo+Unavailable";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="text-[11px] font-semibold truncate text-foreground">
                              {p.photo_type_display || PHOTO_TYPE_LABELS[p.photo_type] || p.photo_type}
                            </div>
                            {p.odometer_kms && (
                              <div className="text-[10px] text-primary font-bold flex items-center gap-1">
                                <Gauge className="w-3 h-3" /> {p.odometer_kms} km
                              </div>
                            )}
                            {p.latitude && p.longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate group/loc w-fit max-w-full"
                                onClick={(e) => e.stopPropagation()}
                                title="Open location in Google Maps"
                              >
                                <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0 group-hover/loc:scale-110 transition-transform" />
                                <span className="underline underline-offset-2 truncate">
                                  {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                                </span>
                                <ExternalLink className="w-2 h-2 opacity-0 group-hover/loc:opacity-100 transition-opacity shrink-0" />
                              </a>
                            ) : (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                <span>No GPS</span>
                              </div>
                            )}
                            <div className="text-[9px] text-muted-foreground">
                              {new Date(p.captured_at || p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Odometer Reading Status & Actions */}
                {(() => {
                  const actOdoReading = odometerReadings.find((r: any) => (r.activity?.id || r.activity) === act.id) || (act as any).odometer_reading || (act as any).odometer_claim;
                  
                  const startOdo = act.photos.find((p) => p.photo_type === "start_odometer");
                  const endOdo = act.photos.find((p) => p.photo_type === "end_odometer");
                  
                  if (!actOdoReading && !startOdo && !endOdo) return null;

                  const readingId = actOdoReading?.id || act.id;
                  const totalKms = actOdoReading?.total_kms || (startOdo && endOdo ? (Number(endOdo.odometer_kms) - Number(startOdo.odometer_kms)).toFixed(1) : "0.00");
                  const status = actOdoReading?.status || "pending";
                  const canApprove = !isSalesStaff && status === "pending";

                  return (
                    <div className="bg-muted/30 p-3 rounded-lg border border-border mt-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <Gauge className="w-4 h-4 text-primary" /> Odometer Claim
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {totalKms} km reported ({actOdoReading?.start_kms || startOdo?.odometer_kms || "0"} - {actOdoReading?.end_kms || endOdo?.odometer_kms || "0"})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              status === "approved"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : status === "rejected"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {status.toUpperCase()}
                          </Badge>
                          
                          {canApprove && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setApproveOdoReading({ id: readingId, total_kms: totalKms } as any)}>
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectOdoReading({ id: readingId } as any)}>
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                          
                          {status === "approved" && actOdoReading && (
                            <div className="text-xs text-right">
                              <div className="font-medium">₹{actOdoReading.total_expense} (@ ₹{actOdoReading.expense_per_km}/km)</div>
                              <div className="text-muted-foreground text-[10px]">by {actOdoReading.approved_by_name}</div>
                            </div>
                          )}
                          {status === "rejected" && actOdoReading && (
                            <div className="text-xs text-right max-w-[200px]">
                              <div className="font-medium text-destructive truncate" title={actOdoReading.rejection_reason || "No reason"}>{actOdoReading.rejection_reason}</div>
                              <div className="text-muted-foreground text-[10px]">by {actOdoReading.rejected_by_name}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                    </div>
                  );
                }) : (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 rounded-lg p-3 text-center">
                    No field activities recorded for this plan yet.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Initialize Daily Activity Dialog ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Daily Field Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Activity Date *</Label>
              <Input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Day's Target / Remarks</Label>
              <Textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Visiting St. Xavier's and Ryan International for CS course seminar."
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={createLoading || !planDate} className="bg-primary text-primary-foreground">
              {createLoading ? "Saving…" : "Initialize Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Upload Photo Evidence Dialog ─── */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Field Photo Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">Photo Type *</Label>
              <Select
                value={photoType}
                onValueChange={(v: SalesPhotoType) => setPhotoType(v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Select Image (JPEG/PNG) *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
              />
            </div>

            {/* Conditional Odometer Field */}
            {(photoType === "start_odometer" || photoType === "end_odometer") && (
              <div>
                <Label className="text-xs mb-1 block font-semibold text-primary">
                  Odometer Reading (KMs) *
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 14250.50"
                  value={odometerKms}
                  onChange={(e) => setOdometerKms(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* GPS Coordinates */}
            <div className="bg-muted/30 p-3 rounded-lg space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> GPS Geolocation
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={fetchCurrentLocation}
                  disabled={gettingLocation}
                >
                  <Navigation className="w-3 h-3" />
                  {gettingLocation ? "Locating…" : "Detect Location"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground block">Latitude</Label>
                  <Input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="19.113650"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground block">Longitude</Label>
                  <Input
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="72.869740"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoOpen(false)} disabled={photoLoading}>
              Cancel
            </Button>
            <Button onClick={handleUploadPhoto} disabled={photoLoading || !photoFile || !latitude || !longitude} className="bg-primary text-primary-foreground">
              {photoLoading ? "Uploading…" : "Upload Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Photo Modal ─── */}
      <Dialog open={!!previewPhoto} onOpenChange={(o) => !o && setPreviewPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewPhoto?.photo_type_display || previewPhoto?.photo_type}
            </DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="space-y-3">
              <div className="max-h-[50vh] overflow-hidden rounded-lg bg-black/90 flex items-center justify-center">
                <img
                  src={previewPhoto.photo}
                  alt={previewPhoto.photo_type}
                  className="max-h-[50vh] max-w-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block">Odometer</span>
                  <span className="font-semibold">{previewPhoto.odometer_kms ? `${previewPhoto.odometer_kms} km` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Latitude</span>
                  <span className="font-mono">{previewPhoto.latitude || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Longitude</span>
                  <span className="font-mono">{previewPhoto.longitude || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Google Maps</span>
                  {previewPhoto.latitude && previewPhoto.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${previewPhoto.latitude},${previewPhoto.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                      title="Open in Google Maps"
                    >
                      <MapPin className="w-3 h-3 text-red-500" />
                      View Map
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block">Captured At</span>
                  <span>{new Date(previewPhoto.captured_at || previewPhoto.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Odometer Approval Actions inside Modal */}
              {(() => {
                if (previewPhoto.photo_type !== "start_odometer" && previewPhoto.photo_type !== "end_odometer") return null;

                const allActivities = plans.flatMap(p => p.activities || []);
                const actOdoReading = odometerReadings.find((r: any) => (r.activity?.id || r.activity) === previewPhoto.activity) ||
                  (allActivities.find(a => a.id === previewPhoto.activity) as any)?.odometer_reading ||
                  (allActivities.find(a => a.id === previewPhoto.activity) as any)?.odometer_claim;

                const act = allActivities.find(a => a.id === previewPhoto.activity);
                const startOdo = act?.photos.find((p) => p.photo_type === "start_odometer");
                const endOdo = act?.photos.find((p) => p.photo_type === "end_odometer");

                const readingId = actOdoReading?.id || previewPhoto.activity;
                const totalKms = actOdoReading?.total_kms || (startOdo && endOdo ? (Number(endOdo.odometer_kms) - Number(startOdo.odometer_kms)).toFixed(1) : "0.00");
                const status = actOdoReading?.status || "pending";
                const canApprove = !isSalesStaff && status === "pending";

                return (
                  <div className="bg-card border border-border p-3 rounded-lg mt-2 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-xs font-semibold flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" /> Odometer Claim
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {totalKms} km ({status.toUpperCase()})
                      </p>
                    </div>
                    
                    {canApprove && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setApproveOdoReading({ id: readingId, total_kms: totalKms } as any)}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectOdoReading({ id: readingId } as any)}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Approve Odometer Reading Dialog ─── */}
      <Dialog open={!!approveOdoReading} onOpenChange={(o) => !o && setApproveOdoReading(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Odometer Reading</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are approving the odometer claim for <strong>{approveOdoReading?.total_kms} km</strong>.
            </p>
            <div>
              <Label className="text-xs mb-1 block">Expense per KM (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                value={expensePerKm}
                onChange={(e) => setExpensePerKm(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {approveOdoReading && expensePerKm && (
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-sm font-medium text-primary flex justify-between">
                <span>Total Calculated Expense:</span>
                <span>₹{(parseFloat(approveOdoReading.total_kms) * parseFloat(expensePerKm || "0")).toFixed(2)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOdoReading(null)}>
              Cancel
            </Button>
            <Button onClick={handleApproveOdo} className="bg-green-600 hover:bg-green-700 text-white">
              Confirm & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Odometer Reading Dialog ─── */}
      <Dialog open={!!rejectOdoReading} onOpenChange={(o) => !o && setRejectOdoReading(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Odometer Reading</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason for rejecting this claim..."
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOdoReading(null)}>
              Cancel
            </Button>
            <Button onClick={handleRejectOdo} variant="destructive">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Monthly Settlement Dialog ─── */}
      <Dialog open={bulkSettlementOpen} onOpenChange={setBulkSettlementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Monthly Settlement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Month *</Label>
                <Select value={String(bulkMonth)} onValueChange={(v) => setBulkMonth(Number(v))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Year *</Label>
                <Select value={String(bulkYear)} onValueChange={(v) => setBulkYear(Number(v))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map((offset) => {
                      const yr = new Date().getFullYear() - offset;
                      return (
                        <SelectItem key={yr} value={String(yr)}>
                          {yr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-xs mb-1 block">User *</Label>
              <Select value={bulkUserId} onValueChange={setBulkUserId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent>
                  {teamUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name ? `${u.first_name} ${u.last_name}` : (u.name || u.username || u.email || u.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-3 mt-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Approve All Pending</h4>
              <div>
                <Label className="text-xs mb-1 block">Expense per KM (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bulkExpensePerKm}
                  onChange={(e) => setBulkExpensePerKm(e.target.value)}
                  className="h-9 text-sm bg-background"
                />
              </div>
              <Button onClick={handleBulkApprove} disabled={bulkLoading || !bulkUserId} className="w-full bg-green-600 hover:bg-green-700 text-white h-9">
                {bulkLoading ? "Processing..." : "Approve Pending Records"}
              </Button>
            </div>

            <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-200/50 space-y-3 mt-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Reject All Pending</h4>
              <div>
                <Label className="text-xs mb-1 block text-red-900/70 dark:text-red-200">Rejection Reason *</Label>
                <Textarea
                  value={bulkRejectionReason}
                  onChange={(e) => setBulkRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for rejecting all..."
                  className="text-sm resize-none bg-background border-red-200"
                />
              </div>
              <Button onClick={handleBulkReject} disabled={bulkLoading || !bulkUserId || !bulkRejectionReason} variant="destructive" className="w-full h-9">
                {bulkLoading ? "Processing..." : "Reject Pending Records"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
