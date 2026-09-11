import { Router } from "express";

export function createRoutes(pool, controller, getEnvironment) {
  const router = Router();

  router.get("/pool", (_req, res) => {
    res.json({ batteries: pool.getAll(), aggregate: pool.aggregate() });
  });

  router.get("/grid", (_req, res) => {
    res.json(controller.getState());
  });

  router.get("/history", (_req, res) => {
    res.json({
      frequency: controller.getFreqHistory(),
      pool: pool.getHistory(),
    });
  });

  router.get("/events", (_req, res) => {
    res.json(controller.getEvents());
  });

  router.get("/environment", (_req, res) => {
    res.json(getEnvironment ? getEnvironment() : {});
  });

  router.post("/environment/command", (req, res) => {
    const payload = req.body;
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: "Command payload required" });
    }
    controller.mqtt.publish("environment/command", JSON.stringify(payload), { qos: 1 });
    controller.addEvent({ type: "environment_command", ...payload });
    res.json({ ok: true, payload });
  });

  router.post("/environment/scenario", (req, res) => {
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: "scenario is required" });
    const payload = { command: "set_scenario", scenario };
    controller.mqtt.publish("environment/command", JSON.stringify(payload), { qos: 1 });
    controller.addEvent({ type: "scenario_change", scenario });
    res.json({ ok: true, scenario });
  });

  router.post("/dispatch", (req, res) => {
    const { batteryId, action, power } = req.body;
    if (!batteryId || !action) return res.status(400).json({ error: "batteryId and action required" });

    const cmd = { action, power: power || 0, timestamp: Date.now(), manual: true };
    controller.mqtt.publish(`battery/${batteryId}/command`, JSON.stringify(cmd), { qos: 1 });
    controller.addEvent({ type: "manual_dispatch", batteryId, ...cmd });
    res.json({ ok: true, cmd });
  });

  return router;
}
