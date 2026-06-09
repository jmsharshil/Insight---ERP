import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { API } from "@/service/api";
import { Search, Camera } from "lucide-react";

interface CreateChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (room: any) => void;
}

export default function CreateChatModal({ open, onOpenChange, onSuccess }: CreateChatModalProps) {
  const [tab, setTab] = useState("direct");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
  
  const toast = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      dispatch({
        type: "GET_USERS",
        method: "GET",
        endPoint: API.USERS.LIST,
        auth: true,
        getResponse: (res: any) => {
          setUsers(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
          setLoadingUsers(false);
        },
        getError: (err: any) => {
          console.error("Error fetching users:", err);
          toast.error("Failed to load users");
          setLoadingUsers(false);
        }
      });
    } else {
      // Reset form on close
      setSelectedUser("");
      setGroupName("");
      setSelectedUsers([]);
      setSearch("");
      setTab("direct");
      setGroupAvatar(null);
      if (groupAvatarPreview) {
        URL.revokeObjectURL(groupAvatarPreview);
      }
      setGroupAvatarPreview(null);
    }
  }, [open, dispatch, toast]);

  const handleCreate = () => {
    if (tab === "direct") {
      if (!selectedUser) {
        toast.error("Please select a user");
        return;
      }
      dispatch({
        type: "CREATE_DIRECT_CHAT",
        method: "POST",
        endPoint: "/api/v1/chat/rooms/direct/",
        auth: true,
        body: {
          other_user_id: selectedUser
        },
        getResponse: (res: any) => {
          toast.success("Direct chat created");
          if (onSuccess) onSuccess(res?.data || res);
          onOpenChange(false);
        },
        getError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to create chat");
        }
      });
    } else {
      if (!groupName.trim()) {
        toast.error("Please enter a group name");
        return;
      }
      if (selectedUsers.length === 0) {
        toast.error("Please select at least one participant");
        return;
      }

      // If we have an avatar, we use FormData
      let body: any;
      if (groupAvatar) {
        body = new FormData();
        body.append("name", groupName.trim());
        body.append("avatar_url", groupAvatar);
        selectedUsers.forEach(id => {
          body.append("participant_ids", id);
        });
      } else {
        body = {
          name: groupName.trim(),
          participant_ids: selectedUsers
        };
      }

      dispatch({
        type: "CREATE_GROUP_CHAT",
        method: "POST",
        endPoint: "/api/v1/chat/rooms/group/",
        auth: true,
        body,
        getResponse: (res: any) => {
          toast.success("Group chat created");
          if (onSuccess) onSuccess(res?.data || res);
          onOpenChange(false);
        },
        getError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to create group chat");
        }
      });
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((u: any) => {
    const name = (u.first_name || u.name || u.email || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] p-0 overflow-hidden bg-card">
        <div className="p-6 pb-0 border-b border-border/50 bg-muted/20">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">New Conversation</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Start a direct message or create a group chat.</p>
          </DialogHeader>
          
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/50 p-1 mb-[-1px] rounded-t-xl rounded-b-none border border-b-0 border-border/50">
              <TabsTrigger value="direct" className="rounded-t-lg rounded-b-none data-[state=active]:bg-card">Direct Message</TabsTrigger>
              <TabsTrigger value="group" className="rounded-t-lg rounded-b-none data-[state=active]:bg-card">Group Chat</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6 bg-card">
          {tab === "group" ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Group Left Side */}
              <div className="md:col-span-2 space-y-6 flex flex-col pt-2">
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className="relative group cursor-pointer rounded-full overflow-hidden w-32 h-32 border-2 border-dashed border-border flex items-center justify-center bg-muted/30 transition-all hover:border-primary hover:bg-muted/50 shadow-sm"
                    onClick={() => document.getElementById('group-avatar-upload')?.click()}
                  >
                    {groupAvatarPreview ? (
                      <>
                        <img src={groupAvatarPreview} alt="Group preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </div>
                    )}
                  </div>
                  <input 
                    id="group-avatar-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGroupAvatar(file);
                        setGroupAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-center">Square image recommended.</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Group Name</Label>
                  <Input 
                    value={groupName} 
                    onChange={e => setGroupName(e.target.value)} 
                    placeholder="E.g. Study Group, Project Team..." 
                    className="h-11 bg-muted/20"
                  />
                </div>
              </div>
              
              {/* Group Right Side */}
              <div className="md:col-span-3 flex flex-col h-[400px]">
                <Label className="text-sm font-semibold mb-2">Select Participants</Label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-9 h-10 bg-muted/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto border border-border/50 rounded-xl p-2 space-y-1 bg-surface/30">
                  {loadingUsers ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No users found.</p>
                    </div>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <div 
                        key={u.id} 
                        className={`flex items-center space-x-3 p-2.5 hover:bg-muted/60 rounded-lg cursor-pointer transition-colors border border-transparent ${
                          selectedUsers.includes(u.id) ? "bg-primary/5 border-primary/20" : ""
                        }`}
                        onClick={() => toggleUser(u.id)}
                      >
                        <Checkbox 
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={() => toggleUser(u.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={selectedUsers.includes(u.id) ? "data-[state=checked]:bg-primary" : ""}
                        />
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                           <span className="text-sm font-semibold text-secondary-foreground">{u.first_name ? u.first_name[0].toUpperCase() : (u.name?.[0] || u.email?.[0] || "?").toUpperCase()}</span>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.name || u.email || "Unknown User"}
                          </span>
                          {u.role && (
                            <span className="text-xs text-muted-foreground capitalize truncate">
                              {u.role.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Direct Message Layout
            <div className="flex flex-col h-[400px]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search a user to start chatting..."
                  className="pl-9 h-11 bg-muted/20 text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto rounded-xl space-y-1 pr-2">
                {loadingUsers ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  </div>
                ) : (
                  filteredUsers.map((u: any) => (
                    <div 
                      key={u.id} 
                      className={`flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-xl cursor-pointer transition-all border ${
                        selectedUser === u.id ? "bg-primary/5 border-primary/30 shadow-sm" : "border-transparent"
                      }`}
                      onClick={() => setSelectedUser(u.id)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedUser === u.id ? "border-primary" : "border-muted-foreground/30"}`}>
                        {selectedUser === u.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/50">
                         <span className="font-semibold text-secondary-foreground">{u.first_name ? u.first_name[0].toUpperCase() : (u.name?.[0] || u.email?.[0] || "?").toUpperCase()}</span>
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate text-foreground">
                          {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.name || u.email || "Unknown User"}
                        </span>
                        {u.role && (
                          <span className="text-[11px] text-muted-foreground capitalize truncate mt-0.5 font-medium">
                            {u.role.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-6">Cancel</Button>
            <Button onClick={handleCreate} className="px-8 shadow-sm">
              Create {tab === "direct" ? "Chat" : "Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
