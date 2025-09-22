const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket Server running on port ${PORT}`);

let messages = [];

function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  // send history
  ws.send(JSON.stringify({ type: "init", messages }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "message") {
        messages.push(data);
        broadcast({ type: "message", message: data });
      } else if (data.type === "edit") {
        messages = messages.map(m =>
          m.id === data.id ? { ...m, text: data.newText, edited: true } : m
        );
        broadcast({ type: "edit", id: data.id, newText: data.newText });
      } else if (data.type === "delete") {
        messages = messages.filter(m => m.id !== data.id);
        broadcast({ type: "delete", id: data.id });
      } else if (data.type === "clear") {
        messages = [];
        broadcast({ type: "clear" });
      }
    } catch (err) {
      console.error("❌ Error:", err);
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});