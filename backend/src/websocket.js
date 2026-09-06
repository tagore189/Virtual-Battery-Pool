import { WebSocketServer } from "ws";

export function createWsBroadcaster(port) {
  const wss = new WebSocketServer({ port });
  console.log(`[WS] server listening on :${port}`);

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  function broadcast(type, data) {
    const msg = JSON.stringify({ type, data, timestamp: Date.now() });
    for (const ws of wss.clients) {
      if (ws.readyState === 1) ws.send(msg);
    }
  }

  return { wss, broadcast };
}
