import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  PlusCircle,
  Lock,
  Users,
  Clock,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomTag: string) => void;
  currentUser?: { id: string; username: string } | null;
}

interface RoomData {
  tag: string;
  password: string;
  isLocked: boolean;
  maxUsers: number;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  currentUser,
}: CreateRoomModalProps) {
  const [formData, setFormData] = useState<RoomData>({
    tag: "",
    password: "",
    isLocked: false,
    maxUsers: 10,
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomData) => {
      const response = await apiRequest("POST", "/api/rooms", {
        tag: data.tag.toUpperCase(),
        password: data.isLocked ? data.password : undefined,
        isLocked: data.isLocked,
        maxUsers: data.maxUsers,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Room Created!",
        description: `Room ${data.room.tag} has been created successfully.`,
      });
      onRoomCreated(data.room.tag);
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Room",
        description: error.message || "Room tag might already exist",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tag: "",
      password: "",
      isLocked: false,
      maxUsers: 10,
    });
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tag.trim()) {
      toast({
        title: "Room Tag Required",
        description: "Please enter a 4-character room tag",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.tag.length !== 4 ||
      !/^[A-Z0-9]{4}$/.test(formData.tag.toUpperCase())
    ) {
      toast({
        title: "Invalid Room Tag",
        description:
          "Room tag must be exactly 4 alphanumeric characters (A-Z, 0-9)",
        variant: "destructive",
      });
      return;
    }

    if (formData.isLocked && !formData.password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter a password for the locked room",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateRandomTag = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, tag: result });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center flex items-center justify-center gap-2">
            <PlusCircle className="w-5 h-5 text-green-500" />
            Create New Room
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg text-center text-gray-700 dark:text-gray-300">
              Room Configuration
            </CardTitle>
            {currentUser && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Creating as:{" "}
                <span className="font-medium">{currentUser.username}</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room Tag */}
              <div>
                <Label htmlFor="room-tag" className="text-sm font-medium">
                  Room Tag (4 characters)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="room-tag"
                    type="text"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tag: e.target.value.toUpperCase().slice(0, 4),
                      })
                    }
                    placeholder="ABCD"
                    className="uppercase font-mono text-center"
                    maxLength={4}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomTag}
                    className="px-3"
                  >
                    Random
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Letters A-Z and numbers 0-9 only
                </p>
              </div>

              <Separator />

              {/* Room Security */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <Label
                      htmlFor="room-locked"
                      className="text-sm font-medium"
                    >
                      Password Protection
                    </Label>
                  </div>
                  <Switch
                    id="room-locked"
                    checked={formData.isLocked}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isLocked: checked,
                        password: checked ? formData.password : "",
                      })
                    }
                  />
                </div>

                {formData.isLocked && (
                  <div>
                    <Label
                      htmlFor="room-password"
                      className="text-sm font-medium"
                    >
                      Room Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="room-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Enter room password"
                        className="pr-10"
                        required={formData.isLocked}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Max Users */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="max-users" className="text-sm font-medium">
                    Maximum Users
                  </Label>
                </div>
                <Input
                  id="max-users"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUsers: Math.max(
                        1,
                        Math.min(50, parseInt(e.target.value) || 10)
                      ),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Between 1 and 50 users
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={createRoomMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Room Features:</span>
          </div>
          <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
            <li>• Real-time content synchronization</li>
            <li>• File sharing and management</li>
            <li>• Auto-deletion for privacy (15 min text, 10 min files)</li>
            {formData.isLocked && (
              <li>• Password protection for secure access</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
