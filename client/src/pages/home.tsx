import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCopy, Smartphone, Shield } from "lucide-react";

export default function Home() {
  const [clipTag, setClipTag] = useState("");
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <ClipboardCopy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">ClipSync</h1>
          <p className="text-gray-600 text-lg">Share clipboard text across devices using a simple 4-character code</p>
        </div>

        {/* ClipTag Input Form */}
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <Label htmlFor="cliptag" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 text-lg font-mono uppercase text-center tracking-widest"
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
              <p className="text-sm text-gray-500 mt-3">
                Use 4 alphanumeric characters (e.g., A2D9, B7X3, M9K1)
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Cross-Device</h3>
                  <p className="text-sm text-gray-600">Works on any device</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Secure</h3>
                  <p className="text-sm text-gray-600">No account required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
