import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DoorOpen } from "lucide-react";

export default function ClassroomTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dummy Classrooms */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-lg">
                Room {100 + i}
                <DoorOpen className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Main Building</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                Capacity: {30 + i * 5} Students
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
