import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { X, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipTag: string;
}

export default function QRModal({ isOpen, onClose, clipTag }: QRModalProps) {
  const { toast } = useToast();
  
  // Get the current domain from environment or window location
  const domain = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
  
  const roomUrl = `${domain}/room/${clipTag}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Success",
        description: "Room URL copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full p-6">
        <DialogHeader className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl font-semibold text-gray-900">Share Room</DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <div className="flex justify-center">
              <QRCodeSVG
                value={roomUrl}
                size={128}
                level="M"
                includeMargin={true}
                className="border-2 border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Scan this QR code to open the same room on another device
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Room URL:</p>
              <code className="text-sm font-mono text-gray-800 break-all">
                {roomUrl}
              </code>
            </div>
            <Button
              onClick={handleCopyUrl}
              className="w-full px-4 py-2 bg-primary text-white font-medium hover:bg-blue-600 flex items-center justify-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Room URL</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
