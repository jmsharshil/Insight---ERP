import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/utils";
interface CardSkeletonProps {
  rows?: number;
  hasAvatar?: boolean;
  className?: string;
}
export function CardSkeleton({ rows = 3, hasAvatar = true, className }: CardSkeletonProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm space-y-4", className)}
    >
      {/* Header section */}
      <div className="flex items-center gap-4">
        {hasAvatar && <Skeleton circle height={48} width={48} containerClassName="flex-shrink-0" />}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton width="40%" height={20} />
          <Skeleton width="25%" height={14} />
        </div>
      </div>
      {/* Body section */}
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton key={idx} width={idx === rows - 1 ? "60%" : "100%"} height={16} />
        ))}
      </div>
    </div>
  );
}
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}
export function TableSkeleton({ rows = 5, columns = 5, className }: TableSkeletonProps) {
  // Generate slightly random widths for cells to make the loading state feel more natural/organic
  const getRandomWidth = (colIdx: number) => {
    if (colIdx === 0) return "50%"; // Avatar / Name col
    if (colIdx === 1) return "75%"; // Email col
    if (colIdx === 2) return "45%"; // Phone col
    if (colIdx === 3) return "35%"; // Role badge col
    return "60%"; // Date / Status col
  };
  return (
    <div
      className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-sm", className)}
    >
      {/* Mock Table Header */}
      <div
        className="grid border-b border-border bg-muted/40 px-6 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, colIdx) => (
          <div key={colIdx} className="pr-4 w-full">
            <Skeleton height={16} width="60%" containerClassName="w-full block" />
          </div>
        ))}
      </div>
      {/* Mock Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid px-6 py-4 items-center gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="flex items-center pr-4 w-full">
                {colIdx === 0 ? (
                  // First column usually has an avatar + name pattern
                  <div className="flex items-center gap-3 w-full">
                    <Skeleton circle height={32} width={32} containerClassName="flex-shrink-0" />
                    <Skeleton
                      height={14}
                      width={getRandomWidth(colIdx)}
                      containerClassName="w-full block flex-1"
                    />
                  </div>
                ) : (
                  <Skeleton
                    height={14}
                    width={getRandomWidth(colIdx)}
                    containerClassName="w-full block"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SheetSkeleton() {
  return (
    <div className="mt-5 space-y-5 pb-10">
      <div className="space-y-3">
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={40} className="rounded-lg" />
      </div>
      <div>
        <Skeleton width={100} height={16} className="mb-2" />
        <Skeleton height={80} className="rounded-lg" />
      </div>
      <div>
        <Skeleton width={120} height={16} className="mb-2" />
        <Skeleton height={120} className="rounded-lg" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, idx) => {
        const isOwn = idx % 2 !== 0;
        return (
          <div key={idx} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] w-[250px] space-y-2 p-3 ${isOwn ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-2xl rounded-tr-sm" : "bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-sm"}`}>
              <Skeleton width={isOwn ? "100%" : "80%"} height={14} className={isOwn ? "opacity-50" : "opacity-30"} />
              <Skeleton width={isOwn ? "60%" : "40%"} height={14} className={isOwn ? "opacity-50" : "opacity-30"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChatPageSkeleton() {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[85vh] animate-in fade-in duration-300">
      {/* Sidebar Skeleton */}
      <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border space-y-2">
          <Skeleton height={36} className="rounded-md" />
          <Skeleton height={32} className="rounded-md" />
        </div>
        <div className="flex-1 p-3 space-y-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton circle width={36} height={36} />
              <div className="flex-1">
                <Skeleton width="60%" height={14} className="mb-1.5" />
                <Skeleton width="80%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Thread Skeleton */}
      <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center gap-3">
          <Skeleton circle width={36} height={36} />
          <div className="flex-1">
            <Skeleton width={120} height={16} className="mb-1" />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col justify-end overflow-hidden">
          <ChatSkeleton />
        </div>
        <div className="p-3 border-t border-border flex items-center gap-2">
          <Skeleton circle width={40} height={40} className="shrink-0" />
          <Skeleton height={40} className="flex-1 rounded-md" />
          <Skeleton width={40} height={40} className="shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}


/* ---------- Fee-related Skeletons ---------- */

