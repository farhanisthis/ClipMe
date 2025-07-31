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
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

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
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (cleanValue.length <= 1) {
      const newClipTag = [...clipTag];
      newClipTag[index] = cleanValue;
      setClipTag(newClipTag);

      // Auto-focus next input if character entered
      if (cleanValue && index < 3) {
        inputRefs[index + 1].current?.focus();
      }

      // Auto-submit when all 4 characters are entered
      if (
        index === 3 &&
        cleanValue &&
        newClipTag.every((char) => char !== "")
      ) {
        const fullTag = newClipTag.join("");
        setTimeout(() => setLocation(`/room/${fullTag}`), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to move to previous input
    if (e.key === "Backspace" && !clipTag[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 4);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden theme-transition">
      {/* Enhanced Animated Background with better dark blue tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.12),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.10),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_60%)]"></div>

      {/* Enhanced floating particles with different sizes and animations */}
      <div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce"
        style={{ animationDelay: "0s", animationDuration: "3s" }}
      ></div>
      <div
        className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce"
        style={{ animationDelay: "1s", animationDuration: "2s" }}
      ></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-pink-400/20 rounded-full animate-bounce"
        style={{ animationDelay: "2s", animationDuration: "4s" }}
      ></div>
      <div
        className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-indigo-400/25 rounded-full animate-pulse"
        style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}
      ></div>
      <div
        className="absolute top-1/2 right-1/5 w-2.5 h-2.5 bg-cyan-400/15 rounded-full animate-ping"
        style={{ animationDelay: "1.5s", animationDuration: "3.5s" }}
      ></div>

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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight">
            ClipMe
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl leading-relaxed px-2 font-medium">
            Sync your clipboard in seconds — no login, no friction
          </p>
        </div>

        {/* Premium ClipTag Input Form */}
        <Card className="shadow-2xl border-0 glass dark:glass-dark hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeIn rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="animate-slideIn">
              <Label className="block text-base font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">
                Enter your 4-character ClipTag
              </Label>

              {/* Premium PIN-style Input Boxes */}
              <div className="flex justify-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                {clipTag.map((char, index) => (
                  <div key={index} className="relative">
                    <Input
                      ref={inputRefs[index]}
                      type="text"
                      value={char}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      placeholder="?"
                      maxLength={1}
                      className="w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl font-mono font-black uppercase text-center border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl shadow-lg glass dark:glass-dark dark:text-white transition-all duration-300 hover:shadow-xl focus:shadow-2xl hover:scale-110 focus:scale-110 active:scale-95 focus:animate-glow"
                      autoComplete="off"
                      inputMode="text"
                      style={{
                        background: char
                          ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))"
                          : undefined,
                      }}
                    />
                    {char && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center mb-6 sm:mb-8">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Enter 4 alphanumeric characters (A-Z, 0-9)
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    Auto-joins room when complete
                  </span>
                </div>
              </div>

              {/* Manual Submit Button (hidden when all filled) */}
              {clipTag.some((char) => char === "") && (
                <Button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white font-medium hover:bg-blue-600 transition-all duration-200"
                  disabled={clipTag.some((char) => char === "")}
                >
                  Join Room
                </Button>
              )}
            </form>

            {/* Premium QR Scanner Button for Mobile */}
            {isMobile && (
              <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-600/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQRScanner(true)}
                  className="w-full flex items-center justify-center space-x-3 py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-solid hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-2xl font-semibold"
                >
                  <Scan className="w-5 h-5" />
                  <span>Scan QR Code</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Features Section */}
        <div
          className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-fadeIn"
          style={{ animationDelay: "0.3s" }}
        >
          <Card className="border-0 glass dark:glass-dark hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 group rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                    Cross-Device Sync
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Works seamlessly across all devices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 glass dark:glass-dark hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 group rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                    Private & Secure
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    No registration or login required
                  </p>
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
