import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { ChatAction } from "@/redux/actions";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface RoomDetailsProps {
  roomId: string;
  onBack: () => void;
}

import { RoomDetailsSkeleton } from "@/components/common/Skeletons";

export default function RoomDetails({ roomId, onBack }: RoomDetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (roomId) {
      setLoading(true);
      dispatch({
        type: ChatAction.GET_CHAT_ROOM_DETAILS,
        method: "GET",
        endPoint: `/api/v1/chat/rooms/${roomId}/`,
        auth: true,
        getResponse: (res: any) => {
          setDetails(res?.data || res);
          setLoading(false);
        },
        getError: (err: any) => {
          console.error("Error fetching room details:", err);
          toast.error("Failed to load group details");
          setLoading(false);
        }
      });
    }
  }, [roomId, dispatch, toast]);

  const formatRole = (role: string) => {
    if (!role) return "";
    return role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to messages">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="font-heading font-semibold text-sm">Chat Details</div>
      </div>

      {loading ? (
        <RoomDetailsSkeleton />
      ) : details ? (
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Header Info */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-24 h-24 border-2 border-border shadow-sm">
                {details.avatar_url ? (
                  <AvatarImage src={details.avatar_url} alt={details.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {details.name ? details.name[0]?.toUpperCase() : "C"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-xl">{details.name || (details.room_type === "direct" ? "Direct Message" : "Group Chat")}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                  <Users className="w-4 h-4" />
                  {details.room_type_display} • {details.participants?.length || 0} participants
                </p>
              </div>
            </div>

            {/* Participants List */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground border-b pb-2">Participants</h4>
              <div className="space-y-1">
                {details.participants?.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-xl transition-colors">
                    <Avatar className="w-11 h-11 border border-border">
                      {p.avatar_url ? (
                        <AvatarImage src={p.avatar_url} alt={p.full_name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                        {p.full_name ? p.full_name[0]?.toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                      {p.role && (
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {formatRole(p.role)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Could not load details.
        </div>
      )}
    </div>
  );
}
