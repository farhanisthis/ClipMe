import { useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";

export interface WebSocketMessage {
  type: "userCount" | "clipboardUpdate" | "fileUpload" | "fileDelete";
  count?: number;
  content?: string;
  updatedAt?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  fileId?: string;
}

export function useWebSocket(room: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === "granted");
        });
      } else {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    }
  }, []);

  // Function to show browser notification
  const showNotification = (title: string, body: string) => {
    if (notificationsEnabled && document.hidden) {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: "clipme-update",
        });
      } catch (error) {
        console.log("Notification failed:", error);
      }
    }
  };

  useEffect(() => {
    if (!room) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Join the room
        ws.send(
          JSON.stringify({
            type: "join",
            room: room.toUpperCase(),
          })
        );
        console.log(
          `Connected to WebSocket and joined room ${room.toUpperCase()}`
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          switch (message.type) {
            case "userCount":
              setUserCount(message.count || 0);
              break;

            case "clipboardUpdate":
              toast({
                title: "Content Updated",
                description: "Someone updated the clipboard content",
              });
              showNotification(
                "ClipMe - Content Updated",
                "Someone updated the clipboard content"
              );
              break;

            case "fileUpload":
              toast({
                title: "File Uploaded",
                description: `${message.fileName} was uploaded`,
              });
              showNotification(
                "ClipMe - File Uploaded",
                `${message.fileName} was uploaded`
              );
              break;

            case "fileDelete":
              toast({
                title: "File Deleted",
                description: "A file was deleted from this room",
              });
              showNotification(
                "ClipMe - File Deleted",
                "A file was deleted from this room"
              );
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setUserCount(0);
        console.log("WebSocket connection closed");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }

    // Cleanup on unmount or room change
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setUserCount(0);
    };
  }, [room, toast]);

  return {
    isConnected,
    userCount,
    lastMessage,
    notificationsEnabled,
  };
}
