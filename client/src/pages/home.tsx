import { useState, useRef, useEffect } from "react";
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
  const [clipTag, setClipTag] = useState(["", "", "", ""]);
  const [, setLocation] = useLocation();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Auto-focus first input on component mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullTag = clipTag.join("");
    if (fullTag.length === 4) {
      setLocation(`/room/${fullTag}`);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanValue.length <= 1) {
      const newClipTag = [...clipTag];
      newClipTag[index] = cleanValue;
      setClipTag(newClipTag);

      // Auto-focus next input if character entered
      if (cleanValue && index < 3) {
        inputRefs[index + 1].current?.focus();
      }

      // Auto-submit when all 4 characters are entered
      if (index === 3 && cleanValue && newClipTag.every(char => char !== "")) {
        const fullTag = newClipTag.join("");
        setTimeout(() => setLocation(`/room/${fullTag}`), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !clipTag[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    
    if (pastedText.length > 0) {
      const newClipTag = ["", "", "", ""];
      for (let i = 0; i < Math.min(pastedText.length, 4); i++) {
        newClipTag[i] = pastedText[i];
      }
      setClipTag(newClipTag);

      // Focus the appropriate input
      const nextEmptyIndex = Math.min(pastedText.length, 3);
      inputRefs[nextEmptyIndex].current?.focus();

      // Auto-submit if 4 characters pasted
      if (pastedText.length === 4) {
        setTimeout(() => setLocation(`/room/${pastedText}`), 100);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.04),transparent_60%)]"></div>
      
      {/* Enhanced floating particles with different sizes and animations */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-pink-400/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-indigo-400/25 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-1/2 right-1/5 w-2.5 h-2.5 bg-cyan-400/15 rounded-full animate-ping" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }}></div>
      
      {/* Theme Toggle with enhanced styling */}
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full relative z-10 mx-auto">
        {/* Header Section with enhanced animations */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Logo size="md" showText={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-3 sm:mb-4 animate-pulse">
            ClipMe
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed px-2">
            Share clipboard text across devices using simple room codes
          </p>
        </div>

        {/* ClipTag Input Form with enhanced mobile design */}
        <Card className="shadow-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit}>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 text-center">
                Enter your 4-character ClipTag
              </Label>
              
              {/* 4-Character Input Boxes with enhanced mobile design */}
              <div className="flex justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                {clipTag.map((char, index) => (
                  <Input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    value={char}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    placeholder="?"
                    maxLength={1}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl font-mono font-bold uppercase text-center border-2 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl shadow-md dark:bg-gray-700 dark:text-white transition-all duration-300 hover:shadow-lg focus:shadow-xl hover:scale-105 focus:scale-105 active:scale-95"
                    autoComplete="off"
                    inputMode="text"
                  />
                ))}
              </div>

              <div className="text-center mb-4 sm:mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Enter 4 alphanumeric characters (A-Z, 0-9)
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Auto-joins room when complete
                </p>
              </div>

              {/* Manual Submit Button (hidden when all filled) */}
              {clipTag.some(char => char === "") && (
                <Button 
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white font-medium hover:bg-blue-600 transition-all duration-200"
                  disabled={clipTag.some(char => char === "")}
                >
                  Join Room
                </Button>
              )}
            </form>
            
            {/* QR Scanner Button for Mobile with enhanced design */}
            {isMobile && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQRScanner(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-solid transition-all duration-300 rounded-xl"
                >
                  <Scan className="w-5 h-5" />
                  <span className="font-medium">Scan QR Code</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Features Section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Cross-Device</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Works on any device</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Secure</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">No account required</p>
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
