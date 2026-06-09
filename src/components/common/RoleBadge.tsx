import { ROLES } from "@/constants/roles";
import type { RoleId } from "@/types/role.types";
import { cn } from "@/lib/utils";

export default function RoleBadge({ role, className }: { role: RoleId | string; className?: string }) {
  const def = ROLES[role as RoleId];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        def?.color || "bg-gray-100", def?.textColor || "text-black", className,
      )}
    >
      {def?.label || role}
    </span>
  );
}
