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
