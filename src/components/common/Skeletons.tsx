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
