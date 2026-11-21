import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  RefreshCw,
  Eye,
  ShieldCheck,
  Download,
} from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setSelectedExam } from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export interface DutyPhotoRecord {
  id?: string | number;
  exam_id?: string;
  type?: "start" | "end";
  photo?: string | null;
  photo_url?: string | null;
  image?: string;
  file?: string;
  submitted_at?: string | null;
  created_at?: string;
  deadline?: string | null;
  late_minutes?: number;
  supervisor_id?: string;
  supervisor_name?: string;
  supervisor_email?: string;
  start_submitted?: boolean;
  end_submitted?: boolean;
  start_submitted_at?: string | null;
  end_submitted_at?: string | null;
  start_photo_url?: string | null;
  end_photo_url?: string | null;
  payable_hours?: number;
  [key: string]: any;
}

export interface SupervisorDutySummary {
  supervisorId: string;
  supervisorName: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  isCurrentUser: boolean;
  startSubmitted: boolean;
  endSubmitted: boolean;
  startPhotoUrl?: string | null;
  startSubmittedAt?: string | null;
  startLateMinutes?: number;
  startDeadline?: string | null;
  endPhotoUrl?: string | null;
  endSubmittedAt?: string | null;
  payableHours?: number;
}

interface DutyPhotosTabProps {
  exam: Exam;
}

/** Helper to format date-time string */
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/** Helper to resolve photo full URL */
function getPhotoUrl(photo?: string | null): string {
  if (!photo) return "";
  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("blob:") ||
    photo.startsWith("data:")
  ) {
    return photo;
  }
  const baseUrl = (import.meta.env.VITE_APP_BASE_URL || "").replace(/\/+$/, "");
  const cleanPath = photo.startsWith("/") ? photo : `/${photo}`;
  return `${baseUrl}${cleanPath}`;
}

/** Component for rendering duty photos with React-state fallback across storage domains */
function DutyPhotoImage({
  src,
  alt,
  className,
  onImageClick,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  onImageClick?: (workingSrc: string) => void;
}) {
  const initialUrl = getPhotoUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [triedHrms, setTriedHrms] = useState<boolean>(false);
  const [triedInsights, setTriedInsights] = useState<boolean>(false);
  const [triedBase, setTriedBase] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSrc(getPhotoUrl(src));
    setTriedHrms(false);
    setTriedInsights(false);
    setTriedBase(false);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (currentSrc.includes("insightsinstitutes.blob.core.windows.net") && !triedHrms) {
      setTriedHrms(true);
      const nextSrc = currentSrc.replace(
        "insightsinstitutes.blob.core.windows.net",
        "hrmsknowcraftstorage.blob.core.windows.net"
      );
      setCurrentSrc(nextSrc);
      return;
    }
    if (currentSrc.includes("hrmsknowcraftstorage.blob.core.windows.net") && !triedInsights) {
      setTriedInsights(true);
      const nextSrc = currentSrc.replace(
        "hrmsknowcraftstorage.blob.core.windows.net",
        "insightsinstitutes.blob.core.windows.net"
      );
      setCurrentSrc(nextSrc);
      return;
    }
    const baseUrl = (import.meta.env.VITE_APP_BASE_URL || "").replace(/\/+$/, "");
    if (baseUrl && !triedBase) {
      setTriedBase(true);
      try {
        const parsed = new URL(currentSrc);
        if (!currentSrc.startsWith(baseUrl)) {
          setCurrentSrc(`${baseUrl}${parsed.pathname}`);
          return;
        }
      } catch {}
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-muted/40 text-muted-foreground gap-2">
        <Camera className="w-8 h-8 text-muted-foreground/40" />
        <span className="text-xs font-medium">Failed to load photo</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onClick={() => onImageClick?.(currentSrc)}
    />
  );
}

