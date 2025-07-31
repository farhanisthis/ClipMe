import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ClipboardCopy, Edit3, Eye, RefreshCw, Download, Copy, QrCode, ClipboardPaste } from "lucide-react";
import QRModal from "@/components/qr-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

interface ClipboardData {
  content: string;
  updatedAt: string;
}

export default function Room() {
  const [, params] = useRoute("/room/:tag");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [senderText, setSenderText] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [contentHistory, setContentHistory] = useState<ClipboardData[]>([]);
  
  const tag = params?.tag?.toUpperCase() || "";

  // Fetch clipboard content
  const { data: clipboardData, isLoading: isFetching } = useQuery<ClipboardData>({
    queryKey: ["/api/clip", tag],
    enabled: false, // Only fetch when explicitly requested
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/clip/${tag}`, { content });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the clipboard data after sync
      queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      toast({
        title: "Success",
        description: "Text synchronized successfully!",
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
      }) as Promise<ClipboardData>;
    },
    onSuccess: (data: ClipboardData) => {
      // Add new content to history if it's different from the last one
      setContentHistory(prev => {
        const lastContent = prev[prev.length - 1];
        if (!lastContent || lastContent.content !== data.content) {
          return [...prev, data];
        }
        return prev;
      });
      toast({
        title: "Success",
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
        title: "Success",
        description: "Content copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
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
          title: "Pasted and Syncing",
          description: "Content pasted and syncing to room...",
        });
      } else {
        toast({
          title: "Nothing to paste",
          description: "Your clipboard is empty",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Could not read from clipboard. Please paste manually or check browser permissions.",
        variant: "destructive",
      });
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <Card className="w-full max-w-md mx-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid ClipTag</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">ClipTag must be 4 alphanumeric characters.</p>
              <Button onClick={() => setLocation("/")} className="bg-primary text-white">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.04),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.04),transparent_50%)]"></div>
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-4 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <Logo size="sm" showText={false} className="mb-0" />
              <div>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">ClipMe</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">ClipTag: <span className="font-mono font-medium">{tag}</span></p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => setShowQRModal(true)}
              className="flex items-center space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              <QrCode className="w-4 h-4" />
              <span className="font-medium">Show QR Code</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sender Window */}
          <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="bg-gray-50 dark:bg-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Edit3 className="w-5 h-5 mr-2 text-primary" />
                Sender Window
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Paste or type your text here</p>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                value={senderText}
                onChange={(e) => setSenderText(e.target.value)}
                placeholder="Paste your clipboard content here..."
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm leading-relaxed dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {senderText.length} characters
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePasteAndSync}
                    disabled={syncMutation.isPending}
                    variant="outline"
                    className="px-4 py-2 flex items-center space-x-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
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
                    className="px-6 py-2 bg-primary text-white font-medium hover:bg-blue-600 flex items-center space-x-2"
                  >
                    {syncMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Sync</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content History Window */}
          <div className="space-y-4">
            {/* Fetch Button */}
            <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-700">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Content History
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Fetched content will appear here</p>
              </CardHeader>
              <CardContent className="p-6">
                <Button
                  onClick={handleFetch}
                  disabled={fetchMutation.isPending}
                  className="w-full px-6 py-3 bg-green-600 text-white font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  {fetchMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Fetch Latest Content</span>
                </Button>
              </CardContent>
            </Card>

            {/* Content History */}
            {contentHistory.length === 0 ? (
              <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    No content fetched yet. Click "Fetch Latest Content" to retrieve clipboard content.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {contentHistory.map((item, index) => (
                  <Card key={`${item.updatedAt}-${index}`} className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                          {item.content}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Fetched: {formatRelativeTime(item.updatedAt)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(item.content)}
                            className="px-3 py-1 flex items-center space-x-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
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
      </main>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        clipTag={tag}
      />
    </div>
  );
}
