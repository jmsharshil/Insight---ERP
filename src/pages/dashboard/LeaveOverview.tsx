import React from 'react';
import SectionCard from "@/components/common/SectionCard";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Ban } from "lucide-react";

export default function LeaveOverview({ data }: { data: any }) {
  if (!data) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <Ban className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case 'rejected': return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      case 'cancelled': return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default: return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <SectionCard title="Leave Balances" className="lg:col-span-1">
        <div className="space-y-4">
          <div className="flex justify-between items-end pb-4 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Remaining</p>
              <h3 className="text-3xl font-bold text-primary">{data.total_remaining_days} <span className="text-base font-normal text-muted-foreground">days</span></h3>
            </div>
            {data.pending_count > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {data.pending_count} Pending
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {data.balances?.map((b: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize flex-1">{b.leave_type} Leave</span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Used</p>
                    <p className="text-sm font-semibold">{b.used}</p>
                  </div>
                  <div className="h-6 w-px bg-border"></div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Left</p>
                    <p className="text-sm font-semibold text-primary">{b.remaining}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Team Leaves" className="lg:col-span-2">
        <div className="flex gap-4 mb-4">
          <div className="bg-card border border-border rounded-lg p-3 flex-1 flex flex-col justify-center text-center">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.team_pending}</span>
            <span className="text-xs text-muted-foreground mt-1">Pending Requests</span>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 flex-1 flex flex-col justify-center text-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.team_on_leave_today}</span>
            <span className="text-xs text-muted-foreground mt-1">On Leave Today</span>
          </div>
        </div>
        
        {data.team_recent_leaves?.length > 0 ? (
          <div className="space-y-3 mt-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
            {data.team_recent_leaves.map((leave: any) => (
              <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                <div>
                  <p className="text-sm font-semibold">{leave.applied_by__name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(leave.from_date), "MMM d")} - {format(new Date(leave.to_date), "MMM d, yyyy")} ({leave.total_days} days)
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="outline" className={`${getStatusColor(leave.status)} flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                    {getStatusIcon(leave.status)}
                    {leave.status}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground capitalize">{leave.leave_type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-sm">
            No recent team leaves
          </div>
        )}
      </SectionCard>
    </div>
  );
}
