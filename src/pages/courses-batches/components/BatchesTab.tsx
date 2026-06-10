import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, Clock, MapPin, Pencil, Trash2, Search, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  course: string; // UUID
  course_name?: string;
  batch_code: string;
  group_module: "full" | "both" | "module_1" | "module_2";
  batch_attempt: "june" | "oct" | "dec" | "feb";
  location: string;
  start_date: string;
  end_date: string;
  max_students: number;
  timing: string;
  is_active: boolean;
}

interface BatchesTabProps {
  batches: Batch[];
  loading: boolean;
  error: string | null;
  courses: Course[];
  canEdit: boolean;
  openEditBatchModal: (b: Batch) => void;
  openDeleteBatchConfirm: (b: Batch) => void;
  onViewTimetable: (batchName: string) => void;
  onViewBatchDetails: (id: string) => void;
  onRetry: () => void;
}

export default function BatchesTab({
  batches,
  loading,
  error,
  courses,
  canEdit,
  openEditBatchModal,
  openDeleteBatchConfirm,
  onViewTimetable,
  onViewBatchDetails,
  onRetry,
}: BatchesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const courseMap = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [courses]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const courseName = b.course_name || courseMap.get(b.course) || "";
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.batch_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.is_active) ||
        (statusFilter === "inactive" && !b.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter, courseMap]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full col-span-2" />
                  <div className="col-span-2 pt-1 border-t border-border/50 flex justify-between">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-between gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search batches, codes, courses, or rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-muted/20">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((b) => {
            const courseName = b.course_name || courseMap.get(b.course) || "Unknown Course";
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                onClick={() => onViewBatchDetails(b.id)}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors">
                        {b.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{courseName}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                        b.is_active
                          ? "bg-green-500/10 text-green-600"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Code: {b.batch_code}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{b.max_students} Max Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate capitalize">{b.batch_attempt} Attempt</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{b.location || "N/A"}</span>
                    </div>
                    {/* <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Timing: {b.timing}</span>
                    </div> */}
                    <div className="col-span-2 pt-1 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                      <span>Start: {b.start_date}</span>
                      <span>End: {b.end_date}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-primary hover:text-primary-dark p-0 h-auto cursor-pointer relative z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTimetable(b.name);
                    }}
                  >
                    View Timetable
                  </Button>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer relative z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditBatchModal(b);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer relative z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteBatchConfirm(b);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-semibold text-lg text-text-primary">No Batches Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            No batches match your query or filters. Click "Add Batch" to register a new student
            batch.
          </p>
        </div>
      )}
    </div>
  );
}
