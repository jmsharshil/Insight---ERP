import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { dropdownActions, examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  ChevronRight, 
  GraduationCap, 
  Loader2, 
  FileText, 
  Layers, 
  Info,
  Search,
  Eye,
  Calendar,
  Award
} from "lucide-react";
import ResultsTab from "@/pages/exams/tabs/ResultsTab";
import type { Exam } from "@/redux/slices/examSlice";

interface ExamStats {
  total_students: number;
  appeared_students?: number;
  passed_students: number;
  pass_percentage: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  results_count: number;
  percentage_comparison?: {
    present_percentage?: number;
    highest_marks_percentage?: number;
    lowest_marks_percentage?: number;
    average_marks_percentage?: number;
    pass_40_plus_percentage?: number;
    aggregate_50_plus_percentage?: number;
    exempt_60_plus_percentage?: number;
  };
}

const computeExamStats = (exam: any, resultsList?: any[]): ExamStats => {
  const results = resultsList !== undefined ? resultsList : (Array.isArray(exam.results) ? exam.results : null);

  if (results && results.length > 0) {
    const total = results.length;
    const passed = results.filter((r: any) => {
      if (r.is_pass === true || r.is_pass === "true" || r.status === "pass") return true;
      if (r.is_pass === false || r.is_pass === "false" || r.status === "fail") return false;
      if (r.percentage != null) return Number(r.percentage) >= 40;
      if (exam.pass_marks != null && r.marks_obtained != null) {
        return Number(r.marks_obtained) >= Number(exam.pass_marks);
      }
      return false;
    }).length;

    const validScores = results
      .map((r: any) => (r.marks_obtained != null ? Number(r.marks_obtained) : null))
      .filter((m): m is number => m !== null && !isNaN(m));

    const sum = validScores.reduce((acc, v) => acc + v, 0);
    const avg = validScores.length > 0 ? sum / validScores.length : 0;
    const highest = validScores.length > 0 ? Math.max(...validScores) : 0;
    const lowest = validScores.length > 0 ? Math.min(...validScores) : 0;

    const totalMarks = Number(exam.total_marks || 100);
    const pass40Count = results.filter((r: any) => {
      const pct = r.percentage != null ? Number(r.percentage) : (totalMarks > 0 && r.marks_obtained != null ? (Number(r.marks_obtained) / totalMarks) * 100 : null);
      return pct != null && pct >= 40;
    }).length;
    const agg50Count = results.filter((r: any) => {
      const pct = r.percentage != null ? Number(r.percentage) : (totalMarks > 0 && r.marks_obtained != null ? (Number(r.marks_obtained) / totalMarks) * 100 : null);
      return pct != null && pct >= 50;
    }).length;
    const exempt60Count = results.filter((r: any) => {
      const pct = r.percentage != null ? Number(r.percentage) : (totalMarks > 0 && r.marks_obtained != null ? (Number(r.marks_obtained) / totalMarks) * 100 : null);
      return pct != null && pct >= 60;
    }).length;

    const pc = exam.percentage_comparison || {
      present_percentage: 100.0,
      highest_marks_percentage: totalMarks > 0 ? (highest / totalMarks) * 100 : highest,
      lowest_marks_percentage: totalMarks > 0 ? (lowest / totalMarks) * 100 : lowest,
      average_marks_percentage: totalMarks > 0 ? (avg / totalMarks) * 100 : avg,
      pass_40_plus_percentage: total > 0 ? (pass40Count / total) * 100 : 0,
      aggregate_50_plus_percentage: total > 0 ? (agg50Count / total) * 100 : 0,
      exempt_60_plus_percentage: total > 0 ? (exempt60Count / total) * 100 : 0,
    };

    return {
      total_students: total,
      appeared_students: total,
      passed_students: passed,
      pass_percentage: total > 0 ? (passed / total) * 100 : 0,
      average_marks: avg,
      highest_marks: highest,
      lowest_marks: lowest,
      results_count: total,
      percentage_comparison: pc,
    };
  }

  // Fallback to exam properties if provided by backend API
  const total = Number(exam.total_students ?? exam.students_count ?? exam.enrolled_count ?? 0);
  const passed = Number(exam.passed_students ?? exam.passed_count ?? 0);
  const passPct = exam.pass_percentage != null 
    ? Number(exam.pass_percentage) 
    : (total > 0 ? (passed / total) * 100 : 0);
  const avg = Number(exam.average_marks ?? exam.avg_marks ?? 0);
  const highest = Number(exam.highest_marks ?? exam.max_marks ?? 0);
  const lowest = Number(exam.lowest_marks ?? exam.min_marks ?? 0);

  return {
    total_students: total,
    appeared_students: Number(exam.appeared_students ?? total),
    passed_students: passed,
    pass_percentage: passPct,
    average_marks: avg,
    highest_marks: highest,
    lowest_marks: lowest,
    results_count: total,
    percentage_comparison: exam.percentage_comparison,
  };
};

