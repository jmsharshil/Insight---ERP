import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  const modules = ROLES[user.role].modules
    .filter((m) => !(m === "dashboard" && user?.role === "super_admin"))
    .slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border flex items-stretch h-16">
      {modules.map((m) => {
        const item = NAV_ITEMS[m];
        return (
          <NavLink
            key={m}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full px-1">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
