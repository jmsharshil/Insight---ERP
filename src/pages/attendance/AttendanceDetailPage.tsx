import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { normalizeRecord } from "@/redux/slices/attendanceSlice";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  User,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ATT_STATUS_META, type AttendanceRecord } from "@/constants/dummy/attendance";
import { cn } from "@/lib/utils";

/* ─── Detail Skeleton Loading State ─────────────────── */
function DetailSkeleton() {
  return (
    <div className="mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Skeleton width={36} height={36} borderRadius={8} />
        <Skeleton width={180} height={28} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <Skeleton circle width={96} height={96} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width={220} height={32} />
            <Skeleton width={60} height={22} borderRadius={12} />
          </div>
          <Skeleton width={320} height={16} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Skeleton width={160} height={20} />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton width="35%" height={14} />
                  <Skeleton width="55%" height={14} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Info Row Helper ───────────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  if (!value || value === "—") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-2/5 flex-shrink-0">
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="text-sm text-muted-foreground/50 sm:w-3/5">—</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-2/5 flex-shrink-0">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={cn("text-sm font-medium sm:w-3/5 break-words text-text-primary", mono && "font-mono text-xs")}>
        {value}
      </div>
    </div>
  );
}

/* ─── Section Card Helper ───────────────────────────── */
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-muted/30 border-b border-border/50">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="font-heading text-sm font-semibold text-card-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AttendanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { setPageTitle } = useUI();

  // Try to find the record in Redux first for instant load
  const storeRecords = useSelector((state: RootState) => state.attendance.records);
  const matchedRecord = storeRecords.find((r) => r.id === id);

  const [record, setRecord] = useState<AttendanceRecord | null>(matchedRecord || null);
  const [loading, setLoading] = useState(!matchedRecord);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle("Attendance Details");
  }, [setPageTitle]);

  useEffect(() => {
    if (!id) return;

    // Trigger request using generic saga structure
    dispatch({
      type: "GET_ATTENDANCE_DETAIL",
      method: "GET",
      endPoint: API.ATTENDANCE.LIST({ id, attendance_id: id }),
      auth: true,
      setLoading: (val: boolean) => {
        if (!matchedRecord) {
          setLoading(val);
        }
      },
      getResponse: (res: any) => {
        const dataList = res?.data || (Array.isArray(res) ? res : []);
        if (dataList && dataList.length > 0) {
          const norm = normalizeRecord(dataList[0]);
          setRecord(norm);
          setError(null);
        } else {
          if (!matchedRecord) {
            setError("No attendance record found.");
          }
        }
        setLoading(false);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to load details";
        if (!matchedRecord) {
          setError(msg);
        }
        console.error("Failed to load attendance detail:", err);
      },
    });
  }, [id, dispatch, matchedRecord]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4 animate-bounce" />
        <p className="text-lg font-medium text-red-600 mb-2">Failed to load attendance</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No attendance details found.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const meta = ATT_STATUS_META[record.status] || {
    label: "Unknown",
    bg: "bg-gray-100",
    color: "text-gray-700",
  };

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* ── Back Navigation ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Attendance Details</h1>
      </div>

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xl font-bold border border-primary/20">
              {record.studentName
                ? record.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                : "—"}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-heading font-bold text-text-primary">
                  {record.studentName}
                </h2>
                <Badge
                  className={cn(
                    "border font-semibold px-2.5 py-0.5 rounded text-xs tracking-wide shadow-sm",
                    meta.bg,
                    meta.color,
                  )}
                >
                  {record.statusDisplay || meta.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
                {record.rollNumber && (
                  <>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      Roll: {record.rollNumber}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{record.batch}</span>
                {record.sessionDisplay && (
                  <>
                    <span>•</span>
                    <span>{record.sessionDisplay} Session</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-start md:items-end gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Date
            </span>
            <span className="text-lg font-bold text-text-primary">{record.date}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Details Grid ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Scan & Check-In Details" icon={<Clock className="w-4 h-4" />}>
          <InfoRow
            icon={<Clock className="w-4 h-4 text-emerald-500" />}
            label="Check-In Time"
            value={record.checkIn || "Not Checked In"}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4 text-emerald-500/70" />}
            label="Checked In At"
            value={record.checkedInAt || "—"}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4 text-red-500" />}
            label="Check-Out Time"
            value={record.checkOut || "Not Checked Out"}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4 text-red-500/70" />}
            label="Checked Out At"
            value={record.checkedOutAt || "—"}
          />
          <InfoRow
            icon={<Shield className="w-4 h-4 text-blue-500" />}
            label="Marking Method"
            value={record.scanType ? record.scanType.toUpperCase() : "QR"}
          />
          {record.deviceId && (
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Gate / Device ID"
              value={record.deviceId}
            />
          )}
          {record.violation && (
            <InfoRow
              icon={<AlertCircle className="w-4 h-4 text-red-500" />}
              label="Violation Status"
              value={
                <span className="text-red-600 font-semibold uppercase tracking-wide">
                  {record.violation?.replace(/_/g, " ")}
                </span>
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Marking & Metadata" icon={<UserCheck className="w-4 h-4" />}>
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Marked By"
            value={record.markedByName || "System Auto"}
          />
          {record.markedBy && (
            <InfoRow
              icon={<Shield className="w-4 h-4 text-muted-foreground/60" />}
              label="Marked By ID"
              value={record.markedBy}
              mono
            />
          )}
          {record.markedAt && (
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Marked At"
              value={record.markedAt}
            />
          )}
          {record.batchId && (
            <InfoRow
              icon={<Building2 className="w-4 h-4 text-muted-foreground/60" />}
              label="Batch ID"
              value={record.batchName}
              mono
            />
          )}
          {record.branchId && (
            <InfoRow
              icon={<Building2 className="w-4 h-4 text-muted-foreground/60" />}
              label="Branch ID"
              value={record.branchName}
              mono
            />
          )}
        </SectionCard>
      </div>

      {/* ── Correction / Override Section ── */}
      {/* {record.isCorrected && ( */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-amber-800 font-bold">
          <CheckCircle2 className="w-5 h-5 text-amber-600" />
          <h3 className="font-heading uppercase tracking-wide text-sm">
            Attendance Correction Details
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-amber-700 font-medium block">Corrected By</span>
            <span className="text-sm font-semibold text-text-primary">
              {record.correctedByName || "-"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-amber-700 font-medium block">
              Correction Reason / Note
            </span>
            <p className="text-sm font-medium text-text-primary bg-background border border-border/40 rounded-lg p-2.5 shadow-inner">
              {record.correctionNote || "-"}
            </p>
          </div>
        </div>
      </motion.div>
      {/* )} */}
    </div>
  );
}