export function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controls bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={260} height={18} />
          <Skeleton width={180} height={12} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={120} height={36} className="rounded-lg" />
          <Skeleton width={90} height={36} className="rounded-lg" />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex justify-between items-start">
              <Skeleton width={100} height={12} />
              <Skeleton width={32} height={32} className="rounded-lg" />
            </div>
            <Skeleton width={140} height={28} />
            <Skeleton width={180} height={10} />
          </div>
        ))}
      </div>

      {/* 3 secondary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex justify-between items-start">
              <Skeleton width={100} height={12} />
              <Skeleton width={32} height={32} className="rounded-lg" />
            </div>
            <Skeleton width={120} height={28} />
            <Skeleton width={160} height={10} />
          </div>
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton width={200} height={16} />
          <Skeleton width={150} height={12} />
          <Skeleton height={260} className="rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton width={160} height={16} />
          <Skeleton width={200} height={12} />
          <Skeleton height={160} className="rounded-lg" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton circle width={10} height={10} />
                  <Skeleton width={60} height={12} />
                </div>
                <Skeleton width={80} height={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StructuresSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          {/* Title + badge */}
          <div className="flex justify-between items-start">
            <Skeleton width="60%" height={20} />
            <Skeleton width={70} height={20} className="rounded-full" />
          </div>
          {/* Description */}
          <Skeleton width="90%" height={12} />
          <Skeleton width="50%" height={12} />
          {/* Fee breakdown */}
          <div className="border-t pt-3 space-y-2.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Skeleton width={90} height={12} />
                <Skeleton width={70} height={12} />
              </div>
            ))}
            <div className="border-t border-dashed pt-2">
              <div className="flex justify-between">
                <Skeleton width={70} height={14} />
                <Skeleton width={90} height={14} />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2.5 border-t pt-3">
            <Skeleton width="50%" height={32} className="rounded-md" />
            <Skeleton width="50%" height={32} className="rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeeTableSkeleton({
  rows = 6,
  columns = 8,
  hasFilter = true,
}: {
  rows?: number;
  columns?: number;
  hasFilter?: boolean;
}) {
  const colWidths = ["50%", "65%", "45%", "40%", "35%", "50%", "55%", "30%"];
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Filter bar */}
      {hasFilter && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton width={160} height={14} />
              <Skeleton width={240} height={10} />
            </div>
            <div className="flex gap-3">
              <Skeleton width={192} height={36} className="rounded-md" />
              <Skeleton width={160} height={36} className="rounded-md" />
            </div>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Header */}
        <div
          className="grid border-b border-border bg-muted/40 px-6 py-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="pr-4">
              <Skeleton height={14} width="55%" />
            </div>
          ))}
        </div>
        {/* Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="grid px-6 py-4 items-center"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, c) => (
                <div key={c} className="pr-4">
                  <Skeleton height={14} width={colWidths[c % colWidths.length]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentDetailSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton width={140} height={24} />
          <Skeleton width={200} height={14} />
        </div>
        <Skeleton width={140} height={36} className="rounded-md" />
      </div>

      {/* Summary card */}
      <div className="rounded-xl bg-muted/30 border border-border p-5 space-y-3">
        <Skeleton width={120} height={12} />
        <Skeleton width={200} height={10} />
        <div className="grid grid-cols-3 gap-4 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton width={80} height={10} />
              <Skeleton width={110} height={24} />
            </div>
          ))}
        </div>
      </div>

      {/* Fee allocations */}
      <div>
        <Skeleton width={160} height={18} className="mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex justify-between">
                <Skeleton width="55%" height={14} />
                <Skeleton width={60} height={18} className="rounded-full" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton width={90} height={12} />
                    <Skeleton width={70} height={12} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      <Skeleton width={140} height={18} className="mt-4" />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-6 border-b border-border bg-muted/40 px-6 py-3">
          {Array.from({ length: 6 }).map((_, c) => (
            <div key={c} className="pr-4">
              <Skeleton height={14} width="55%" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, r) => (
            <div key={r} className="grid grid-cols-6 px-6 py-4 items-center">
              {Array.from({ length: 6 }).map((_, c) => (
                <div key={c} className="pr-4">
                  <Skeleton height={14} width={c === 0 ? "50%" : "65%"} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RoomDetailsSkeleton() {
  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden w-80 border-l border-border flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
        <Skeleton width={100} height={20} />
        <Skeleton circle width={32} height={32} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Skeleton circle width={96} height={96} />
          <div className="text-center w-full flex flex-col items-center">
            <Skeleton width={150} height={24} className="mb-2" />
            <Skeleton width={100} height={16} />
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-border">
          <Skeleton width={120} height={20} className="mb-4" />
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Skeleton circle width={40} height={40} />
              <div className="flex-1">
                <Skeleton width="60%" height={16} className="mb-1" />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FacultySummarySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton width={120} height={14} className="mb-2" />
            <Skeleton width={80} height={32} />
          </div>
        ))}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-[350px] flex flex-col">
            <Skeleton width={180} height={20} className="mb-4" />
            <div className="flex-1 w-full h-full">
              {i === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton circle width={220} height={220} />
                </div>
              ) : (
                <Skeleton height="100%" className="h-full" containerClassName="h-full block" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Array.from({ length: 2 }).map((_, gIdx) => (
        <div key={gIdx}>
          <Skeleton width={80} height={14} className="mb-3 ml-1" />
          <div className="space-y-2">
            {Array.from({ length: gIdx === 0 ? 3 : 2 }).map((_, nIdx) => (
              <div key={nIdx} className="w-full text-left rounded-lg border border-border bg-card p-4 flex items-start gap-4 shadow-sm">
                <Skeleton circle width={36} height={36} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton width="40%" height={16} />
                    <Skeleton width={60} height={12} />
                  </div>
                  <Skeleton width="90%" height={14} />
                  <Skeleton width="60%" height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportTicketDetailSkeleton() {
  return (
    <div className="mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-2 -ml-4">
        <Skeleton width={120} height={36} />
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <Skeleton width={150} height={24} />
        <div className="space-y-2 mt-4">
          <Skeleton width="40%" height={16} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <Skeleton width={200} height={24} />
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
           <div className="flex justify-between items-center">
             <div className="flex gap-2 items-center"><Skeleton circle width={24} height={24} /><Skeleton width={150} height={20} /></div>
             <Skeleton width={100} height={16} />
           </div>
           <Skeleton width="100%" height={16} count={2} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 mt-6">
        <Skeleton width={150} height={24} />
        <Skeleton width="100%" height={120} />
        <div className="flex justify-between items-center mt-4">
           <Skeleton width={120} height={36} />
           <Skeleton width={100} height={36} />
        </div>
      </div>
    </div>
  );
}
