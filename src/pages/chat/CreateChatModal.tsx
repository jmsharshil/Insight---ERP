import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { API } from "@/service/api";
import { Search } from "lucide-react";

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
  
  const toast = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      dispatch({
        type: "GET_USERS", // Using generic dispatch convention from codebase
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
      dispatch({
        type: "CREATE_GROUP_CHAT",
        method: "POST",
        endPoint: "/api/v1/chat/rooms/group/",
        auth: true,
        body: {
          name: groupName.trim(),
          participant_ids: selectedUsers
        },
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
            <TabsTrigger value="group">Group Chat</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {tab === "group" && (
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input 
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)} 
                  placeholder="E.g. Study Group" 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{tab === "direct" ? "Select User" : "Select Participants"}</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto border rounded-md p-2 space-y-1">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">No users found.</p>
                ) : (
                  filteredUsers.map((u: any) => (
                    <div 
                      key={u.id} 
                      className={`flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors ${
                        (tab === "direct" && selectedUser === u.id) || 
                        (tab === "group" && selectedUsers.includes(u.id)) ? "bg-muted/50" : ""
                      }`}
                      onClick={() => tab === "direct" ? setSelectedUser(u.id) : toggleUser(u.id)}
                    >
                      {tab === "direct" ? (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedUser === u.id ? "border-primary" : "border-muted-foreground"}`}>
                          {selectedUser === u.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      ) : (
                        <Checkbox 
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={() => toggleUser(u.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-medium">
                          {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.name || u.email || "Unknown User"}
                        </span>
                        {u.role && (
                          <span className="text-xs text-muted-foreground capitalize">
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
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create {tab === "direct" ? "Chat" : "Group"}</Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
