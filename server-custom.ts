/**
 * Next.js Custom Server with Integrated STUN Servers
 *
 * This custom server integrates:
 * 1. Next.js HTTP server (port 3000)
 * 2. UDP STUN servers (ports 3478-3480) for RFC 5780 NAT detection
 *
 * Architecture:
 * - Single Node.js process
 * - Unified lifecycle management
 * - Development and production support
 *
 * Reference: https://nextjs.org/docs/app/guides/custom-server
 *
 * IMPORTANT:
 * - This file does NOT go through Next.js Compiler
 * - Must use syntax compatible with current Node.js version (20+)
 * - Cannot use output: "standalone" in next.config.ts
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { parse } from "node:url";
import next from "next";
import { createSTUNServer, PORTS } from "./dist/stun-server.js";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";

console.log("🚀 Starting NAT Checker Custom Server");
console.log("=====================================\n");

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log("✅ Next.js prepared");

  // Create HTTP server for Next.js
  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const parsedUrl = parse(req.url || "", true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling request:", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    },
  );

  // Start HTTP server
  httpServer.listen(port, () => {
    console.log(
      `🌐 Next.js HTTP server listening on http://${hostname}:${port}`,
    );
    console.log(`   Mode: ${dev ? "development" : "production"}\n`);
  });

  // Start STUN UDP servers
  console.log("📡 Starting STUN servers...");
  const stunServers: ReturnType<typeof createSTUNServer>[] = [];

  try {
    stunServers.push(createSTUNServer(PORTS.PRIMARY, "STUN-Primary"));
  } catch (error) {
    console.error("❌ Failed to create STUN Primary server:", error);
  }

  try {
    stunServers.push(createSTUNServer(PORTS.SECONDARY, "STUN-Secondary"));
  } catch (error) {
    console.error("❌ Failed to create STUN Secondary server:", error);
  }

  try {
    stunServers.push(createSTUNServer(PORTS.TERTIARY, "STUN-Tertiary"));
  } catch (error) {
    console.error("❌ Failed to create STUN Tertiary server:", error);
  }

  if (stunServers.length === 0) {
    console.error("❌ No STUN servers could be started");
    process.exit(1);
  }

  console.log("\n✅ All services started successfully");
  console.log(`   HTTP:  http://${hostname}:${port}`);
  console.log(
    `   STUN:  udp://${hostname}:${PORTS.PRIMARY}-${PORTS.TERTIARY}\n`,
  );

  // Graceful shutdown
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) {
      console.log(`\n🛑 Already shutting down, ignoring ${signal}...`);
      return;
    }

    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    // Remove signal handlers to prevent multiple calls
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");

    // Close STUN servers first (more time-sensitive)
    console.log("📡 Closing STUN servers...");
    let stunsClosed = 0;
    const totalStuns = stunServers.length;

    stunServers.forEach((server, index) => {
      try {
        server.close(() => {
          stunsClosed++;
          console.log(
            `✅ STUN server ${index + 1} closed (${stunsClosed}/${totalStuns})`,
          );

          // When all STUN servers are closed, close HTTP server
          if (stunsClosed === totalStuns) {
            console.log("📡 All STUN servers closed, closing HTTP server...");
            closeHTTPServer();
          }
        });
      } catch (error) {
        // Only warn if it's not a "not running" error (which is expected)
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code !== "ERR_SOCKET_DGRAM_NOT_RUNNING"
        ) {
          console.warn(`⚠️  STUN server ${index + 1} close error:`, error);
        } else if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ERR_SOCKET_DGRAM_NOT_RUNNING"
        ) {
          console.log(`ℹ️  STUN server ${index + 1} was already closed`);
        } else {
          console.warn(`⚠️  STUN server ${index + 1} close error:`, error);
        }

        // Still increment counter to allow HTTP server closure
        stunsClosed++;
        if (stunsClosed === totalStuns) {
          console.log("📡 All STUN servers processed, closing HTTP server...");
          closeHTTPServer();
        }
      }
    });

    // Fallback: force HTTP server close after 3 seconds
    setTimeout(() => {
      if (!httpServer.listening) {
        console.log("📡 Timeout reached, forcing HTTP server closure...");
        closeHTTPServer();
      }
    }, 3000);
  };

  const closeHTTPServer = () => {
    try {
      if (httpServer.listening) {
        httpServer.close(() => {
          console.log("✅ HTTP server closed");
          console.log("🎉 All services closed gracefully");
          process.exit(0);
        });
      } else {
        console.log("ℹ️  HTTP server already closed");
        console.log("🎉 All services closed gracefully");
        process.exit(0);
      }
    } catch (error) {
      console.error("❌ Error closing HTTP server:", error);
      process.exit(1);
    }
  };

  // Set up signal handlers
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (err: Error) => {
    console.error("❌ Uncaught Exception:", err);
    if (!isShuttingDown) {
      shutdown("uncaughtException");
    }
  });

  process.on(
    "unhandledRejection",
    (reason: unknown, promise: Promise<unknown>) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      if (!isShuttingDown) {
        shutdown("unhandledRejection");
      }
    },
  );

  // Handle uncaught errors
  process.on("uncaughtException", (err: Error) => {
    console.error("❌ Uncaught Exception:", err);
    shutdown("uncaughtException");
  });

  process.on(
    "unhandledRejection",
    (reason: unknown, promise: Promise<unknown>) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      shutdown("unhandledRejection");
    },
  );
});
