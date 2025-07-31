import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [manualTag, setManualTag] = useState(["", "", "", ""]);
  const [showManualInput, setShowManualInput] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (isOpen && isMobile) {
      startCamera();
    } else {
      stopCamera();
    }

    // Auto-focus first input when modal opens for non-mobile
    if (isOpen && !isMobile) {
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isMobile]);

  // Reset manual input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setManualTag(["", "", "", ""]);
      setShowManualInput(false);
    }
  }, [isOpen]);

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
    
    // Simple URL pattern detection for ClipMe URLs
    // In a real implementation, you'd use a QR code library like jsQR
    // For now, we'll simulate QR detection with a manual input fallback
    
    // Continue scanning
    if (isScanning) {
      requestAnimationFrame(scanForQRCode);
    }
  };

  const handleManualInputChange = (index: number, value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanValue.length <= 1) {
      const newManualTag = [...manualTag];
      newManualTag[index] = cleanValue;
      setManualTag(newManualTag);

      // Auto-focus next input if character entered
      if (cleanValue && index < 3) {
        inputRefs[index + 1].current?.focus();
      }

      // Auto-submit when all 4 characters are entered
      if (index === 3 && cleanValue && newManualTag.every(char => char !== "")) {
        const fullTag = newManualTag.join("");
        setLocation(`/room/${fullTag}`);
        onClose();
        toast({
          title: "Success",
          description: `Joined room ${fullTag}`,
        });
      }
    }
  };

  const handleManualKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !manualTag[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleManualPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    
    if (pastedText.length > 0) {
      const newManualTag = ["", "", "", ""];
      for (let i = 0; i < Math.min(pastedText.length, 4); i++) {
        newManualTag[i] = pastedText[i];
      }
      setManualTag(newManualTag);

      if (pastedText.length === 4) {
        setLocation(`/room/${pastedText}`);
        onClose();
        toast({
          title: "Success",
          description: `Joined room ${pastedText}`,
        });
      }
    }
  };

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm w-full p-6 bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center">Enter ClipTag</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              QR scanner is only available on mobile devices. Enter your ClipTag manually:
            </p>
            
            {/* Manual Input Boxes */}
            <div className="flex justify-center space-x-2 mb-4">
              {manualTag.map((char, index) => (
                <Input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  value={char}
                  onChange={(e) => handleManualInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleManualKeyDown(index, e)}
                  onPaste={index === 0 ? handleManualPaste : undefined}
                  placeholder="?"
                  maxLength={1}
                  className="w-12 h-12 text-xl font-mono font-bold uppercase text-center border-2 border-gray-300 dark:border-gray-600 focus:border-primary rounded-lg dark:bg-gray-700 dark:text-white"
                  autoComplete="off"
                />
              ))}
            </div>
            
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Enter 4 alphanumeric characters (A-Z, 0-9)
            </p>
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
                Point your camera at a ClipMe QR code
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowManualInput(!showManualInput)}
                variant="outline"
                className="flex-1 dark:border-gray-600 dark:text-gray-200"
              >
                {showManualInput ? 'Hide Manual' : 'Enter Manually'}
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
            
            {/* Manual Input Section for Mobile */}
            {showManualInput && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-center space-x-2 mb-3">
                  {manualTag.map((char, index) => (
                    <Input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      value={char}
                      onChange={(e) => handleManualInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleManualKeyDown(index, e)}
                      onPaste={index === 0 ? handleManualPaste : undefined}
                      placeholder="?"
                      maxLength={1}
                      className="w-10 h-10 text-lg font-mono font-bold uppercase text-center border border-gray-300 dark:border-gray-600 focus:border-primary rounded dark:bg-gray-700 dark:text-white"
                      autoComplete="off"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Enter 4 characters manually
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}