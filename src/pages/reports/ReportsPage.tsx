import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, GraduationCap, Users, Percent, Download } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ScatterChart, Scatter,
} from "recharts";
import { useToast } from "@/hooks/useToast";
import {
  REPORT_KPIS, FEE_MONTHLY, PAYMENT_MODES, FEE_STATUS_ROWS, ATTENDANCE_TREND,
  ROOM_OCCUPANCY, FACULTY_LOAD, SUBJECT_AVG, ATT_VS_SCORE, CRM_FUNNEL,
  COUNSELLOR_PERF, LOST_REASONS, LEAVE_BY_TYPE,
} from "@/constants/dummy/reports";

const COLORS = ["#F7A900", "#2e3032", "#22c55e", "#3b82f6", "#a855f7"];

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [target, duration]);
  return v;
}

function KPI({ title, value, suffix = "", prefix = "", icon: Icon }: any) {
  const v = useCountUp(value);
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
      className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold text-text-primary mt-2">
            {prefix}{v.toLocaleString()}{suffix}
          </p>
        </div>
        <div className="rounded-lg bg-primary-light p-3"><Icon className="w-5 h-5 text-primary-dark" /></div>
      </div>
    </motion.div>
  );
}

const tooltipStyle = { backgroundColor: "#2e3032", border: "none", borderRadius: 8, color: "white" } as const;

export default function ReportsPage() {
  const toast = useToast();
  const exportReport = (type: string) => toast.success(`Export started. Your ${type} download will begin shortly.`);

  return (
    <div>
      <PageHeader title="Reports & Dashboard" subtitle="Operational insights across all modules" actions={
        <Button variant="outline" onClick={() => exportReport("PDF")}><Download className="w-4 h-4 mr-1.5"/>Export PDF</Button>
      } />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI title="Total Revenue (May)" value={REPORT_KPIS.totalRevenue} prefix="₹" icon={TrendingUp} />
        <KPI title="Avg Attendance" value={REPORT_KPIS.avgAttendance} suffix="%" icon={Percent} />
        <KPI title="New Admissions" value={REPORT_KPIS.newAdmissions} icon={GraduationCap} />
        <KPI title="CRM Conversion" value={REPORT_KPIS.conversionRate} suffix="%" icon={Users} />
      </div>
      <Tabs defaultValue="fees">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Monthly Collection</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FEE_MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" fill="#F7A900" radius={[6,6,0,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Payment Modes</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={PAYMENT_MODES} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {PAYMENT_MODES.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DataTable exportable data={FEE_STATUS_ROWS} columns={[
            { key: "student", header: "Student" }, { key: "batch", header: "Batch" },
            { key: "paid", header: "Paid", render: (r:any) => `₹${r.paid.toLocaleString()}` },
            { key: "pending", header: "Pending", render: (r:any) => `₹${r.pending.toLocaleString()}` },
            { key: "overdue", header: "Status", render: (r:any) => r.overdue ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="outline">OK</Badge> },
          ]} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-3">30-Day Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="percent" stroke="#2e3032" strokeWidth={2} dot={{ fill: "#F7A900" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-3">Room Occupancy</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ROOM_OCCUPANCY}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="room" /><YAxis />
                <Tooltip contentStyle={tooltipStyle} /><Legend />
                <Bar dataKey="morning" stackId="a" fill="#F7A900" />
                <Bar dataKey="afternoon" stackId="a" fill="#2e3032" />
                <Bar dataKey="evening" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataTable data={FACULTY_LOAD} columns={[
            { key: "name", header: "Faculty" }, { key: "assigned", header: "Assigned Hrs" }, { key: "completed", header: "Completed Hrs" },
          ]} />
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Subject Average</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SUBJECT_AVG}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="subject" /><YAxis />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="avg" fill="#2e3032" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Attendance vs Score</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart><CartesianGrid /><XAxis dataKey="attendance" name="Attendance %" />
                  <YAxis dataKey="score" name="Score" /><Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={ATT_VS_SCORE} fill="#F7A900" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-3">Faculty Payroll Summary</h3>
            <DataTable data={FACULTY_LOAD.map((f, i) => ({
              name: f.name, hours: f.completed, gross: f.completed * 1000,
              deductions: 500 + i * 100, net: f.completed * 1000 - (500 + i * 100),
              status: i < 3 ? "disbursed" : "pending",
            }))} columns={[
              { key: "name", header: "Name" }, { key: "hours", header: "Hours" },
              { key: "gross", header: "Gross", render: (r:any) => `₹${r.gross.toLocaleString()}` },
              { key: "deductions", header: "Deductions", render: (r:any) => `₹${r.deductions}` },
              { key: "net", header: "Net", render: (r:any) => `₹${r.net.toLocaleString()}` },
              { key: "status", header: "Status", render: (r:any) => <Badge variant="outline" className="capitalize">{r.status}</Badge> },
            ]} />
          </div>
        </TabsContent>

        <TabsContent value="crm" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={CRM_FUNNEL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="stage" type="category" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#F7A900" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold mb-3">Lost Lead Reasons</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={LOST_REASONS} dataKey="value" nameKey="name" outerRadius={90}>
                    {LOST_REASONS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DataTable data={COUNSELLOR_PERF.map(c => ({ ...c, rate: `${Math.round(c.converted/c.assigned*100)}%` }))} columns={[
            { key: "name", header: "Counsellor" }, { key: "assigned", header: "Assigned" },
            { key: "converted", header: "Converted" }, { key: "rate", header: "Rate" },
          ]} />
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-3">Leave by Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={LEAVE_BY_TYPE}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" /><YAxis />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#2e3032" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