/** Proper Skeleton Loader tailored for 1 supervisor per exam */
function SupervisorDutySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
            <div className="h-3.5 w-24 bg-muted rounded" />
            <div className="h-6 w-28 bg-muted/80 rounded" />
          </div>
        ))}
      </div>

      {/* Main Single Supervisor Card Skeleton */}
      <div className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-sm space-y-5">
        {/* Supervisor Profile Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-44 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted/70 rounded-full" />
              </div>
              <div className="h-3.5 w-52 bg-muted/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-32 bg-muted rounded-full" />
        </div>

        {/* Photos Grid Skeleton: 2 Symmetrical Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Start Photo Box Skeleton */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-80 sm:h-96 md:h-[420px] w-full rounded-lg bg-muted/40" />
            </div>
            <div className="pt-2.5 border-t border-border/40 flex justify-between items-center">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-36 bg-muted rounded" />
            </div>
          </div>

          {/* End Photo Box Skeleton */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-80 sm:h-96 md:h-[420px] w-full rounded-lg bg-muted/40" />
            </div>
            <div className="pt-2.5 border-t border-border/40 flex justify-between items-center">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-36 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DutyPhotosTab({ exam }: DutyPhotosTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  // Roles determination
  const userRoles = useMemo(() => {
    const primary = user?.role ? [user.role] : [];
    const additional = Array.isArray(user?.additional_roles)
      ? user.additional_roles
      : typeof user?.additional_roles === "string"
      ? [user.additional_roles]
      : [];
    return [...primary, ...additional].filter(Boolean);
  }, [user]);

  const isSupervisor = userRoles.includes("exam_supervisor");
  const isAdmin = userRoles.some((r) =>
    ["super_admin", "admin", "branch_manager", "admin_senior_executive"].includes(r)
  );

  const [photos, setPhotos] = useState<DutyPhotoRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Image preview modal
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    photoUrl: string;
    title: string;
    type: "start" | "end";
    submittedAt?: string | null;
    deadline?: string | null;
    lateMinutes?: number;
    supervisorName?: string;
  } | null>(null);

  // Fetch duty photos from GET /api/v1/exams/{exam_id}/supervisor-duty/photo/
  const fetchDutyPhotos = () => {
    if (!exam?.id) return;
    setLoading(true);
    setRefreshing(true);
    dispatch({
      type: examActions.GET_DUTY_PHOTOS,
      method: "GET",
      endPoint: API.EXAMS.SUPERVISOR_DUTY_PHOTO(exam.id),
      auth: true,
      setLoading: (v: boolean) => {
        setLoading(v);
        setRefreshing(v);
      },
      getResponse: (res: any) => {
        const raw = res?.data ?? res;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
          ? raw.results
          : Array.isArray(raw?.photos)
          ? raw.photos
          : raw && typeof raw === "object"
          ? [raw]
          : [];
        setPhotos(list);
      },
      getError: () => {
        setLoading(false);
        setRefreshing(false);
      },
    } as any);
  };

  useEffect(() => {
    fetchDutyPhotos();
  }, [exam?.id]);

  // Refresh exam details
  const handleRefreshExam = () => {
    if (!exam?.id) return;
    setRefreshing(true);
    dispatch({
      type: examActions.GET_EXAMS,
      method: "GET",
      endPoint: API.EXAMS.DETAIL(exam.id),
      auth: true,
      getResponse: (res: any) => {
        setRefreshing(false);
        const data = res?.data || res;
        if (data && data.id) {
          dispatch(setSelectedExam(data));
          toast.success("Exam details refreshed.");
        }
      },
      getError: () => {
        setRefreshing(false);
      },
    } as any);
  };

  // Extract assigned supervisor from exam
  const assignedSupervisorsList = useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(exam?.supervisors)) {
      list.push(...exam.supervisors);
    } else if (exam?.supervisor) {
      list.push(
        typeof exam.supervisor === "object"
          ? exam.supervisor
          : { id: exam.supervisor, name: "Supervisor" }
      );
    }
    return list;
  }, [exam]);

  // Grouped supervisors data (combining assigned supervisors and photos response)
  const groupedSupervisors = useMemo<SupervisorDutySummary[]>(() => {
    const map = new Map<string, SupervisorDutySummary>();

    // 1. Initialize assigned supervisor from exam
    assignedSupervisorsList.forEach((sup: any) => {
      const u = sup?.user || {};
      const supId = String(
        sup?.id || sup?.user_id || u?.id || sup?.pk || Math.random()
      );
      const supName =
        sup?.name || sup?.full_name || sup?.username || u?.name || u?.full_name || "Supervisor";
      const supEmail = sup?.email || u?.email || "";
      const supPhone = sup?.phone || sup?.mobile || u?.phone || "";

      const isCurrent =
        (user?.id && String(user.id).toLowerCase() === supId.toLowerCase()) ||
        (user?.email && supEmail && user.email.toLowerCase() === supEmail.toLowerCase()) ||
        (user?.name && supName && user.name.toLowerCase() === supName.toLowerCase());

      map.set(supId.toLowerCase(), {
        supervisorId: supId,
        supervisorName: supName,
        supervisorEmail: supEmail,
        supervisorPhone: supPhone,
        isCurrentUser: Boolean(isCurrent),
        startSubmitted: false,
        endSubmitted: false,
        startPhotoUrl: null,
        startSubmittedAt: null,
        startLateMinutes: 0,
        startDeadline: null,
        endPhotoUrl: null,
        endSubmittedAt: null,
      });
    });

    // 2. Map photo records from GET /api/v1/exams/{exam_id}/supervisor-duty/photo/
    photos.forEach((item: any) => {
      if (!item) return;
      const sObj = item.supervisor || item.user || {};
      const sId = String(
        item.supervisor_id ||
          item.user_id ||
          sObj?.id ||
          sObj?.user_id ||
          item.created_by ||
          ""
      );
      const sName =
        item.supervisor_name ||
        sObj?.name ||
        sObj?.full_name ||
        item.created_by_name ||
        "";
      const sEmail = item.supervisor_email || sObj?.email || "";

      let record = sId ? map.get(sId.toLowerCase()) : undefined;

      if (!record) {
        for (const [, val] of map.entries()) {
          const idMatch = sId && val.supervisorId && sId.toLowerCase() === val.supervisorId.toLowerCase();
          const emailMatch =
            sEmail && val.supervisorEmail && sEmail.toLowerCase() === val.supervisorEmail.toLowerCase();
          const nameMatch =
            sName && val.supervisorName && sName.toLowerCase() === val.supervisorName.toLowerCase();
          if (idMatch || emailMatch || nameMatch) {
            record = val;
            break;
          }
        }
      }

      if (!record) {
        const isCurrent =
          (user?.id && sId && String(user.id).toLowerCase() === sId.toLowerCase()) ||
          (user?.email && sEmail && user.email.toLowerCase() === sEmail.toLowerCase()) ||
          (user?.name && sName && user.name.toLowerCase() === sName.toLowerCase());

        record = {
          supervisorId: sId || String(Math.random()),
          supervisorName: sName || "Supervisor",
          supervisorEmail: sEmail,
          isCurrentUser: Boolean(isCurrent),
          startSubmitted: false,
          endSubmitted: false,
          startPhotoUrl: null,
          startSubmittedAt: null,
          startLateMinutes: 0,
          startDeadline: null,
          endPhotoUrl: null,
          endSubmittedAt: null,
        };
        map.set((sId || record.supervisorId).toLowerCase(), record);
      }

      if (sId && (!record.supervisorId || record.supervisorId === "unknown")) record.supervisorId = sId;
      if (sName && (!record.supervisorName || record.supervisorName === "Supervisor")) record.supervisorName = sName;
      if (sEmail && !record.supervisorEmail) record.supervisorEmail = sEmail;

      const pUrl = item.photo || item.photo_url || item.image || item.file || null;

      // Extract Start Photo
      const hasStart =
        Boolean(item.is_start_submitted) ||
        Boolean(item.start_submitted) ||
        Boolean(item.start_photo_url) ||
        Boolean(item.start_photo) ||
        item.type === "start" ||
        item.photo_type === "start";

      if (hasStart) {
        record.startSubmitted = true;
        record.startPhotoUrl =
          item.start_photo_url ||
          item.start_photo ||
          (item.type === "start" ? pUrl : record.startPhotoUrl);
        record.startSubmittedAt =
          item.start_submitted_at ||
          (item.type === "start" ? item.submitted_at : null) ||
          item.created_at ||
          record.startSubmittedAt;
        record.startDeadline = item.deadline || item.start_deadline || record.startDeadline;
        record.startLateMinutes = Number(
          item.late_minutes ?? item.start_late_minutes ?? record.startLateMinutes ?? 0
        );
      }

      // Extract End Photo
      const hasEnd =
        Boolean(item.is_end_submitted) ||
        Boolean(item.end_submitted) ||
        Boolean(item.end_photo_url) ||
        Boolean(item.end_photo) ||
        item.type === "end" ||
        item.photo_type === "end";

      if (hasEnd) {
        record.endSubmitted = true;
        record.endPhotoUrl =
          item.end_photo_url ||
          item.end_photo ||
          (item.type === "end" ? pUrl : record.endPhotoUrl);
        record.endSubmittedAt =
          item.end_submitted_at ||
          (item.type === "end" ? item.submitted_at : null) ||
          record.endSubmittedAt;
      }

      if (item.late_minutes != null) {
        record.startLateMinutes = Number(item.late_minutes);
      }
      if (item.payable_hours != null) {
        record.payableHours = Number(item.payable_hours);
      }
    });

    return Array.from(map.values());
  }, [assignedSupervisorsList, photos, user]);

  // For non-admin supervisors, filter to their own record if matched
  const visibleSupervisors = useMemo(() => {
    let list = groupedSupervisors;
    if (!isAdmin && isSupervisor) {
      const myItems = list.filter((s) => s.isCurrentUser);
      if (myItems.length > 0) {
        list = myItems;
      }
    }
    return list;
  }, [groupedSupervisors, isAdmin, isSupervisor]);

  // Summary counts
  const summary = useMemo(() => {
    const total = groupedSupervisors.length;
    const startCount = groupedSupervisors.filter(
      (s) => Boolean(s.startSubmitted || s.startPhotoUrl)
    ).length;
     const endCount = groupedSupervisors.filter(
      (s) => Boolean(s.endSubmitted || s.endPhotoUrl)
    ).length;
    const completedCount = groupedSupervisors.filter(
      (s) =>
        Boolean(s.startSubmitted || s.startPhotoUrl) &&
        Boolean(s.endSubmitted || s.endPhotoUrl)
    ).length;
    const lateList = groupedSupervisors.filter(
      (s) => (s.startLateMinutes ?? 0) > 0
    );
    const lateCount = lateList.length;
    const maxLateMinutes = lateList.reduce(
      (max, s) => Math.max(max, s.startLateMinutes ?? 0),
      0
    );

    return { total, startCount, endCount, completedCount, lateCount, maxLateMinutes };
  }, [groupedSupervisors]);

  return (
    <div className="space-y-6">
      {/* ── Header Card ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-600" />
              Supervisor Duty Photos
            </h2>
            <Badge variant="outline" className="text-xs font-mono bg-background">
              {exam.title}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View pre-exam (start) and post-exam (end) supervisor verification photos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDutyPhotos();
              handleRefreshExam();
            }}
            disabled={refreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Content Area: Proper Skeleton or Loaded View ────── */}
      {loading ? (
        <SupervisorDutySkeleton />
      ) : visibleSupervisors.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border text-center space-y-3 bg-muted/10">
          <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No supervisor assigned to this exam</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No supervisor or duty photo records are currently associated with this exam.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Summary Metrics Bar (Visible to Super Admin & Admins) ── */}
          {isAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Start Photo
                </div>
                <div className="text-lg sm:text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                  {summary.startCount > 0 ? "Submitted" : "Pending"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  End Photo
                </div>
                <div className="text-lg sm:text-xl font-bold mt-1 text-blue-700 dark:text-blue-400">
                  {summary.endCount > 0 ? "Submitted" : "Pending"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Compliance
                </div>
                <div className="text-lg sm:text-xl font-bold mt-1 text-amber-700 dark:text-amber-400">
                  {summary.lateCount > 0 ? `${summary.maxLateMinutes}m Late` : summary.startCount > 0 ? "On Time" : "Pending"}
                </div>
              </div>
            </div>
          )}

          {/* ── Supervisor Duty Cards (1 Supervisor per Exam) ─────── */}
          <div className="space-y-4">
            {visibleSupervisors.map((sup) => {
              const hasStart = Boolean(sup.startSubmitted || sup.startPhotoUrl);
              const hasEnd = Boolean(sup.endSubmitted || sup.endPhotoUrl);
              const isCompleted = hasStart && hasEnd;
              const isInProgress = hasStart && !hasEnd;
              const isLate = Boolean(sup.startLateMinutes && sup.startLateMinutes > 0);
              const lateMins = sup.startLateMinutes ?? 0;

              return (
                <div
                  key={sup.supervisorId}
                  className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-sm space-y-5"
                >
                  {/* Supervisor Profile Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
                        {sup.supervisorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-foreground">
                            {sup.supervisorName}
                          </h3>
                          {sup.isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              You
                            </Badge>
                          )}
                          {sup.payableHours != null && (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground font-mono bg-muted/30">
                              {sup.payableHours} hrs payable
                            </Badge>
                          )}
                        </div>
                        {sup.supervisorEmail && (
                          <p className="text-xs text-muted-foreground mt-0.5">{sup.supervisorEmail}</p>
                        )}
                      </div>
                    </div>

                    {/* Overall Duty Status Badge */}
                    <div>
                      {isCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-1 gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Duty Completed
                        </Badge>
                      ) : isInProgress ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 text-xs px-2.5 py-1 gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> In Progress (Start Submitted)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs px-2.5 py-1">
                          Pending Start Photo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Photos View: Pre-Exam (Start) and Post-Exam (End) Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Pre-Exam (Start) Photo Box */}
                    <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-amber-600" />
                            Pre-Exam Photo (Start)
                          </h4>
                          {hasStart ? (
                            isLate ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] px-2 py-0.5 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {lateMins}m Late
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] px-2 py-0.5 gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                On Time
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </div>

                        {sup.startPhotoUrl ? (
                          <div
                            className="relative group rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-black/30 h-80 sm:h-96 md:h-[420px] flex items-center justify-center cursor-pointer shadow-xs"
                            onClick={() => {
                              setPreviewModal({
                                open: true,
                                photoUrl: getPhotoUrl(sup.startPhotoUrl),
                                title: `Pre-Exam (Start) Photo — ${sup.supervisorName}`,
                                type: "start",
                                submittedAt: sup.startSubmittedAt,
                                deadline: sup.startDeadline,
                                lateMinutes: sup.startLateMinutes,
                                supervisorName: sup.supervisorName,
                              });
                            }}
                          >
                            <DutyPhotoImage
                              src={sup.startPhotoUrl}
                              alt="Pre-Exam (Start) Duty Photo"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              onImageClick={(workingSrc) => {
                                setPreviewModal({
                                  open: true,
                                  photoUrl: workingSrc,
                                  title: `Pre-Exam (Start) Photo — ${sup.supervisorName}`,
                                  type: "start",
                                  submittedAt: sup.startSubmittedAt,
                                  deadline: sup.startDeadline,
                                  lateMinutes: sup.startLateMinutes,
                                  supervisorName: sup.supervisorName,
                                });
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 pointer-events-none">
                              <Eye className="w-4 h-4" /> Click to view full image
                            </div>
                          </div>
                        ) : (
                          <div className="h-80 sm:h-96 md:h-[420px] rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground/60 text-xs bg-background/50 gap-2 p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/50">
                              <Camera className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-foreground/80 text-sm">Start Photo Not Uploaded Yet</span>
                            <span className="text-xs text-muted-foreground max-w-xs">
                              The supervisor has not uploaded the pre-exam verification photo yet.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground pt-2.5 border-t border-border/50 flex items-center justify-between">
                        <span>Submitted At:</span>
                        <span className="font-medium text-foreground">
                          {sup.startSubmittedAt ? formatDateTime(sup.startSubmittedAt) : "Awaiting upload"}
                        </span>
                      </div>
                    </div>

                    {/* Post-Exam (End) Photo Box */}
                    <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Post-Exam Photo (End)
                          </h4>
                          {hasEnd ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] px-2 py-0.5 gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </div>

                        {sup.endPhotoUrl ? (
                          <div
                            className="relative group rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-black/30 h-80 sm:h-96 md:h-[420px] flex items-center justify-center cursor-pointer shadow-xs"
                            onClick={() => {
                              setPreviewModal({
                                open: true,
                                photoUrl: getPhotoUrl(sup.endPhotoUrl),
                                title: `Post-Exam (End) Photo — ${sup.supervisorName}`,
                                type: "end",
                                submittedAt: sup.endSubmittedAt,
                                deadline: null,
                                lateMinutes: 0,
                                supervisorName: sup.supervisorName,
                              });
                            }}
                          >
                            <DutyPhotoImage
                              src={sup.endPhotoUrl}
                              alt="Post-Exam (End) Duty Photo"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              onImageClick={(workingSrc) => {
                                setPreviewModal({
                                  open: true,
                                  photoUrl: workingSrc,
                                  title: `Post-Exam (End) Photo — ${sup.supervisorName}`,
                                  type: "end",
                                  submittedAt: sup.endSubmittedAt,
                                  deadline: null,
                                  lateMinutes: 0,
                                  supervisorName: sup.supervisorName,
                                });
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 pointer-events-none">
                              <Eye className="w-4 h-4" /> Click to view full image
                            </div>
                          </div>
                        ) : (
                          <div className="h-80 sm:h-96 md:h-[420px] rounded-lg border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground/60 text-xs bg-background/50 gap-2 p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/50">
                              <Camera className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-foreground/80 text-sm">End Photo Not Uploaded Yet</span>
                            <span className="text-xs text-muted-foreground max-w-xs">
                              Post-exam verification photo will appear here once submitted after exam conclusion.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground pt-2.5 border-t border-border/50 flex items-center justify-between">
                        <span>Submitted At:</span>
                        <span className="font-medium text-foreground">
                          {sup.endSubmittedAt ? formatDateTime(sup.endSubmittedAt) : "Awaiting conclusion"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Fullscreen Image Preview Dialog ────────────────────────── */}
      <Dialog
        open={Boolean(previewModal?.open)}
        onOpenChange={(o) => {
          if (!o) setPreviewModal(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600" />
              {previewModal?.title || "Duty Photo Preview"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Supervisor duty verification photo record for {exam.title}
            </DialogDescription>
          </DialogHeader>

          {previewModal && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl overflow-hidden border border-border bg-black/5 flex items-center justify-center max-h-[55vh]">
                <DutyPhotoImage
                  src={previewModal.photoUrl}
                  alt={previewModal.title}
                  className="max-h-[55vh] w-auto max-w-full object-contain"
                />
              </div>

              {/* Photo Details Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60 text-xs">
                <div>
                  <div className="text-[11px] text-muted-foreground">Photo Type</div>
                  <div className="font-semibold capitalize text-foreground">
                    {previewModal.type === "start" ? "Pre-Exam (Start)" : "Post-Exam (End)"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Supervisor</div>
                  <div className="font-semibold text-foreground truncate">
                    {previewModal.supervisorName || "Supervisor"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Submitted At</div>
                  <div className="font-medium text-foreground">
                    {formatDateTime(previewModal.submittedAt)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Compliance</div>
                  <div>
                    {previewModal.type === "start" ? (
                      previewModal.lateMinutes && previewModal.lateMinutes > 0 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                          {previewModal.lateMinutes} mins late
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                          On Time
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                        Submitted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            {previewModal?.photoUrl && (
              <a
                href={previewModal.photoUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center text-xs text-primary hover:underline gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download original photo
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModal(null)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
