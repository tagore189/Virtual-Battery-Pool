import { Router } from "express";

export function createRoutes(pool, controller) {
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
