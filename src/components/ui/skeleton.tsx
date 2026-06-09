import BaseSkeleton, { SkeletonProps } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: SkeletonProps & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <BaseSkeleton
      className={cn(className)}
      containerClassName="leading-none"
      {...props}
    />
  );
}

export { Skeleton };
