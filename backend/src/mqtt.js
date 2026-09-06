import mqtt from "mqtt";

export function createMqttClient(url, clientId) {
  const client = mqtt.connect(url, {
    clientId,
    clean: true,
    reconnectPeriod: 3000,
  });

  client.on("connect", () => console.log("[MQTT] connected to", url));
  client.on("reconnect", () => console.log("[MQTT] reconnecting..."));
  client.on("error", (err) => console.error("[MQTT] error:", err.message));

  client.subscribe([
    "battery/+/telemetry",
    "grid/frequency",
  ], { qos: 1 });

  return client;
}
