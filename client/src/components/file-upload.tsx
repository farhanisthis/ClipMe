import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Upload,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Clock,
  Shield,
  X,
} from "lucide-react";

interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimetype: string;
  uploadedAt: string;
  minutesRemaining: number;
  expiresAt: string;
}

interface FileUploadProps {
  tag: string;
}

export default function FileUpload({ tag }: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Query for file metadata
  const { data: fileData, isLoading: isLoadingFile } = useQuery<FileMetadata>({
    queryKey: ["/api/file", tag],
    enabled: false, // Only fetch when explicitly requested
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload/${tag}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        description: "File uploaded successfully! Auto-deletes in 10 minutes for privacy.",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Invalidate file query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/file", tag] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check file mutation
  const checkFileMutation = useMutation({
    mutationFn: async (): Promise<FileMetadata> => {
      queryClient.invalidateQueries({ queryKey: ["/api/file", tag] });
      return queryClient.fetchQuery({
        queryKey: ["/api/file", tag],
      }) as Promise<FileMetadata>;
    },
    onSuccess: () => {
      toast({
        description: "File information updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No file found for this room.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${tag}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Download failed");
      }

      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "download";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else if (fileData) {
        filename = fileData.fileName;
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        description: `Downloaded ${filename} successfully!`,
      });
    } catch (error) {
      toast({
        title: "Download Error",
        description: error instanceof Error ? error.message : "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <Card className="shadow-2xl border-0 glass dark:glass-dark hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 rounded-3xl animate-fadeIn">
        <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-slate-200/50 dark:border-blue-700/30 rounded-t-3xl">
          <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <span>File Upload</span>
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Upload files up to 50MB - auto-deletes in 10 minutes for privacy
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
            } ${uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              disabled={uploadMutation.isPending}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-blue-800/40 dark:to-indigo-800/40 rounded-full flex items-center justify-center">
                {uploadMutation.isPending ? (
                  <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {uploadMutation.isPending ? "Uploading..." : "Drop your file here"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Or click to browse and select a file
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maximum file size: 50MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Check Section */}
      <Card className="shadow-2xl border-0 glass dark:glass-dark hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 rounded-3xl animate-fadeIn">
        <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-blue-900/30 dark:to-teal-900/20 border-b border-slate-200/50 dark:border-blue-700/30 rounded-t-3xl">
          <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span>File Manager</span>
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Check for available files and download them
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          {!fileData ? (
            <div className="text-center">
              <Button
                onClick={() => checkFileMutation.mutate()}
                disabled={checkFileMutation.isPending}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-xl text-base rounded-2xl"
              >
                {checkFileMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span>Check for Files</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {fileData.fileName}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {formatFileSize(fileData.fileSize)} • {fileData.mimetype}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      queryClient.setQueryData(["/api/file", tag], null);
                      toast({
                        description: "File info cleared from local view",
                      });
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Uploaded: {formatRelativeTime(fileData.uploadedAt)}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <Shield className="w-3 h-3" />
                    Auto-deletes in {fileData.minutesRemaining} min
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
