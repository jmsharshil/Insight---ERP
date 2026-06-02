import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Briefcase, BookOpen, BarChart3 } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { DUMMY_STUDENTS } from "@/constants/dummy/students";
import { DUMMY_LEADS } from "@/constants/dummy/crm";
import { FACULTY_MEMBERS } from "@/constants/dummy/faculty";
import { DUMMY_EXAMS } from "@/constants/dummy/exams";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search students, leads, faculty, exams..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Students">
          {DUMMY_STUDENTS.slice(0, 5).map((s: any) => (
            <CommandItem key={s.id} onSelect={() => go(`/students/${s.id}`)}>
              <GraduationCap className="w-4 h-4 mr-2" />
              {s.name ?? s.studentName} <span className="ml-2 text-xs text-muted-foreground">{s.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Leads">
          {DUMMY_LEADS.slice(0, 5).map((l) => (
            <CommandItem key={l.id} onSelect={() => go(`/crm`)}>
              <Users className="w-4 h-4 mr-2" />
              {l.studentName} <span className="ml-2 text-xs text-muted-foreground">{l.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Faculty">
          {FACULTY_MEMBERS.slice(0, 5).map((f) => (
            <CommandItem key={f.id} onSelect={() => go(`/faculty`)}>
              <Briefcase className="w-4 h-4 mr-2" />
              {f.name} <span className="ml-2 text-xs text-muted-foreground">{f.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Exams">
          {DUMMY_EXAMS.slice(0, 5).map((e) => (
            <CommandItem key={e.id} onSelect={() => go(`/exams`)}>
              <BookOpen className="w-4 h-4 mr-2" />
              {e.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Links">
          <CommandItem onSelect={() => go("/reports")}>
            <BarChart3 className="w-4 h-4 mr-2" /> Reports & Dashboard
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
