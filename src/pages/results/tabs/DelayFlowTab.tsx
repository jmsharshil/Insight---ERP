import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { axiosRequest } from "@/service/axiosRequest";
import SectionCard from "@/components/common/SectionCard";
import { format } from "date-fns";
import { Check, Clock, AlertTriangle, Calendar, User, Search, FileSearch, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import { ReportsSkeleton } from "@/components/common/Skeletons";

export default function DelayFlowTab() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
        
        let url = `${baseUrl}/api/v1/batches/dropdowns/`;
        if (user && user.role === "branch_manager" && user.branch) {
          url += `?branch_id=${user.branch}`;
        }

        const res = await axiosRequest({
          method: "GET",
          url,
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const respData = res.data?.data || res.data || {};
        setBatches(Array.isArray(respData.batches) ? respData.batches : (Array.isArray(respData) ? respData : []));
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      }
    };
    fetchBatches();
  }, [user]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [delayStatus, setDelayStatus] = useState<string>("all");
  const [batchId, setBatchId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [examStatus, setExamStatus] = useState<string>("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const clearFilters = () => {
    setSearch("");
    setDelayStatus("all");
    setBatchId("all");
    setDateFrom("");
    setDateTo("");
    setExamStatus("all");
  };

  useEffect(() => {
    const fetchDelayFlow = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
        
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (delayStatus !== "all") params.append("delay_status", delayStatus);
        if (batchId !== "all") params.append("batch_id", batchId);
        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);
        if (examStatus !== "all") params.append("exam_status", examStatus);

        const res = await axiosRequest({
          method: "GET",
          url: `${baseUrl}/api/v1/results/delay-flow/?${params.toString()}`,
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setData(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch delay flow:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDelayFlow();
  }, [debouncedSearch, delayStatus, batchId, dateFrom, dateTo, examStatus]);

  const getStages = (row: any) => [
    { 
      label: "Answer Key Ready", 
      description: "When the answer key was uploaded",
      expected: row.date_of_examination, actual: row.date_of_readiness_of_answerkey, status: row.status_of_readiness_of_answer_keys 
    },
    { 
      label: "Sent to Checker", 
      description: "When student answer sheets are officially handed over to the paper checker.",
      expected: row.expected_date_of_submission_to_paper_checker, actual: row.date_of_submission_of_papers_to_paper_checker, status: row.status_of_submission_of_papers_to_paper_checker 
    },
    { 
      label: "Checking Done", 
      description: "When the paper checker finishes grading all the papers.",
      expected: row.expected_date_of_delivery_of_papers_by_paper_checker, actual: row.date_of_delivery_of_papers_by_paper_checker, status: row.status_of_delivery_of_papers_by_paper_checker 
    },
    { 
      label: "Results Released", 
      description: "When the graded papers and results are released to the students.",
      expected: row.expected_date_of_delivery_of_checked_answer_keys_to_students, actual: row.date_of_delivery_of_checked_answer_keys_to_students, status: row.status_of_delivery_of_checked_answer_keys_to_students 
    },
    { 
      label: "Marks Shared", 
      description: "When the published results are communicated in the group.",
      expected: row.expected_date_of_sending_marks_in_a_group, actual: row.date_of_sending_marks_in_a_group, status: row.status_of_sending_marks_in_a_group 
    },
    { 
      label: "Process Complete", 
      description: "Overall summary of the entire lifecycle (deadline is 7 days after exam).",
      expected: row.expected_date_completion, actual: null, status: row.status_of_completion_of_process 
    },
  ];

  const Pipeline = ({ stages }: { stages: any[] }) => {
    return (
      <div className="flex items-start w-full mt-2 relative">
        {stages.map((stage, idx) => {
          const isDone = stage.status === "ON TIME";
          const isDelayed = stage.status === "DELAYED";
          const isPending = stage.status === "PENDING" || !stage.status;
          
          let ringColor = "border-border bg-background";
          let iconColor = "text-muted-foreground";
          let Icon = Clock;
          let dateColor = "text-muted-foreground";
  
          if (isDone) {
            ringColor = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
            iconColor = "text-emerald-600 dark:text-emerald-400";
            Icon = Check;
            dateColor = "text-emerald-600 dark:text-emerald-400";
          } else if (isDelayed) {
            ringColor = "border-rose-500 bg-rose-50 dark:bg-rose-950/30";
            iconColor = "text-rose-600 dark:text-rose-400";
            Icon = AlertTriangle;
            dateColor = "text-rose-600 dark:text-rose-400";
          } else if (isPending) {
            ringColor = "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
            iconColor = "text-amber-600 dark:text-amber-400";
            Icon = Clock;
            dateColor = "text-amber-600 dark:text-amber-400";
          }
  
          const dateToShow = stage.actual || stage.expected;
  
          return (
            <div 
              key={idx} 
              className="flex-1 flex flex-col relative group min-w-[70px] cursor-help"
              title={stage.description}
            >
              {/* Top row: Node and Line */}
              <div className="flex items-center w-full">
                <div className="flex-1 h-1">
                  {idx > 0 && <div className={`h-full w-full ${stages[idx-1].status === "ON TIME" ? "bg-emerald-500" : "bg-border"}`} />}
                </div>
                
                <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 z-10 transition-colors ${ringColor}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
  
                <div className="flex-1 h-1">
                  {idx < stages.length - 1 && <div className={`h-full w-full ${isDone ? "bg-emerald-500" : "bg-border"}`} />}
                </div>
              </div>
  
              {/* Content below node */}
              <div className="mt-3 flex flex-col items-center text-center px-1">
                <span className="text-[11px] font-bold leading-tight decoration-muted-foreground/30 decoration-dashed underline underline-offset-4">{stage.label}</span>
                <span className={`text-[10px] mt-1.5 font-bold ${dateColor}`}>{stage.status || "PENDING"}</span>
                <div className="mt-1.5 flex flex-col items-center text-[11px] gap-0.5">
                  {stage.expected && (
                    <span className="text-muted-foreground whitespace-nowrap">Exp: {format(new Date(stage.expected), "MMM dd")}</span>
                  )}
                  {stage.actual ? (
                    <span className="text-foreground font-semibold whitespace-nowrap">Done: {format(new Date(stage.actual), "MMM dd")}</span>
                  ) : (
                    <span className="text-muted-foreground italic whitespace-nowrap">Done: -</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getProcessStatusColor = (status: string) => {
    if (status === "ON TIME") return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800";
    if (status === "DELAYED") return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800";
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800";
  };

  if (loading) {
    return <div className="p-4"><ReportsSkeleton /></div>;
  }

  return (
    <SectionCard title="Paper Checking Delay Tracking">
      <div className="flex flex-col gap-6">
        {/* Filters Header */}
        <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by subject, checker..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <FilterX className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Badge variant="outline" className="px-3 py-1 font-medium bg-white">
                Total Tracking: {data.length}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={delayStatus} onValueChange={setDelayStatus}>
              <SelectTrigger className="w-[160px] h-9 bg-white text-xs font-medium">
                <SelectValue placeholder="Delay Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="LATE">Late / Delayed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="w-[180px] h-9 bg-white text-xs font-medium">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={examStatus} onValueChange={setExamStatus}>
              <SelectTrigger className="w-[180px] h-9 bg-white text-xs font-medium">
                <SelectValue placeholder="Exam Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exam Statuses</SelectItem>
                <SelectItem value="results_published">Results Published</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 bg-white border border-border rounded-md px-2 h-9 shadow-sm">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">From</span>
              <Input 
                type="date" 
                className="h-7 w-[110px] text-xs font-medium border-0 px-1 py-0 shadow-none focus-visible:ring-0" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-border rounded-md px-2 h-9 shadow-sm">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">To</span>
              <Input 
                type="date" 
                className="h-7 w-[110px] text-xs font-medium border-0 px-1 py-0 shadow-none focus-visible:ring-0" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Data List */}
        {data.length === 0 ? (
          <EmptyState icon={FileSearch} title="No tracking data found" description="Try adjusting your search filters." />
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {data.map((row: any) => (
              <div 
                key={row.exam_id} 
                className="bg-card border border-border shadow-sm rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
                  {/* Left Side: Exam Details */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {row.cs_level_batch}
                      </Badge>
                      {row.date_of_examination && (
                        <Badge variant="secondary" className="font-normal text-muted-foreground flex items-center gap-1 bg-muted/40">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(row.date_of_examination), "MMM dd, yyyy")}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mt-1 line-clamp-1">{row.exam_name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        Subject: <span className="font-medium text-foreground">{row.subject}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold">{row.name_of_paper_checker}</span>
                    </div>
                  </div>
                  
                  {/* Right Side: Overall Process Status */}
                  <div className="flex xl:flex-col items-center xl:items-end gap-2 shrink-0 bg-muted/20 p-3 rounded-lg border border-border/50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Process</span>
                    <Badge variant="outline" className={`px-3 py-1 font-bold ${getProcessStatusColor(row.status_of_completion_of_process)}`}>
                      {row.status_of_completion_of_process || "PENDING"}
                    </Badge>
                  </div>
                </div>
                
                {/* Visual Pipeline */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50 overflow-x-auto">
                  <Pipeline stages={getStages(row)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
