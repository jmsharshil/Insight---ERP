import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, DollarSign, Search, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  code: string;
  course_type: string;
  duration_months: number;
  fee_amount: number | string;
  is_active: boolean;
  description?: string;
}

interface CoursesTabProps {
  courses: Course[];
  loading: boolean;
  error: string | null;
  onCourseClick: (courseId: string) => void;
  onRetry: () => void;
}

export default function CoursesTab({
  courses,
  loading,
  error,
  onCourseClick,
  onRetry,
}: CoursesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const name = c.name || "";
      const code = c.code || "";
      const desc = c.description || "";
      const query = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query)
      );
    });
  }, [courses, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex bg-card p-4 rounded-xl border border-border">
          <Skeleton className="h-10 w-full rounded-md" />
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
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full col-span-2" />
                </div>
              </div>
              <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-between">
                <Skeleton className="h-4 w-1/3" />
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
      {/* Search Bar */}
      <div className="flex bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onCourseClick(c.id)}
              className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors">
                      {c.name}
                    </h4>
                    {/* <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      Type: {c.course_type.replace("_", " ")}
                    </p> */}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                      c.is_active
                        ? "bg-green-500/10 text-green-600"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Code: {c.code}</span>
                  </div>
                  {/* <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{c.duration_months} Months</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                    <DollarSign className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate font-medium text-text-primary">
                      Fee: ₹{Number(c.fee_amount).toLocaleString()}
                    </span>
                  </div> */}
                </div>
              </div>

              <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-primary group-hover:underline flex items-center gap-0.5">
                  View Syllabus Details
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-semibold text-lg text-text-primary">No Courses Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            No courses match your query. Click "Add Course" to create a new program.
          </p>
        </div>
      )}
    </div>
  );
}
