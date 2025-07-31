import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ClipboardCopy, Edit3, Eye, RefreshCw, Download, Copy, QrCode } from "lucide-react";
import QRModal from "@/components/qr-modal";

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
    mutationFn: async () => {
      // Invalidate first to clear any stale cache, then fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/clip", tag] });
      return queryClient.fetchQuery({
        queryKey: ["/api/clip", tag],
      });
    },
    onSuccess: () => {
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

  const handleCopyToClipboard = async () => {
    if (clipboardData?.content) {
      try {
        await navigator.clipboard.writeText(clipboardData.content);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid ClipTag</h1>
              <p className="text-gray-600 mb-6">ClipTag must be 4 alphanumeric characters.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ClipboardCopy className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">ClipSync</h1>
                <p className="text-sm text-gray-600">ClipTag: <span className="font-mono font-medium">{tag}</span></p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowQRModal(true)}
            className="flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span className="font-medium">Show QR Code</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sender Window */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Edit3 className="w-5 h-5 mr-2 text-primary" />
                Sender Window
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Paste or type your text here</p>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                value={senderText}
                onChange={(e) => setSenderText(e.target.value)}
                placeholder="Paste your clipboard content here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {senderText.length} characters
                </div>
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
            </CardContent>
          </Card>

          {/* Receiver Window */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-green-600" />
                Receiver Window
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Latest content from the server</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm leading-relaxed text-gray-700 overflow-y-auto">
                {clipboardData?.content || "No content available. Click 'Fetch' to retrieve the latest clipboard content."}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {clipboardData?.updatedAt && (
                    <>Last updated: {formatRelativeTime(clipboardData.updatedAt)}</>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={!clipboardData?.content}
                    className="px-4 py-2 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    onClick={handleFetch}
                    disabled={fetchMutation.isPending}
                    className="px-6 py-2 bg-green-600 text-white font-medium hover:bg-green-700 flex items-center space-x-2"
                  >
                    {fetchMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Fetch</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