const isExamInBatch = (exam: any, batch: any): boolean => {
  if (!exam || !batch) return false;

  const targetBatchId = String(batch.batch_id ?? batch.batch ?? batch.id ?? "").trim();
  const targetBatchName = String(batch.batch_name ?? batch.name ?? "").trim().toLowerCase();
  const cleanTargetName = targetBatchName.replace(/_\d+$/, "").trim();

  const suffixIdMatch = targetBatchName.match(/_(\d+)$/);
  const extractedSuffixId = suffixIdMatch ? suffixIdMatch[1] : null;

  // 1. Direct batch ID match
  const examBatchId = String(
    typeof exam.batch === "object" && exam.batch !== null
      ? (exam.batch.id ?? exam.batch.batch_id ?? "")
      : (exam.batch_id ?? exam.batch ?? "")
  ).trim();

  if (targetBatchId && examBatchId && targetBatchId === examBatchId) return true;
  if (extractedSuffixId && examBatchId && extractedSuffixId === examBatchId) return true;

  // 2. Direct batch name match
  const examBatchName = String(
    typeof exam.batch === "object" && exam.batch !== null
      ? (exam.batch.name ?? exam.batch.batch_name ?? "")
      : (exam.batch_name ?? "")
  ).trim().toLowerCase();

  if (targetBatchName && examBatchName) {
    if (examBatchName === targetBatchName) return true;
    if (examBatchName.includes(targetBatchName) || targetBatchName.includes(examBatchName)) return true;
  }
  if (cleanTargetName && examBatchName) {
    if (examBatchName === cleanTargetName || examBatchName.includes(cleanTargetName) || cleanTargetName.includes(examBatchName)) return true;
  }

  // 3. Batches array on exam
  const batchesList = Array.isArray(exam.batches) 
    ? exam.batches 
    : Array.isArray(exam.batch) 
      ? exam.batch 
      : [];

  if (batchesList.length > 0) {
    const matched = batchesList.some((b: any) => {
      const bId = String(typeof b === "object" && b !== null ? (b.id ?? b.batch_id ?? "") : b).trim();
      const bName = String(typeof b === "object" && b !== null ? (b.name ?? b.batch_name ?? "") : "").trim().toLowerCase();
      if (targetBatchId && bId && targetBatchId === bId) return true;
      if (extractedSuffixId && bId && extractedSuffixId === bId) return true;
      if (targetBatchName && bName && (targetBatchName === bName || bName.includes(targetBatchName) || targetBatchName.includes(bName))) return true;
      if (cleanTargetName && bName && (cleanTargetName === bName || bName.includes(cleanTargetName) || cleanTargetName.includes(bName))) return true;
      return false;
    });
    if (matched) return true;
  }

  // 4. Batch match in exam title
  if (targetBatchName && exam.title) {
    const titleLower = String(exam.title).toLowerCase();
    if (titleLower.includes(targetBatchName)) return true;
    if (cleanTargetName && cleanTargetName.length > 3 && titleLower.includes(cleanTargetName)) return true;
  }

  return false;
};

