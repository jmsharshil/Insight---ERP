import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, AlertTriangle, Activity, Lock } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AUDIT_LOGS, type AuditLog } from "@/constants/dummy/auditLogs";

export default function AuditLogsPage() {
  const [logs] = useState(AUDIT_LOGS);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [severity, setSeverity] = useState<string>("all");
  const [module, setModule] = useState<string>("all");

  const filtered = useMemo(() => logs.filter(l =>
    (severity === "all" || l.severity === severity) && (module === "all" || l.module === module),
  ), [logs, severity, module]);

  const today = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;

  const sevColor = (s: string) => s === "critical" ? "bg-destructive/20 text-destructive" : s === "warning" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground";

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable, read-only event history" />
      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="rounded-xl bg-blue-50 border border-blue-200 p-3 mb-6 flex items-center gap-3 text-sm text-blue-800">
        <Lock className="w-4 h-4" /> Audit logs are read-only. No modifications are possible, including by Super Admin.
      </motion.div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Logs" value="1,247" icon={FileText} index={0} />
        <StatCard title="Today" value={today} icon={Activity} index={1} />
        <StatCard title="Critical" value={logs.filter(l=>l.severity==="critical").length} icon={AlertCircle} trendType="down" index={2} />
        <StatCard title="Warnings" value={logs.filter(l=>l.severity==="warning").length} icon={AlertTriangle} trendType="warning" index={3} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Input type="date" className="w-44" />
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {Array.from(new Set(logs.map(l => l.module))).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable exportable data={filtered} columns={[
        { key: "timestamp", header: "Timestamp", render: (r:AuditLog) => new Date(r.timestamp).toLocaleString() },
        { key: "eventType", header: "Event" },
        { key: "module", header: "Module", render: (r:AuditLog) => <Badge variant="outline">{r.module}</Badge> },
        { key: "actingUser", header: "User", render: (r:AuditLog) => <div><div className="text-sm">{r.actingUser}</div><div className="text-xs text-muted-foreground">{r.actingUserRole}</div></div> },
        { key: "affectedRecordId", header: "Record" },
        { key: "severity", header: "Severity", render: (r:AuditLog) => <Badge className={sevColor(r.severity)}>{r.severity}</Badge> },
        { key: "details", header: "", render: (r:AuditLog) => <button onClick={() => setSelected(r)} className="text-primary-dark text-sm underline">View</button> },
      ]} />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.eventType}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-md bg-muted p-3">{selected.description}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-muted-foreground text-xs">User</div><div>{selected.actingUser}</div><div className="text-xs">{selected.actingUserRole}</div></div>
                  <div><div className="text-muted-foreground text-xs">IP Address</div><div className="font-mono text-xs">{selected.ipAddress}</div></div>
                  <div><div className="text-muted-foreground text-xs">Record</div><div className="font-mono text-xs">{selected.affectedRecordId}</div></div>
                  <div><div className="text-muted-foreground text-xs">Time</div><div>{new Date(selected.timestamp).toLocaleString()}</div></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-destructive mb-1">Before</div>
                    <pre className="bg-red-50 rounded-md p-2 text-xs overflow-x-auto">{JSON.stringify(selected.beforeState, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-success mb-1">After</div>
                    <pre className="bg-green-50 rounded-md p-2 text-xs overflow-x-auto">{JSON.stringify(selected.afterState, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
