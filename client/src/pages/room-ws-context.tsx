import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type WSMessage = { type: string; [k: string]: any };

type RoomWS = {
  socket: WebSocket | null;
  isConnected: boolean;
  userCount: number;
  lastMessage: WSMessage | null;
  send: (data: any) => void;
};

const Ctx = createContext<RoomWS | null>(null);

export function RoomWSProvider({
  tag,
  headers,
  children,
}: {
  tag: string;
  headers?: Record<string, string>;
  children: React.ReactNode;
}) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!tag) return;
    // close any existing
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    // build ws url
    const base = window.location.origin.replace(/^http/i, "ws");
    const url = new URL(`${base}/ws/rooms/${tag}`);
    // pass optional auth headers as query since WS has no headers in browsers
    if (headers) {
      for (const [k, v] of Object.entries(headers)) url.searchParams.set(k, v);
    }

    const ws = new WebSocket(url.toString());
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      setUserCount((c) => c); // no-op
    };
    ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        setLastMessage(msg);
        if (msg.type === "presence" && typeof msg.userCount === "number")
          setUserCount(msg.userCount);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      try {
        ws.close();
      } catch {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, JSON.stringify(headers || {})]);

  const value = useMemo<RoomWS>(
    () => ({
      socket: socketRef.current,
      isConnected,
      userCount,
      lastMessage,
      send: (data: any) =>
        socketRef.current?.readyState === 1 &&
        socketRef.current?.send(JSON.stringify(data)),
    }),
    [isConnected, userCount, lastMessage]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoomWS() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoomWS must be used inside RoomWSProvider");
  return ctx;
}
