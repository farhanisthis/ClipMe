import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Tabs import
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  ClipboardCopy,
  Edit3,
  Eye,
  RefreshCw,
  Download,
  Copy,
  QrCode,
  ClipboardPaste,
  Shield,
  Clock,
  Trash2,
  X,
  FileText,
  Users,
  Wifi,
  WifiOff,
  Lock,
  User,
  Crown,
} from "lucide-react";
import QRModal from "@/components/qr-modal";
import RoomPasswordModal from "@/components/room-password-modal";
import EnhancedFileUpload from "@/components/enhanced-file-upload";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

interface ClipboardData {
  content: string;
  updatedAt: string;
  expiresIn?: {
    minutesRemaining: number;
    expiresAt: string;
  };
}

export default function Room() {
  const [, params] = useRoute("/room/:tag");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [senderText, setSenderText] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const [contentHistory, setContentHistory] = useState<ClipboardData[]>([]);
  const [showFileSharing, setShowFileSharing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tag = params?.tag?.toUpperCase() || "";

  // Add WebSocket connection
  const { isConnected, userCount, lastMessage } = useWebSocket(tag);

  // Helper function to create headers with room password
  const getRequestHeaders = () => {
    const headers: Record<string, string> = {};
    if (roomPassword) {
      headers["x-room-password"] = roomPassword;
    }
    return headers;
  };

  // Check if room requires password and fetch initial content
  useEffect(() => {
    const checkRoomAccess = async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/rooms/${tag}`,
          undefined
        );
        const roomData = await response.json();

        if (roomData.room.requiresPassword && !roomPassword) {
          setShowPasswordModal(true);
        } else {
          // Auto-fetch clipboard content when room is accessible
          queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
        }
      } catch (error: any) {
        // Room might not exist yet, that's okay
        console.log("Room check:", error.message);
        // Still try to fetch clipboard content for new rooms
        queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      }
    };

    if (tag) {
      checkRoomAccess();
    }
  }, [tag, roomPassword, queryClient]);

  const handlePasswordValid = (password: string) => {
    setRoomPassword(password);
    setShowPasswordModal(false);
  };

  // Fetch clipboard content
  const { data: clipboardData, isLoading: isFetching } =
    useQuery<ClipboardData>({
      queryKey: ["/api/clip", tag],
      enabled: !!tag, // Enable when tag is available
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          `/api/clip/${tag}`,
          undefined,
          getRequestHeaders()
        );
        return response.json();
      },
    });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(
        "POST",
        `/api/clip/${tag}`,
        {
          content,
        },
        getRequestHeaders()
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Clear the input field after successful sync
      setSenderText("");

      // Focus the textarea for immediate next input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);

      // Add the synced content to local history immediately
      const syncedContent: ClipboardData = {
        content: variables, // The content that was synced
        updatedAt: new Date().toISOString(),
        expiresIn: {
          minutesRemaining: 15,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      };

      // Add to history if it's different from the last one
      setContentHistory((prev) => {
        const lastContent = prev[prev.length - 1];
        if (!lastContent || lastContent.content !== syncedContent.content) {
          return [...prev, syncedContent];
        }
        return prev;
      });

      // Invalidate queries for consistency
      queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      toast({
        description: "Content synchronized!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch mutation
  const fetchMutation = useMutation({
    mutationFn: async (): Promise<ClipboardData> => {
      // Invalidate first to clear any stale cache, then fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      return queryClient.fetchQuery({
        queryKey: ["/api/clip", tag],
        queryFn: async () => {
          const response = await apiRequest(
            "GET",
            `/api/clip/${tag}`,
            undefined,
            getRequestHeaders()
          );
          return response.json();
        },
      }) as Promise<ClipboardData>;
    },
    onSuccess: (data: ClipboardData) => {
      // Add new content to history if it's different from the last one
      setContentHistory((prev) => {
        const lastContent = prev[prev.length - 1];
        if (!lastContent || lastContent.content !== data.content) {
          return [...prev, data];
        }
        return prev;
      });
      toast({
        description: "Content fetched successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch content.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiRequest(
        "DELETE",
        `/api/clip/${tag}`,
        undefined,
        getRequestHeaders()
      );
    },
    onSuccess: () => {
      // Clear local content history and invalidate queries
      setContentHistory([]);
      queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      toast({
        description: "All content permanently deleted from server",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete content from server.",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    if (senderText.trim()) {
      syncMutation.mutate(senderText);
    }
  };

  const handleFetch = () => {
    fetchMutation.mutate();
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        description: "Copied to clipboard!",
      });
    } catch (error) {
      toast({
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handlePasteAndSync = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setSenderText(text);
        // Auto-sync the pasted content
        syncMutation.mutate(text);
        toast({
          description: "Content pasted and syncing...",
        });
      } else {
        toast({
          description: "Your clipboard is empty",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        description: "Could not read from clipboard. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  // Delete individual content item (local only)
  const handleDeleteItem = (index: number) => {
    setContentHistory((prev) => prev.filter((_, i) => i !== index));
    toast({
      description: "Content item removed from local history",
    });
  };

  // Delete all content history and server content
  const handleDeleteAll = () => {
    deleteMutation.mutate();
  };

  // React to WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "clipboardUpdate":
          // Auto-fetch new content when someone else updates it
          if (lastMessage.content && lastMessage.updatedAt) {
            const newContent: ClipboardData = {
              content: lastMessage.content,
              updatedAt: lastMessage.updatedAt,
              expiresIn: {
                minutesRemaining: 15,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              },
            };

            // Add to history if it's different from the last one
            setContentHistory((prev) => {
              const lastContent = prev[prev.length - 1];
              if (!lastContent || lastContent.content !== newContent.content) {
                return [...prev, newContent];
              }
              return prev;
            });
          }
          break;
      }
    }
  }, [lastMessage]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <Card className="w-full max-w-md mx-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Invalid ClipTag
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ClipTag must be 4 alphanumeric characters.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="bg-primary text-white"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden theme-transition">
      {/* Enhanced Animated Background with better dark blue tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.08),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.06),transparent_50%)]"></div>
      {/* Enhanced Header with better dark blue tones */}
      <header className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-blue-800/30 px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <Logo size="sm" showText={false} className="mb-0 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                  ClipMe
                </h1>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Room:
                  </span>
                  <button
                    onClick={() => handleCopyToClipboard(tag)}
                    className="group flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-blue-800/40 dark:to-indigo-800/40 px-2 py-1 rounded-lg hover:from-indigo-200 hover:to-purple-200 dark:hover:from-blue-700/50 dark:hover:to-indigo-700/50 transition-all duration-200"
                  >
                    <span className="font-mono font-bold text-sm sm:text-base text-indigo-700 dark:text-indigo-300">
                      {tag}
                    </span>
                    <Copy className="w-3 h-3 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Connection Status */}
            <div className="flex items-center gap-1 text-xs bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Users className="w-3 h-3" />
                <span>{userCount || 0}</span>
              </div>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.username}
                </span>
              </div>
            )}
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => setShowQRModal(true)}
              className="flex items-center space-x-1 sm:space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
            >
              <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium hidden sm:inline">Show QR Code</span>
              <span className="font-medium sm:hidden">QR</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content with mobile optimization */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Privacy Notice Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-300">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Persistent Storage:</span>
            <span>
              All content is stored persistently and will remain until manually
              deleted
            </span>
          </div>
        </div>

        <div className="w-full">
          <div className="flex justify-center mb-6 gap-4">
            <button
              className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                !showFileSharing
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
              onClick={() => setShowFileSharing(false)}
            >
              <Edit3 className="w-4 h-4" /> Text Sharing
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                showFileSharing
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
              onClick={() => setShowFileSharing(true)}
            >
              <FileText className="w-4 h-4" /> File Sharing
            </button>
          </div>

          {!showFileSharing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Premium Sender Window */}
              <Card className="shadow-2xl border-0 glass dark:glass-dark hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 order-1 lg:order-1 rounded-3xl animate-fadeIn">
                <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-slate-200/50 dark:border-blue-700/30 rounded-t-3xl">
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                      <Edit3 className="w-4 h-4 text-white" />
                    </div>
                    <span>Sender Window</span>
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    Paste or type your text here
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={senderText}
                      onChange={(e) => setSenderText(e.target.value)}
                      placeholder="Paste your clipboard content here..."
                      className="w-full h-52 sm:h-60 lg:h-72 p-4 sm:p-6 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 resize-none text-sm sm:text-base leading-relaxed glass dark:glass-dark dark:text-white dark:placeholder-slate-400 transition-all duration-300 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-lg font-medium"
                    />
                    <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-500 dark:text-blue-200 bg-white/80 dark:bg-blue-800/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                      {senderText.length} chars
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 gap-4 sm:gap-0">
                    <div className="text-sm text-slate-600 dark:text-blue-200 flex items-center gap-2 font-medium">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      Ready to sync
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={handlePasteAndSync}
                        disabled={syncMutation.isPending}
                        variant="outline"
                        className="w-full sm:w-auto px-4 py-3 flex items-center justify-center space-x-2 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold rounded-xl"
                      >
                        {syncMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ClipboardPaste className="w-4 h-4" />
                        )}
                        <span>Paste & Sync</span>
                      </Button>
                      <Button
                        onClick={handleSync}
                        disabled={!senderText.trim() || syncMutation.isPending}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-xl"
                      >
                        {syncMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>Sync Now</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Content History Window */}
              <div className="space-y-3 sm:space-y-4 order-2 lg:order-2">
                {/* Fetch Button */}
                <Card
                  className="shadow-2xl border-0 glass dark:glass-dark hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 rounded-3xl animate-fadeIn"
                  style={{ animationDelay: "0.2s" }}
                >
                  <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-blue-900/30 dark:to-teal-900/20 border-b border-slate-200/50 dark:border-blue-700/30 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <span>Content History</span>
                      </CardTitle>
                      {contentHistory.length > 0 && (
                        <Button
                          onClick={handleDeleteAll}
                          disabled={deleteMutation.isPending}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title="Permanently delete all content from server and history"
                        >
                          {deleteMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">
                            {deleteMutation.isPending
                              ? "Deleting..."
                              : "Delete All"}
                          </span>
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                      Fetched content will appear here. Individual items can be
                      removed locally, "Delete All" removes from server
                      permanently.
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <Button
                      onClick={handleFetch}
                      disabled={fetchMutation.isPending}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-xl text-base rounded-2xl"
                    >
                      {fetchMutation.isPending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      <span>Fetch Latest Content</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Enhanced Content History */}
                {contentHistory.length === 0 ? (
                  <Card className="shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Eye className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm sm:text-base">
                          No content fetched yet.
                        </p>
                        <p className="text-xs sm:text-sm mt-1">
                          Click "Fetch Latest Content" to retrieve clipboard
                          content.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {contentHistory.map((item, index) => (
                      <Card
                        key={`${item.updatedAt}-${index}`}
                        className="shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-3">
                            <div
                              onClick={() =>
                                handleCopyToClipboard(item.content)
                              }
                              className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-gray-900 dark:text-gray-100 max-h-32 sm:max-h-40 overflow-y-auto whitespace-pre-wrap break-words cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group relative"
                              title="Click to copy content"
                            >
                              {item.content}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Copy className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                  Fetched: {formatRelativeTime(item.updatedAt)}
                                </div>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(index);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1 h-auto"
                                title="Remove from local history (will reappear if you fetch again)"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showFileSharing && (
            <EnhancedFileUpload
              tag={tag}
              roomPassword={roomPassword}
              isConnected={isConnected}
              userCount={userCount}
              lastMessage={lastMessage}
            />
          )}
        </div>
      </main>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        clipTag={tag}
      />

      {/* Room Password Modal */}
      <RoomPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        roomTag={tag}
        onPasswordValid={handlePasswordValid}
      />
    </div>
  );
}
