import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
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
  CheckCircle,
  Users,
  Wifi,
  WifiOff,
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

interface FilesResponse {
  files: FileMetadata[];
  totalFiles: number;
  totalSize: number;
}

interface DownloadProgress {
  isDownloading: boolean;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  timeRemaining: number;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  speed: number;
  timeRemaining: number;
}

interface FileUploadProps {
  tag: string;
}

export default function FileUpload({ tag }: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { isConnected, userCount, lastMessage } = useWebSocket(tag);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    isDownloading: false,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    timeRemaining: 0,
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    timeRemaining: 0,
  });

  // Query for multiple files
  const { data: filesData, isLoading: isLoadingFiles } =
    useQuery<FilesResponse>({
      queryKey: ["/api/files", tag],
      enabled: false, // Only fetch when explicitly requested
    });

  // Get the first file for backwards compatibility
  const fileData = filesData?.files?.[0];

  // React to WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "fileUpload":
        case "fileDelete":
          // Invalidate files query to refresh the list
          queryClient.invalidateQueries({ queryKey: ["/api/files", tag] });
          break;
      }
    }
  }, [lastMessage, tag]);

  // Upload mutation with progress tracking
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<any>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastTime = startTime;
        let lastLoaded = 0;

        // Initialize upload progress
        setUploadProgress({
          isUploading: true,
          progress: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          speed: 0,
          timeRemaining: 0,
        });

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // seconds
            const loadedDiff = e.loaded - lastLoaded;

            // Calculate speed every 100ms to smooth out fluctuations
            if (timeDiff >= 0.1) {
              const currentSpeed = loadedDiff / timeDiff; // bytes per second
              const progress = (e.loaded / e.total) * 100;
              const timeRemaining =
                currentSpeed > 0 ? (e.total - e.loaded) / currentSpeed : 0;

              setUploadProgress({
                isUploading: true,
                progress,
                uploadedBytes: e.loaded,
                totalBytes: e.total,
                speed: currentSpeed,
                timeRemaining,
              });

              lastTime = currentTime;
              lastLoaded = e.loaded;
            }
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Complete the upload
            setUploadProgress((prev) => ({
              ...prev,
              progress: 100,
              uploadedBytes: prev.totalBytes,
              isUploading: false,
            }));

            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Invalid response format"));
            }
          } else {
            setUploadProgress({
              isUploading: false,
              progress: 0,
              uploadedBytes: 0,
              totalBytes: 0,
              speed: 0,
              timeRemaining: 0,
            });

            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || "Upload failed"));
            } catch (parseError) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          setUploadProgress({
            isUploading: false,
            progress: 0,
            uploadedBytes: 0,
            totalBytes: 0,
            speed: 0,
            timeRemaining: 0,
          });
          reject(new Error("Network error during upload"));
        };

        xhr.open("POST", `/api/upload/${tag}`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast({
        description: "File uploaded successfully!",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Invalidate files query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/files", tag] });

      // Reset upload progress after a delay
      setTimeout(() => {
        setUploadProgress({
          isUploading: false,
          progress: 0,
          uploadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          timeRemaining: 0,
        });
      }, 3000);
    },
    onError: (error: Error) => {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        timeRemaining: 0,
      });

      toast({
        title: "Upload Error",
        description:
          error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check files mutation
  const checkFileMutation = useMutation({
    mutationFn: async (): Promise<FilesResponse> => {
      queryClient.invalidateQueries({ queryKey: ["/api/files", tag] });
      return queryClient.fetchQuery({
        queryKey: ["/api/files", tag],
      }) as Promise<FilesResponse>;
    },
    onSuccess: () => {
      toast({
        description: "Files information updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No files found for this room.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (uploadProgress.isUploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the current upload to complete.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 1GB.",
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
    if (!fileData) return;

    try {
      setDownloadProgress({
        isDownloading: true,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: fileData.fileSize,
        speed: 0,
        timeRemaining: 0,
      });

      const response = await fetch(`/api/download/${tag}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Download failed");
      }

      if (!response.body) {
        throw new Error("Response body is not available");
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

      const totalBytes = fileData.fileSize;
      let downloadedBytes = 0;
      const chunks: Uint8Array[] = [];

      const reader = response.body.getReader();
      const startTime = Date.now();
      let lastTime = startTime;
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;

        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // seconds
        const bytesDiff = downloadedBytes - lastBytes;

        // Calculate speed every 100ms to smooth out fluctuations
        if (timeDiff >= 0.1) {
          const currentSpeed = bytesDiff / timeDiff; // bytes per second
          const progress = (downloadedBytes / totalBytes) * 100;
          const timeRemaining =
            currentSpeed > 0
              ? (totalBytes - downloadedBytes) / currentSpeed
              : 0;

          setDownloadProgress({
            isDownloading: true,
            progress,
            downloadedBytes,
            totalBytes,
            speed: currentSpeed,
            timeRemaining,
          });

          lastTime = currentTime;
          lastBytes = downloadedBytes;
        }
      }

      // Complete the download
      setDownloadProgress((prev) => ({
        ...prev,
        progress: 100,
        downloadedBytes: totalBytes,
        isDownloading: false,
      }));

      // Create blob and download
      const blob = new Blob(chunks.map((chunk) => new Uint8Array(chunk)));
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

      // Reset progress after a delay
      setTimeout(() => {
        setDownloadProgress({
          isDownloading: false,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          timeRemaining: 0,
        });
      }, 3000);
    } catch (error) {
      setDownloadProgress({
        isDownloading: false,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        timeRemaining: 0,
      });

      toast({
        title: "Download Error",
        description:
          error instanceof Error ? error.message : "Failed to download file.",
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

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return (
      parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
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
            Upload files up to 1GB - stored persistently
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
            } ${
              uploadProgress.isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              disabled={uploadProgress.isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-blue-800/40 dark:to-indigo-800/40 rounded-full flex items-center justify-center">
                {uploadProgress.isUploading ? (
                  <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : uploadProgress.progress === 100 ? (
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {uploadProgress.isUploading
                  ? `Uploading... ${uploadProgress.progress.toFixed(1)}%`
                  : uploadProgress.progress === 100
                  ? "Upload Complete!"
                  : "Drop your file here"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {uploadProgress.isUploading
                  ? `${formatFileSize(
                      uploadProgress.uploadedBytes
                    )} / ${formatFileSize(uploadProgress.totalBytes)}`
                  : "Or click to browse and select a file"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maximum file size: 1GB
              </p>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress.isUploading && (
              <div className="mt-6 space-y-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                    Uploading...
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {uploadProgress.progress.toFixed(1)}%
                  </span>
                </div>

                <Progress
                  value={uploadProgress.progress}
                  className="h-2 bg-indigo-100 dark:bg-indigo-800/30"
                />

                <div className="grid grid-cols-2 gap-4 text-xs text-indigo-600 dark:text-indigo-400">
                  <div>
                    <span className="text-indigo-500 dark:text-indigo-300">
                      Uploaded:
                    </span>
                    <br />
                    <span className="font-mono">
                      {formatFileSize(uploadProgress.uploadedBytes)} /{" "}
                      {formatFileSize(uploadProgress.totalBytes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-500 dark:text-indigo-300">
                      Speed:
                    </span>
                    <br />
                    <span className="font-mono">
                      {formatSpeed(uploadProgress.speed)}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-500 dark:text-indigo-300">
                      Time remaining:
                    </span>
                    <br />
                    <span className="font-mono">
                      {formatTime(uploadProgress.timeRemaining)}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-500 dark:text-indigo-300">
                      File size:
                    </span>
                    <br />
                    <span className="font-mono">
                      {formatFileSize(uploadProgress.totalBytes)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Success indicator */}
            {!uploadProgress.isUploading && uploadProgress.progress === 100 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  Upload completed successfully!
                </span>
              </div>
            )}
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
                        {formatFileSize(fileData.fileSize)} •{" "}
                        {fileData.mimetype}
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
                </div>

                {/* Download Progress Bar */}
                {downloadProgress.isDownloading && (
                  <div className="space-y-3 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Downloading...
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {downloadProgress.progress.toFixed(1)}%
                      </span>
                    </div>

                    <Progress
                      value={downloadProgress.progress}
                      className="h-2 bg-blue-100 dark:bg-blue-800/30"
                    />

                    <div className="grid grid-cols-2 gap-4 text-xs text-blue-600 dark:text-blue-400">
                      <div>
                        <span className="text-blue-500 dark:text-blue-300">
                          Downloaded:
                        </span>
                        <br />
                        <span className="font-mono">
                          {formatFileSize(downloadProgress.downloadedBytes)} /{" "}
                          {formatFileSize(downloadProgress.totalBytes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-500 dark:text-blue-300">
                          Speed:
                        </span>
                        <br />
                        <span className="font-mono">
                          {formatSpeed(downloadProgress.speed)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-500 dark:text-blue-300">
                          Time remaining:
                        </span>
                        <br />
                        <span className="font-mono">
                          {formatTime(downloadProgress.timeRemaining)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-500 dark:text-blue-300">
                          File size:
                        </span>
                        <br />
                        <span className="font-mono">
                          {formatFileSize(fileData.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success indicator */}
                {!downloadProgress.isDownloading &&
                  downloadProgress.progress === 100 && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Download completed successfully!
                      </span>
                    </div>
                  )}

                <Button
                  onClick={handleDownload}
                  disabled={downloadProgress.isDownloading}
                  className={`w-full font-semibold flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl ${
                    downloadProgress.isDownloading
                      ? "bg-blue-500 hover:bg-blue-500 cursor-not-allowed"
                      : downloadProgress.progress === 100
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  } text-white`}
                >
                  {downloadProgress.isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        Downloading... {downloadProgress.progress.toFixed(1)}%
                      </span>
                    </>
                  ) : downloadProgress.progress === 100 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Download Complete</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
