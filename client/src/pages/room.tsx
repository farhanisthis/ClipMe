import { useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function Room() {
  const [location, setLocation] = useLocation();
  const tagMatch = location.match(/\/room\/([A-Za-z0-9]{4})/);
  const tag = tagMatch ? tagMatch[1].toUpperCase() : "";
  const { toast } = useToast();

  if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <Card className="w-full max-w-md mx-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Invalid ClipTag
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ClipTag must be 4 alphanumeric characters.
              </p>
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
    <div className="min-h-screen relative overflow-hidden theme-transition flex">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950"></div>
      <div className="flex-1 h-full min-h-0 min-w-0 flex flex-col relative z-10">
        <main className="flex-1 h-full min-h-0 min-w-0 px-3 sm:px-4 py-4 sm:py-6 lg:py-8 w-full overflow-y-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Room {tag}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Content is now stored persistently</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </div>
        </main>
      </div>
    </div>
  );
}
