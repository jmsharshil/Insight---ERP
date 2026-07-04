import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { ChatAction } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Users,
  ArrowLeft,
  Pencil,
  X,
  Search,
  Save,
  Check,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RoomDetailsSkeleton } from "@/components/common/Skeletons";

interface RoomDetailsProps {
  roomId: string;
  onBack: () => void;
}

export default function RoomDetails({ roomId, onBack }: RoomDetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const dispatch = useAppDispatch();

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  // We'll track the final selected user IDs here to make the UI simpler.
  // When saving, we'll calculate what was added and what was removed.
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // ── User list ─────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");

  // ── Fetch room details ────────────────────────────────────────────────────
  const fetchDetails = useCallback(() => {
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
        },
      });
    }
  }, [roomId, dispatch, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const formatRole = (role: string) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isGroup = details?.room_type === "group";

  // ── Enter edit mode ───────────────────────────────────────────────────────
  const handleStartEdit = () => {
    setEditName(details?.name || "");
    setSearch("");
    // Pre-fill selected users with current participants
    const currentIds = new Set((details?.participants || []).map((p: any) => p.id));
    setSelectedUserIds(currentIds);
    setIsEditing(true);

    // Fetch all users
    setLoadingUsers(true);
    dispatch({
      type: "GET_USERS",
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        setAllUsers(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        setLoadingUsers(false);
      },
      getError: () => {
        toast.error("Failed to load users");
        setLoadingUsers(false);
      },
    } as any);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
    setSearch("");
    setSelectedUserIds(new Set());
  };

  // ── Toggle user selection ─────────────────────────────────────────────────
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // ── Save edits ────────────────────────────────────────────────────────────
  const handleSave = () => {
    const body: any = {};
    let hasChanges = false;

    if (editName.trim() && editName.trim() !== details?.name) {
      body.name = editName.trim();
      hasChanges = true;
    }

    // Calculate additions and removals
    const originalIds = new Set((details?.participants || []).map((p: any) => p.id));
    
    const addedIds = Array.from(selectedUserIds).filter((id) => !originalIds.has(id));
    const removedIds = Array.from(originalIds).filter((id) => !selectedUserIds.has(id));

    if (addedIds.length > 0) {
      body.add_user_ids = addedIds;
      hasChanges = true;
    }
    if (removedIds.length > 0) {
      body.remove_user_ids = removedIds;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.error("No changes to save");
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    dispatch({
      type: ChatAction.UPDATE_GROUP,
      method: "PATCH",
      endPoint: `/api/v1/chat/rooms/${roomId}/update-group/`,
      auth: true,
      body,
      getResponse: () => {
        toast.success("Group updated successfully");
        setIsEditing(false);
        setIsSaving(false);
        fetchDetails();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update group");
        setIsSaving(false);
      },
    });
  };

  // ── Computed lists ────────────────────────────────────────────────────────
  const allParticipants = details?.participants || [];
  
  // For view mode
  const filteredParticipants = useMemo(() => {
    if (!search) return allParticipants;
    const lowerSearch = search.toLowerCase();
    return allParticipants.filter((p: any) =>
      (p.full_name || "").toLowerCase().includes(lowerSearch) ||
      (p.role || "").toLowerCase().includes(lowerSearch)
    );
  }, [allParticipants, search]);

  // For edit mode: combining existing participants and fetched users, avoiding duplicates
  const allAvailableUsers = useMemo(() => {
    const userMap = new Map();
    // Add existing participants first
    allParticipants.forEach((p: any) => {
      userMap.set(p.id, {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: p.role,
      });
    });
    // Overlay fetched users
    allUsers.forEach((u: any) => {
      userMap.set(u.id, {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: u.full_name || u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        avatar_url: u.avatar_url,
        role: u.role,
      });
    });
    return Array.from(userMap.values());
  }, [allParticipants, allUsers]);

  const { user } = useAuth();
  const isParent = user?.role === "parents";
  const allowedParentRoles = ["super_admin", "branch_manager", "admin_senior_executive"];

  const filteredUsers = useMemo(() => {
    let usersToFilter = allAvailableUsers;
    if (isParent) {
      usersToFilter = usersToFilter.filter((u: any) => allowedParentRoles.includes(u.role));
    }
    if (!search) return usersToFilter;
    const lowerSearch = search.toLowerCase();
    return usersToFilter.filter((u: any) =>
      (u.full_name || "").toLowerCase().includes(lowerSearch) ||
      (u.role || "").toLowerCase().includes(lowerSearch)
    );
  }, [allAvailableUsers, search, isParent]);

  // Selected users to display as pills at the top
  const selectedUsersList = useMemo(() => {
    return allAvailableUsers.filter((u) => selectedUserIds.has(u.id));
  }, [allAvailableUsers, selectedUserIds]);


  // ── Card Component (View & Edit Modes) ────────────────────────────────────
  const UserGridCard = ({ u, isEditMode }: { u: any; isEditMode?: boolean }) => {
    const isSelected = selectedUserIds.has(u.id);

    return (
      <div
        onClick={() => isEditMode && toggleUserSelection(u.id)}
        className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 overflow-hidden ${
          isEditMode ? "cursor-pointer" : ""
        } ${
          isEditMode && isSelected
            ? "bg-primary/10 border-primary/40 shadow-sm"
            : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/30"
        }`}
      >
        <Avatar className="w-10 h-10 border border-border/50 shrink-0 shadow-sm">
          {u.avatar_url ? (
            <AvatarImage src={u.avatar_url} alt={u.full_name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {u.full_name ? u.full_name[0]?.toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-semibold truncate text-foreground leading-tight mb-0.5">
            {u.full_name}
          </p>
          {u.role && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate font-medium">
              {formatRole(u.role)}
            </p>
          )}
        </div>
        
        {/* Checkbox for edit mode inside the card */}
        {isEditMode && (
          <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card/50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-border/60 bg-card flex items-center gap-2 shadow-sm z-10">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 hover:bg-muted/60"
          onClick={isEditing ? handleCancelEdit : onBack}
        >
          {isEditing ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </Button>
        <div className="font-heading font-semibold text-sm flex-1 truncate">
          {isEditing ? "Edit Group Details" : "Group Details"}
        </div>
        {isGroup && !isEditing && (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold shadow-sm"
            onClick={handleStartEdit}
          >
            <Pencil className="w-3 h-3" />
            Edit Group
          </Button>
        )}
        {isEditing && (
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold shadow-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {loading ? (
        <RoomDetailsSkeleton />
      ) : details ? (
        <ScrollArea className="flex-1">
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-6 space-y-6">
            
            {/* ── Top Section: Group Info ────────────────────────────────────── */}
            <div className="flex flex-col items-center space-y-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                {details.avatar_url ? (
                  <AvatarImage src={details.avatar_url} alt={details.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {details.name ? details.name[0]?.toUpperCase() : "G"}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div className="w-full max-w-xs space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-center block">
                    Group Name
                  </Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 text-center font-semibold text-base shadow-sm border-primary/20 focus-visible:ring-primary/30"
                    placeholder="Enter group name"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-2xl tracking-tight text-foreground">
                    {details.name || (details.room_type === "direct" ? "Direct Message" : "Group Chat")}
                  </h3>
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {details.room_type_display} • {allParticipants.length} members
                  </div>
                </div>
              )}
            </div>

            {/* ── Search Bar ─────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm p-3 rounded-2xl border border-border/50 shadow-sm flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={isEditing ? "Search users to add or remove..." : "Search members..."}
                  className="pl-9 h-10 text-sm bg-muted/30 border-transparent hover:border-border focus-visible:border-primary focus-visible:ring-primary/20 transition-all rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isEditing && (
                <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg whitespace-nowrap hidden sm:block">
                  {selectedUserIds.size} Selected
                </div>
              )}
            </div>

            {/* ── Selected Users Pills (Only in Edit Mode) ─────────────────── */}
            {isEditing && selectedUserIds.size > 0 && (
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Selected Members ({selectedUserIds.size})
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds(new Set())} className="h-6 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 px-2">
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <div className="flex w-max space-x-2">
                    {selectedUsersList.map((u) => (
                      <div key={u.id} className="flex items-center gap-1.5 bg-muted/50 border border-border/50 pl-1.5 pr-2 py-1 rounded-full text-sm shrink-0 hover:bg-muted/80 transition-colors">
                        <Avatar className="w-6 h-6 border border-border/50 shrink-0">
                          {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                          <AvatarFallback className="text-[10px] font-bold">{u.full_name ? u.full_name[0]?.toUpperCase() : "?"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs max-w-[100px] truncate">{u.full_name}</span>
                        <button
                          onClick={() => toggleUserSelection(u.id)}
                          className="ml-1 w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              </div>
            )}

            {/* ── Users Grid ─────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                {isEditing ? "All Users" : "Group Members"}
              </Label>

              {isEditing && loadingUsers ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm font-medium">Loading users...</p>
                </div>
              ) : (isEditing ? filteredUsers : filteredParticipants).length === 0 ? (
                <div className="py-12 text-center bg-card rounded-2xl border border-dashed border-border/60">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(isEditing ? filteredUsers : filteredParticipants).map((u: any) => (
                    <UserGridCard key={u.id} u={u} isEditMode={isEditing} />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Padding */}
            <div className="h-8" />
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground font-medium">
          Could not load details.
        </div>
      )}
    </div>
  );
}