export default function BatchWiseTab() {
  const { user } = useAuth();
  const isFaculty = user?.role === "faculty";

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drilldown states
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [batchExams, setBatchExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examSearch, setExamSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examStatsMap, setExamStatsMap] = useState<Record<string, { loading: boolean; stats: ExamStats; results: any[] }>>({});

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.RESULTS_ANALYTICS.BATCH_WISE,
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        setData(res?.data || res || []);
      },
      getError: (err: any) => {
        console.error("Failed to fetch batch-wise results", err);
      }
    } as any);
  }, [dispatch]);

  // Fetch and filter exams when a batch is clicked
  useEffect(() => {
    if (!selectedBatch) {
      setBatchExams([]);
      setSelectedExam(null);
      setExamStatsMap({});
      setExamSearch("");
      return;
    }

    setExamsLoading(true);
    setSelectedExam(null);
    setExamSearch("");
    const targetBatchId = selectedBatch.batch_id || selectedBatch.batch || selectedBatch.id;
    const queryParam = targetBatchId ? `?batch_id=${encodeURIComponent(targetBatchId)}` : "";

    dispatch({
      type: examActions.GET_EXAMS,
      method: "GET",
      endPoint: `${API.EXAMS.LIST}${queryParam}`,
      auth: true,
      setLoading: (v: boolean) => setExamsLoading(v),
      getResponse: (res: any) => {
        const raw = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data?.results)
                ? res.data.results
                : Array.isArray(res?.results)
                  ? res.results
                  : [];
        let matched = raw.filter((e: any) => isExamInBatch(e, selectedBatch));

        if (matched.length === 0 && queryParam) {
          // Fallback: fetch without query param and filter client-side
          dispatch({
            type: examActions.GET_EXAMS,
            method: "GET",
            endPoint: API.EXAMS.LIST,
            auth: true,
            setLoading: (v: boolean) => setExamsLoading(v),
            getResponse: (res2: any) => {
              const raw2 = Array.isArray(res2)
                ? res2
                : Array.isArray(res2?.data)
                  ? res2.data
                  : Array.isArray(res2?.data?.data)
                    ? res2.data.data
                    : Array.isArray(res2?.data?.results)
                      ? res2.data.results
                      : Array.isArray(res2?.results)
                        ? res2.results
                        : [];
              const matched2 = raw2.filter((e: any) => isExamInBatch(e, selectedBatch));
              setBatchExams(matched2);
              setExamsLoading(false);
            },
            getError: (err: any) => {
              console.error("Failed to fetch all exams fallback", err);
              setBatchExams([]);
              setExamsLoading(false);
            }
          } as any);
          return;
        }

        setBatchExams(matched);
        setExamsLoading(false);
      },
      getError: (err: any) => {
        console.error("Failed to fetch exams for batch", err);
        // Fallback: fetch all exams without query param
        dispatch({
          type: examActions.GET_EXAMS,
          method: "GET",
          endPoint: API.EXAMS.LIST,
          auth: true,
          setLoading: (v: boolean) => setExamsLoading(v),
          getResponse: (res2: any) => {
            const raw2 = Array.isArray(res2)
              ? res2
              : Array.isArray(res2?.data)
                ? res2.data
                : Array.isArray(res2?.data?.data)
                  ? res2.data.data
                  : Array.isArray(res2?.data?.results)
                    ? res2.data.results
                    : Array.isArray(res2?.results)
                      ? res2.results
                      : [];
            const matched2 = raw2.filter((e: any) => isExamInBatch(e, selectedBatch));
            setBatchExams(matched2);
            setExamsLoading(false);
          },
          getError: () => {
            setBatchExams([]);
            setExamsLoading(false);
          }
        } as any);
      }
    } as any);
  }, [selectedBatch, dispatch]);

  // When batchExams changes, fetch results for each exam to compute full exam-wise stats
  useEffect(() => {
    if (batchExams.length === 0) {
      setExamStatsMap({});
      return;
    }

    const initialMap: Record<string, { loading: boolean; stats: ExamStats; results: any[] }> = {};
    batchExams.forEach(exam => {
      initialMap[exam.id] = {
        loading: true,
        stats: computeExamStats(exam),
        results: Array.isArray(exam.results) ? exam.results : [],
      };
    });
    setExamStatsMap(initialMap);

    // Concurrently fetch results for each exam
    batchExams.forEach(exam => {
      if (Array.isArray(exam.results) && exam.results.length > 0) {
        setExamStatsMap(prev => ({
          ...prev,
          [exam.id]: {
            loading: false,
            stats: computeExamStats(exam, exam.results),
            results: exam.results,
          }
        }));
        return;
      }

      dispatch({
        type: examActions.GET_RESULTS,
        method: "GET",
        endPoint: API.EXAMS.RESULTS(exam.id),
        auth: true,
        getResponse: (res: any) => {
          const rawResults = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res?.data?.data)
                ? res.data.data
                : Array.isArray(res?.results)
                  ? res.results
                  : (res?.data || []);
          
          const stats = computeExamStats(exam, rawResults);
          setExamStatsMap(prev => ({
            ...prev,
            [exam.id]: {
              loading: false,
              stats,
              results: rawResults,
            }
          }));
        },
        getError: () => {
          setExamStatsMap(prev => ({
            ...prev,
            [exam.id]: {
              loading: false,
              stats: computeExamStats(exam, []),
              results: [],
            }
          }));
        }
      } as any);
    });
  }, [batchExams, dispatch]);

  // Filtered exams by search term
  const filteredExams = useMemo(() => {
    if (!examSearch.trim()) return batchExams;
    const q = examSearch.toLowerCase().trim();
    return batchExams.filter((e) => {
      const title = String(e.title || "").toLowerCase();
      const subject = String(e.subject_name || "").toLowerCase();
      const mode = String(e.exam_mode || "").toLowerCase();
      const type = String(e.exam_type || "").toLowerCase();
      return title.includes(q) || subject.includes(q) || mode.includes(q) || type.includes(q);
    });
  }, [batchExams, examSearch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // LEVEL 3: Single Exam Results (Student-Level Marksheet)
  // ══════════════════════════════════════════════════════════════
  if (selectedBatch && selectedExam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Top Navigation & Info Header */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedExam(null)}
              className="gap-1.5 h-9 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Exam-Wise Results</span>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-base sm:text-lg font-bold font-heading text-foreground">
                  {selectedExam.title}
                </h2>
                {selectedExam.subject_name && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedExam.subject_name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Batch: <strong className="text-foreground">{selectedBatch.batch_name}</strong> · Total Marks: {selectedExam.total_marks || "—"} · Passing: {selectedExam.pass_marks || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize bg-muted/30">
              Mode: {selectedExam.exam_mode || "online"}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize bg-muted/30">
              Type: {selectedExam.exam_type || "mcq"}
            </Badge>
          </div>
        </div>

        {/* Individual Student Results Tab */}
        <ResultsTab exam={selectedExam} />
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // LEVEL 2: Exam-Wise Results Table for Selected Batch
  // ══════════════════════════════════════════════════════════════
  if (selectedBatch) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBatch(null);
                setBatchExams([]);
              }}
              className="gap-1.5 h-9 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Batches</span>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-base sm:text-lg font-bold font-heading text-foreground">
                  {selectedBatch.batch_name || selectedBatch.name || "Batch Results"}
                </h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                  Exam-Wise Results
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exams and performance metrics conducted for this batch
              </p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border flex items-center gap-1.5">
              <span className="text-muted-foreground">Students:</span>
              <span className="font-bold">{selectedBatch.total_students || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-1.5">
              <span className="text-green-700">Passed:</span>
              <span className="font-bold">{selectedBatch.passed_students || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1.5">
              <span className="text-blue-700">Pass %:</span>
              <span className="font-bold">{selectedBatch.pass_percentage ? selectedBatch.pass_percentage.toFixed(1) : 0}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5">
              <span className="text-amber-800">Avg Marks:</span>
              <span className="font-bold">{selectedBatch.average_marks ? selectedBatch.average_marks.toFixed(1) : 0}</span>
            </div>
          </div>
        </div>

        {/* Exam-Wise Content */}
        {examsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-xl border border-border shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading exams and results for {selectedBatch.batch_name}...
            </p>
          </div>
        ) : batchExams.length === 0 ? (
          <div className="text-center py-14 px-4 bg-white rounded-xl border border-border shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-heading">No Exams Found for this Batch</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              No exams are currently linked to <strong>{selectedBatch.batch_name}</strong> in the system.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedBatch(null);
                setBatchExams([]);
              }} 
              className="mt-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Batch-Wise Results
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden space-y-0">
            {/* Toolbar Header */}
            <div className="p-3 sm:p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Exam-Wise Results ({batchExams.length} {batchExams.length === 1 ? "Exam" : "Exams"})
                </span>
                {!isFaculty && (
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    · Click any exam row to inspect student marksheet
                  </span>
                )}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search exams or subjects..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Exam-Wise Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border/80">
                    <th rowSpan={2} className="px-4 py-3 font-semibold text-left align-middle border-r border-border min-w-[200px]">
                      Exam Title
                    </th>
                    <th rowSpan={2} className="px-4 py-3 font-semibold text-left align-middle border-r border-border">
                      Subject
                    </th>
                    <th rowSpan={2} className="px-4 py-3 font-semibold text-center align-middle border-r border-border">
                      Date
                    </th>
                    <th colSpan={3} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                      Students & Pass Rate
                    </th>
                    <th colSpan={3} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                      Marks
                    </th>
                    <th colSpan={7} className="px-3 py-2 font-semibold text-center bg-primary/10 text-primary border-r border-border text-[11px] tracking-wider">
                      Percentage Comparison
                    </th>
                    {!isFaculty && (
                      <th rowSpan={2} className="px-4 py-3 font-semibold text-right align-middle">
                        Action
                      </th>
                    )}
                  </tr>
                  <tr className="border-b border-border text-[11px]">
                    {/* Students */}
                    <th className="px-3 py-2 font-medium text-center">Total</th>
                    <th className="px-3 py-2 font-medium text-center">Passed</th>
                    <th className="px-3 py-2 font-medium text-center border-r border-border">Pass %</th>
                    {/* Marks */}
                    <th className="px-3 py-2 font-medium text-center">Avg</th>
                    <th className="px-3 py-2 font-medium text-center">Highest</th>
                    <th className="px-3 py-2 font-medium text-center border-r border-border">Lowest</th>
                    {/* Percentage Comparison */}
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Present Percentage">Present %</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Pass (40%+) Percentage">≥40% Pass</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Aggregate (50%+) Percentage">≥50% Agg</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Exemption (60%+) Percentage">≥60% Exempt</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Average Marks Percentage">Avg %</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Highest Marks Percentage">High %</th>
                    <th className="px-3 py-2 font-medium text-center bg-primary/5 border-r border-border" title="Lowest Marks Percentage">Low %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExams.length === 0 ? (
                    <tr>
                      <td colSpan={isFaculty ? 16 : 17} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No exams match the search filter "{examSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredExams.map((exam) => {
                      const statsData = examStatsMap[exam.id]?.stats || computeExamStats(exam);
                      const isStatsLoading = examStatsMap[exam.id]?.loading ?? false;
                      const pc = statsData.percentage_comparison || exam.percentage_comparison;

                      return (
                        <tr 
                          key={exam.id}
                          onClick={!isFaculty ? () => setSelectedExam(exam) : undefined}
                          className={
                            !isFaculty
                              ? "hover:bg-primary/5 cursor-pointer transition-colors group"
                              : "hover:bg-muted/10 cursor-default transition-colors"
                          }
                          title={!isFaculty ? "Click to view detailed student results for this exam" : undefined}
                        >
                          {/* Exam Title & Type Badges */}
                          <td className="px-4 py-3 border-r border-border/50">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {exam.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {exam.exam_mode && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                    {exam.exam_mode}
                                  </span>
                                )}
                                {exam.exam_type && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                    {exam.exam_type}
                                  </span>
                                )}
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  {exam.total_marks || 0} Marks
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Subject */}
                          <td className="px-4 py-3 text-muted-foreground font-medium border-r border-border/50">
                            {exam.subject_name || "—"}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono border-r border-border/50">
                            {exam.session_date || "—"}
                          </td>

                          {/* Total Students */}
                          <td className="px-3 py-3 text-center font-medium">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              statsData.total_students || 0
                            )}
                          </td>

                          {/* Passed */}
                          <td className="px-3 py-3 text-center">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              statsData.passed_students || 0
                            )}
                          </td>

                          {/* Pass % */}
                          <td className="px-3 py-3 text-center border-r border-border/50">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              <Badge 
                                variant="outline" 
                                className={
                                  statsData.pass_percentage >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                                  statsData.pass_percentage >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {statsData.pass_percentage ? statsData.pass_percentage.toFixed(1) : 0}%
                              </Badge>
                            )}
                          </td>

                          {/* Avg Marks */}
                          <td className="px-3 py-3 text-center font-medium">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              statsData.average_marks ? statsData.average_marks.toFixed(1) : 0
                            )}
                          </td>

                          {/* Highest */}
                          <td className="px-3 py-3 text-center text-green-600 font-semibold">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              statsData.highest_marks || 0
                            )}
                          </td>

                          {/* Lowest */}
                          <td className="px-3 py-3 text-center text-red-600 font-semibold border-r border-border/50">
                            {isStatsLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              statsData.lowest_marks || 0
                            )}
                          </td>

                          {/* Percentage Comparison Data */}
                          <td className="px-3 py-3 text-center bg-primary/[0.02]">
                            {pc?.present_percentage != null ? (
                              <span className="font-medium text-foreground">{pc.present_percentage.toFixed(1)}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center bg-primary/[0.02]">
                            {pc?.pass_40_plus_percentage != null ? (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                {pc.pass_40_plus_percentage.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center bg-primary/[0.02]">
                            {pc?.aggregate_50_plus_percentage != null ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {pc.aggregate_50_plus_percentage.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center bg-primary/[0.02]">
                            {pc?.exempt_60_plus_percentage != null ? (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {pc.exempt_60_plus_percentage.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-medium bg-primary/[0.02]">
                            {pc?.average_marks_percentage != null ? `${pc.average_marks_percentage.toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-3 py-3 text-center text-green-600 font-medium bg-primary/[0.02]">
                            {pc?.highest_marks_percentage != null ? `${pc.highest_marks_percentage.toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-3 py-3 text-center text-red-600 font-medium bg-primary/[0.02] border-r border-border/50">
                            {pc?.lowest_marks_percentage != null ? `${pc.lowest_marks_percentage.toFixed(1)}%` : "—"}
                          </td>

                          {/* Action */}
                          {!isFaculty && (
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExam(exam);
                                }}
                                className="h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Results</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // LEVEL 1: Batch List Table (Default View)
  // ══════════════════════════════════════════════════════════════
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-border">
        <p className="text-muted-foreground">No batch-wise results available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-border shadow-sm overflow-hidden space-y-0"
    >
      <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            {!isFaculty 
              ? "Click on any batch row to view its exam-wise results."
              : "Overview of batch-wise exam results and statistics."}
          </span>
        </div>
        <span className="font-semibold text-foreground">{data.length} Batches</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border/80">
              <th rowSpan={2} className="px-4 py-3 font-semibold text-left align-middle border-r border-border min-w-[200px]">
                Batch
              </th>
              <th colSpan={4} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                Students & Pass Rate
              </th>
              <th colSpan={3} className="px-3 py-2 font-semibold text-center border-r border-border bg-muted/40 text-[11px] tracking-wider">
                Marks
              </th>
              <th colSpan={7} className="px-3 py-2 font-semibold text-center bg-primary/10 text-primary border-r border-border text-[11px] tracking-wider">
                Percentage Comparison
              </th>
              {!isFaculty && (
                <th rowSpan={2} className="px-4 py-3 font-semibold text-right align-middle">
                  Action
                </th>
              )}
            </tr>
            <tr className="border-b border-border text-[11px]">
              {/* Students */}
              <th className="px-3 py-2 font-medium text-center">Total</th>
              <th className="px-3 py-2 font-medium text-center">Appeared</th>
              <th className="px-3 py-2 font-medium text-center">Passed</th>
              <th className="px-3 py-2 font-medium text-center border-r border-border">Pass %</th>
              {/* Marks */}
              <th className="px-3 py-2 font-medium text-center">Avg</th>
              <th className="px-3 py-2 font-medium text-center">Highest</th>
              <th className="px-3 py-2 font-medium text-center border-r border-border">Lowest</th>
              {/* Percentage Comparison */}
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Present Percentage">Present %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Pass (40%+) Percentage">≥40% Pass</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Aggregate (50%+) Percentage">≥50% Agg</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Exemption (60%+) Percentage">≥60% Exempt</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Average Marks Percentage">Avg %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5" title="Highest Marks Percentage">High %</th>
              <th className="px-3 py-2 font-medium text-center bg-primary/5 border-r border-border" title="Lowest Marks Percentage">Low %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row: any, i: number) => {
              const pc = row.percentage_comparison;
              return (
                <tr 
                  key={i} 
                  onClick={() => setSelectedBatch(row)}
                  className={
                    !isFaculty
                      ? "hover:bg-primary/5 cursor-pointer transition-colors group"
                      : "hover:bg-muted/10 cursor-default transition-colors"
                  }
                  title={!isFaculty ? "Click to view exam-wise results for this batch" : undefined}
                >
                  <td className={`px-4 py-3 font-medium border-r border-border/50 ${!isFaculty ? "text-foreground group-hover:text-primary transition-colors" : "text-foreground"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{row.batch_name || "-"}</span>
                    </div>
                  </td>
                  {/* Students */}
                  <td className="px-3 py-3 text-center">{row.total_students || 0}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.appeared_students ?? row.total_students ?? 0}</td>
                  <td className="px-3 py-3 text-center">{row.passed_students || 0}</td>
                  <td className="px-3 py-3 text-center border-r border-border/50">
                    <Badge variant="outline" className={
                      row.pass_percentage >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                      row.pass_percentage >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {row.pass_percentage ? row.pass_percentage.toFixed(1) : 0}%
                    </Badge>
                  </td>
                  {/* Marks */}
                  <td className="px-3 py-3 text-center font-medium">{row.average_marks ? row.average_marks.toFixed(1) : 0}</td>
                  <td className="px-3 py-3 text-center text-green-600 font-medium">{row.highest_marks || 0}</td>
                  <td className="px-3 py-3 text-center text-red-600 font-medium border-r border-border/50">{row.lowest_marks || 0}</td>
                  {/* Percentage Comparison */}
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.present_percentage != null ? (
                      <span className="font-medium text-foreground">{pc.present_percentage.toFixed(1)}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.pass_40_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {pc.pass_40_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.aggregate_50_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {pc.aggregate_50_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center bg-primary/[0.02]">
                    {pc?.exempt_60_plus_percentage != null ? (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {pc.exempt_60_plus_percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-medium bg-primary/[0.02]">
                    {pc?.average_marks_percentage != null ? `${pc.average_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-green-600 font-medium bg-primary/[0.02]">
                    {pc?.highest_marks_percentage != null ? `${pc.highest_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-red-600 font-medium bg-primary/[0.02] border-r border-border/50">
                    {pc?.lowest_marks_percentage != null ? `${pc.lowest_marks_percentage.toFixed(1)}%` : "—"}
                  </td>
                  {!isFaculty && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs font-semibold text-primary group-hover:bg-primary/10 gap-1 pointer-events-none"
                      >
                        <span>View Exams</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
