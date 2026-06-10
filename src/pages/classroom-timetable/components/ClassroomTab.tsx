import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, DoorOpen, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassRoom } from "@/redux/slices/classroomSlice";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassroomTabProps {
  classrooms: ClassRoom[];
  loading?: boolean;
  canEdit?: boolean;
  onAddClassroomClick?: () => void;
  onEditClassroomClick?: (c: ClassRoom) => void;
  onDeleteClassroomClick?: (c: ClassRoom) => void;
}

export default function ClassroomTab({ 
  classrooms, 
  loading,
  canEdit, 
  onAddClassroomClick,
  onEditClassroomClick,
  onDeleteClassroomClick
}: ClassroomTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClassrooms = useMemo(() => {
    return (classrooms || []).filter((c) => {
      const name = c.name || "";
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query);
    });
  }, [classrooms, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex bg-card p-4 rounded-xl border border-border">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="p-6 pb-3 border-b border-border/40 flex justify-between items-start">
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                </div>
                <div className="p-6 pt-4">
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
              {canEdit && (
                <div className="bg-muted/30 px-5 py-2 border-t border-border flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search classrooms by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
      </div>

      {filteredClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Classrooms */}
          {filteredClassrooms.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`transition-all duration-300 hover:shadow-md border border-border bg-card overflow-hidden group cursor-pointer flex flex-col justify-between h-full ${
                  c.is_active 
                    ? "" 
                    : "opacity-85 bg-muted/10"
                }`}
                onClick={() => {
                  if (canEdit && onEditClassroomClick) {
                    onEditClassroomClick(c);
                  }
                }}
              >
                <div>
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                          {c.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            c.is_active 
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <DoorOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2 text-primary shrink-0" />
                      <span>
                        Capacity: <strong className="font-semibold text-foreground">{c.capacity}</strong> Students
                      </span>
                    </div>
                  </CardContent>
                </div>

                {canEdit && (
                  <div className="bg-muted/30 px-5 py-2 border-t border-border flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer relative z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClassroomClick?.(c);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer relative z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClassroomClick?.(c);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 flex flex-col items-center justify-center text-center">
          <DoorOpen className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-semibold text-lg text-text-primary">No Classrooms Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm px-4">
            {searchQuery 
              ? "No classrooms match your query. Try resetting your search filter."
              : "No classrooms are currently set up. Click \"Add Classroom\" to get started."}
          </p>
          {!searchQuery && canEdit && onAddClassroomClick && (
            <Button 
              onClick={onAddClassroomClick} 
              variant="outline" 
              size="sm" 
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Classroom
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
