import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Activity, Lock, PenLine, AlertTriangle, Search, RefreshCw, Eye, Globe, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { auditLogActions } from "@/redux/actions";
import { setAuditLogs, setAuditLogsLoading, setAuditLogsPagination, type AuditLogEntry } from "@/redux/slices/auditLogSlice";
import { API } from "@/service/api";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import { TableSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { FileSearch } from "lucide-react";

// ─── Color helpers ────────────────────────────────────────────────────────────

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  READ:   "bg-sky-100 text-sky-700 border-sky-200",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  LOGIN:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  LOGOUT: "bg-slate-100 text-slate-600 border-slate-200",
  OTHER:  "bg-purple-100 text-purple-700 border-purple-200",
};

const METHOD_BADGE: Record<string, string> = {
  GET:    "bg-sky-50 text-sky-600",
  POST:   "bg-emerald-50 text-emerald-600",
  PATCH:  "bg-amber-50 text-amber-600",
  PUT:    "bg-orange-50 text-orange-600",
  DELETE: "bg-red-50 text-red-600",
};

function statusColor(code: number) {
  if (code < 300) return "bg-emerald-100 text-emerald-700";
  if (code < 400) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { logs, loading, count, next, previous, currentPage } = useSelector((state: RootState) => state.auditLog);

  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch logs (server-side paginated) ──────────────────────────────────────

  const fetchLogs = useCallback((page: number = 1) => {
    // Build query string with filters + page
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (methodFilter !== "all") params.set("method", methodFilter);
    if (dateFilter) {
      params.set("date_from", `${dateFilter}T00:00:00Z`);
      params.set("date_to", `${dateFilter}T23:59:59Z`);
    }
    if (searchQuery.trim()) params.set("event", searchQuery.trim());

    const url = `${API.AUDIT_LOGS.LIST}?${params.toString()}`;

    dispatch({
      type: auditLogActions.GET_AUDIT_LOGS,
      method: "GET",
      endPoint: url,
      auth: true,
      setLoading: (val: boolean) => dispatch(setAuditLogsLoading(val)),
      getResponse: (res: any) => {
        console.log("[AuditLogs] API response:", res);
        // Handle DRF paginated: { count, next, previous, results }
        // Handle flat array: [...]
        // Handle wrapped: { data: [...] }
        const isPaginated = res?.results !== undefined && res?.count !== undefined;

        if (isPaginated) {
          dispatch(setAuditLogs(Array.isArray(res.results) ? res.results : []));
          dispatch(setAuditLogsPagination({
            count: res.count ?? 0,
            next: res.next ?? null,
            previous: res.previous ?? null,
            currentPage: page,
          }));
        } else {
          const raw = res?.data ?? res ?? [];
          const data: AuditLogEntry[] = Array.isArray(raw) ? raw : [];
          dispatch(setAuditLogs(data));
          dispatch(setAuditLogsPagination({
            count: data.length,
            next: null,
            previous: null,
            currentPage: 1,
          }));
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to fetch audit logs");
      },
    });
  }, [dispatch, toast, actionFilter, methodFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // ── Stats (based on current page data) ──────────────────────────────────────

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter(l => l.timestamp?.startsWith(todayStr)).length;
  const writeOps = logs.filter(l => ["CREATE", "UPDATE", "DELETE"].includes(l.action)).length;
  const errorCount = logs.filter(l => l.status_code >= 400).length;

  // ── Pagination helpers ──────────────────────────────────────────────────────

  const PAGE_SIZE = 50; // DRF default
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchLogs(page);
  };

  // ── Flush handler ───────────────────────────────────────────────────────────

  const [flushing, setFlushing] = useState(false);

  const handleFlush = () => {
    dispatch({
      type: auditLogActions.FLUSH_AUDIT_LOGS,
      method: "POST",
      endPoint: API.AUDIT_LOGS.FLUSH,
      auth: true,
      setLoading: (val: boolean) => setFlushing(val),
      getResponse: () => {
        toast.success("Blob flush scheduled successfully.");
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to trigger flush");
      },
    });
  };

  // ── Clear filters ───────────────────────────────────────────────────────────

  const clearFilters = () => {
    setActionFilter("all");
    setMethodFilter("all");
    setDateFilter("");
    setSearchQuery("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable, read-only API request history" />

      {/* Read-only banner */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-blue-50 border border-blue-200 p-3 mb-6 flex items-center gap-3 text-sm text-blue-800">
        <Lock className="w-4 h-4 shrink-0" /> Audit logs are read-only. Every API request is automatically recorded by the server middleware.
      </motion.div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Logs" value={count.toLocaleString()} icon={FileText} index={0} />
        <StatCard title="Today (this page)" value={todayCount} icon={Activity} index={1} />
        <StatCard title="Write Ops (this page)" value={writeOps} icon={PenLine} index={2} />
        <StatCard title="Errors (this page)" value={errorCount} icon={AlertTriangle} trendType={errorCount > 0 ? "down" : undefined} index={3} />
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search event…"
            className="h-9 pl-9 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"].map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-9 text-sm w-32"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {["GET", "POST", "PATCH", "PUT", "DELETE"].map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="h-9 text-sm w-44"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={clearFilters}>
          Clear
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={() => fetchLogs(currentPage)} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" className="h-9 text-sm gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50" onClick={handleFlush} disabled={flushing}>
            <Globe className="w-3.5 h-3.5" /> {flushing ? "Flushing…" : "Flush to Blob"}
          </Button>
        </div>
      </div>

      {/* Data table */}
      {loading ? <TableSkeleton columns={8} rows={8} className="mt-0" /> : (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState icon={FileSearch} title="No audit logs found" description="Try changing your filters or check back later." />
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.015 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell>
                        <span className="text-xs font-mono whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium max-w-[200px] truncate block" title={r.event}>{r.event || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize border ${ACTION_BADGE[r.action] || ACTION_BADGE.OTHER}`}>
                          {r.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{r.user_name || "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground capitalize">{r.user_role || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-mono ${METHOD_BADGE[r.method] || "bg-muted text-muted-foreground"}`}>
                          {r.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-mono ${statusColor(r.status_code)}`}>
                          {r.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground max-w-[180px] truncate block" title={r.path}>
                          {r.path}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button onClick={(e) => { e.stopPropagation(); setSelected(r); }} className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {count > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages} · {count.toLocaleString()} total records
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!previous}
                  onClick={() => goToPage(currentPage - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>

                {/* Page number buttons */}
                {(() => {
                  const pages: number[] = [];
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, currentPage + 2);
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map(p => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </Button>
                  ));
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!next}
                  onClick={() => goToPage(currentPage + 1)}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  {selected.event || "Audit Log Detail"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-5 text-sm">
                {/* Action + Method + Status row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs border ${ACTION_BADGE[selected.action] || ACTION_BADGE.OTHER}`}>{selected.action}</Badge>
                  <Badge className={`text-xs font-mono ${METHOD_BADGE[selected.method] || "bg-muted"}`}>{selected.method}</Badge>
                  <Badge className={`text-xs font-mono ${statusColor(selected.status_code)}`}>{selected.status_code}</Badge>
                  {selected.flushed_to_blob && (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200 border">Synced to Blob</Badge>
                  )}
                  {!selected.flushed_to_blob && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 border">Pending Blob Sync</Badge>
                  )}
                </div>

                {/* User info */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">User</div>
                    <div className="font-medium">{selected.user_name || "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">{selected.user_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Role</div>
                    <div className="capitalize font-medium">{selected.user_role || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Organization</div>
                    <div className="font-medium">{selected.organization_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Timestamp</div>
                    <div className="font-mono text-xs">{new Date(selected.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                {/* Request info */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">IP Address</div>
                    <div className="font-mono text-xs">{selected.ip_address || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Endpoint Name</div>
                    <div className="font-mono text-xs">{selected.endpoint_name || "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-0.5">Full Path</div>
                    <div className="font-mono text-xs break-all">{selected.path}</div>
                  </div>
                  {selected.query_params && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Query Params</div>
                      <div className="font-mono text-xs break-all">{selected.query_params}</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-0.5">User Agent</div>
                    <div className="font-mono text-[11px] break-all text-muted-foreground">{selected.user_agent || "—"}</div>
                  </div>
                </div>

                {/* Target model */}
                {(selected.target_model || selected.target_id) && (
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Target Model</div>
                      <div className="font-mono text-xs">{selected.target_model || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Target ID</div>
                      <div className="font-mono text-xs break-all">{selected.target_id || "—"}</div>
                    </div>
                  </div>
                )}

                {/* Request body */}
                {selected.request_body && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Request Body</div>
                    <pre className="bg-slate-50 border border-border rounded-lg p-3 text-xs overflow-x-auto max-h-48 font-mono">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selected.request_body), null, 2); }
                        catch { return selected.request_body; }
                      })()}
                    </pre>
                  </div>
                )}

                {/* Response summary */}
                {selected.response_summary && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Response Summary</div>
                    <pre className="bg-slate-50 border border-border rounded-lg p-3 text-xs overflow-x-auto max-h-48 font-mono">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selected.response_summary), null, 2); }
                        catch { return selected.response_summary; }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
