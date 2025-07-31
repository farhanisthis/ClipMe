import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import QRScanner from "@/components/qr-scanner";
import { ClipboardCopy, Smartphone, Shield, QrCode, Scan } from "lucide-react";

export default function Home() {
  const [clipTag, setClipTag] = useState("");
  const [, setLocation] = useLocation();
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clipTag.length === 4) {
      setLocation(`/room/${clipTag}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    setClipTag(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)]"></div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-pink-400/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <Logo size="md" showText={false} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            ClipMe
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Share clipboard text across devices using simple room codes</p>
        </div>

        {/* ClipTag Input Form */}
        <Card className="shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <Label htmlFor="cliptag" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Enter your ClipTag
              </Label>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  id="cliptag"
                  value={clipTag}
                  onChange={handleInputChange}
                  placeholder="A2D9"
                  maxLength={4}
                  className="flex-1 text-lg font-mono uppercase text-center tracking-widest dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
                <Button 
                  type="submit"
                  className="px-6 py-3 bg-primary text-white font-medium hover:bg-blue-600"
                  disabled={clipTag.length !== 4}
                >
                  Join Room
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Use 4 alphanumeric characters (e.g., A2D9, B7X3, M9K1)
              </p>
            </form>
            
            {/* QR Scanner Button for Mobile */}
            {isMobile && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQRScanner(true)}
                  className="w-full flex items-center justify-center space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Cross-Device</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Works on any device</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Secure</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">No account required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />
      </div>
    </div>
  );
}
