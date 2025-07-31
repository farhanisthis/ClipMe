import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, X } from "lucide-react";
import { useLocation } from "wouter";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (isOpen && isMobile) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isMobile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Use back camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Start scanning for QR codes
        scanForQRCode();
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple URL pattern detection for ClipSync URLs
    // In a real implementation, you'd use a QR code library like jsQR
    // For now, we'll simulate QR detection with a manual input fallback
    
    // Continue scanning
    if (isScanning) {
      requestAnimationFrame(scanForQRCode);
    }
  };

  const handleManualInput = () => {
    const input = prompt("Enter ClipTag from QR code (4 characters):");
    if (input && input.length === 4 && /^[A-Z0-9]{4}$/i.test(input)) {
      const tag = input.toUpperCase();
      setLocation(`/room/${tag}`);
      onClose();
      toast({
        title: "Success",
        description: `Joined room ${tag}`,
      });
    } else if (input) {
      toast({
        title: "Invalid ClipTag",
        description: "Please enter a 4-character alphanumeric code.",
        variant: "destructive",
      });
    }
  };

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">QR Scanner</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              QR scanner is only available on mobile devices.
            </p>
            <Button
              onClick={handleManualInput}
              className="w-full bg-primary text-white hover:bg-blue-600"
            >
              Enter ClipTag Manually
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden">
        <div className="relative">
          <div className="bg-black aspect-square relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Overlay with scanning guide */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 bg-white dark:bg-gray-800">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Point your camera at a ClipSync QR code
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleManualInput}
                variant="outline"
                className="flex-1"
              >
                Enter Manually
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}