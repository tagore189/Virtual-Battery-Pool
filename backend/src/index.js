import "dotenv/config";
import express from "express";
import cors from "cors";
import { createMqttClient } from "./mqtt.js";
import { BatteryPool } from "./pool.js";
import { GridController } from "./controller.js";
import { createWsBroadcaster } from "./websocket.js";
import { createRoutes } from "./routes.js";

const {
  MQTT_URL = "mqtt://localhost:1883",
  MQTT_CLIENT_ID = "gridpulse-backend",
  API_PORT = "3001",
  WS_PORT = "3002",
} = process.env;

const pool = new BatteryPool();
const mqttClient = createMqttClient(MQTT_URL, MQTT_CLIENT_ID);
const controller = new GridController(pool, mqttClient);
const { broadcast } = createWsBroadcaster(parseInt(WS_PORT));

let currentEnvironment = {
  weather: "clear",
  cloudCover: 10,
  solarIrradiance: 900,
  windSpeed: 6,
  temperature: 28,
  humidity: 40,
  timeOfDay: 12,
  solarGeneration: 0,
  windGeneration: 0,
  totalRenewable: 0,
  load: 25,
  powerImbalance: 0,
  activeScenario: "normal",
};

mqttClient.on("message", (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    const parts = topic.split("/");

    if (parts[0] === "battery" && parts[2] === "telemetry") {
      const id = parts[1];
      pool.update(id, data);
      broadcast("battery", pool.get(id));
    }

    if (topic === "grid/frequency") {
      controller.onFrequencyUpdate(data.frequency);
      broadcast("grid", controller.getState());
    }

    if (topic === "environment/telemetry") {
      currentEnvironment = { ...currentEnvironment, ...data };
      broadcast("environment", currentEnvironment);
    }
  } catch (err) {
    console.error("[MSG] parse error:", err.message);
  }
});

setInterval(() => {
  broadcast("snapshot", {
    grid: controller.getState(),
    pool: pool.aggregate(),
    batteries: pool.getAll(),
    environment: currentEnvironment,
  });
}, 1000);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", createRoutes(pool, controller, () => currentEnvironment));

app.listen(parseInt(API_PORT), () => {
  console.log(`[API] listening on :${API_PORT}`);
});
