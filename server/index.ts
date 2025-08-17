import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: false, limit: "1gb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup WebSocket server for real-time communication
  const wss = new WebSocketServer({
    server,
    path: "/ws", // Use a specific path to avoid conflicts with Vite
  });

  // Store active connections by room
  const roomConnections = new Map<string, Set<any>>();

  wss.on("connection", (ws, req) => {
    let currentRoom: string | null = null;

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "join" && data.room) {
          // Leave previous room if any
          if (currentRoom && roomConnections.has(currentRoom)) {
            roomConnections.get(currentRoom)?.delete(ws);
          }

          // Join new room
          currentRoom = data.room.toUpperCase();
          if (currentRoom && !roomConnections.has(currentRoom)) {
            roomConnections.set(currentRoom, new Set());
          }
          if (currentRoom) {
            roomConnections.get(currentRoom)?.add(ws);

            // Send user count to all clients in room
            const userCount = roomConnections.get(currentRoom)?.size || 0;
            broadcastToRoom(currentRoom, {
              type: "userCount",
              count: userCount,
            });

            log(`Client joined room ${currentRoom}, total users: ${userCount}`);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (currentRoom && roomConnections.has(currentRoom)) {
        roomConnections.get(currentRoom)?.delete(ws);
        const userCount = roomConnections.get(currentRoom)?.size || 0;

        if (userCount === 0) {
          roomConnections.delete(currentRoom);
        } else {
          broadcastToRoom(currentRoom, {
            type: "userCount",
            count: userCount,
          });
        }

        log(`Client left room ${currentRoom}, remaining users: ${userCount}`);
      }
    });
  });

  // Function to broadcast to all clients in a room
  function broadcastToRoom(room: string, data: any) {
    const connections = roomConnections.get(room);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Make broadcast function available globally for routes
  (global as any).broadcastToRoom = broadcastToRoom;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown for privacy protection
  process.on("SIGTERM", () => {
    log("🛡️  Graceful shutdown initiated - cleaning up privacy protection...");
    storage.destroy();
    server.close(() => {
      log("Server closed.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    log("🛡️  Shutdown signal received - cleaning up privacy protection...");
    storage.destroy();
    server.close(() => {
      log("Server closed.");
      process.exit(0);
    });
  });
})();
