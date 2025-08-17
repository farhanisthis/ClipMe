import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";

interface RoomPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTag: string;
  onPasswordValid: (password: string) => void;
}

export default function RoomPasswordModal({
  isOpen,
  onClose,
  roomTag,
  onPasswordValid,
}: RoomPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const validatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest(
        "POST",
        `/api/rooms/${roomTag}/validate`,
        {
          password,
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast({
          title: "Access Granted",
          description: `Welcome to room ${roomTag}!`,
        });
        onPasswordValid(password);
        onClose();
        setPassword("");
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid room password. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to validate password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the room password",
        variant: "destructive",
      });
      return;
    }
    validatePasswordMutation.mutate(password);
  };

  const handleClose = () => {
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Protected Room
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg text-center text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Room {roomTag}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
              This room is password protected. Enter the password to continue.
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="room-password" className="text-sm font-medium">
                  Room Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="room-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter room password"
                    className="pr-10"
                    autoFocus
                    required
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

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={validatePasswordMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={validatePasswordMutation.isPending}
                >
                  {validatePasswordMutation.isPending
                    ? "Validating..."
                    : "Enter Room"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Privacy Notice:</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            This room requires authentication to protect your content. Your
            password is never stored in plain text.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
