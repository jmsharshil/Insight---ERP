import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Hammer } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
}

export default function ModulePlaceholder({ title }: ModulePlaceholderProps) {
  const { setPageTitle } = useUI();
  useEffect(() => { setPageTitle(title); }, [title, setPageTitle]);

  return (
    <div>
      <PageHeader title={title} subtitle="This module will be built in Part 2 of the EMS rollout." />
      <div className="rounded-xl bg-card border border-border">
        <EmptyState
          icon={Hammer}
          title="Coming Soon"
          description={`The ${title} module is on the roadmap. Foundation, auth, and dashboards are ready.`}
        />
      </div>
    </div>
  );
}
