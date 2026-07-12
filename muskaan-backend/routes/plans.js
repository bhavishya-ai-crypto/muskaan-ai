import express from "express";
import { generateVariations, generateFloorVariations } from "../utils/floorPlanGenerator.js";
import { savePlan, getPlansForUser, getPlanById, deletePlan } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public: anyone can generate layouts, no login needed to try it out
router.post("/generate", (req, res) => {
  const { length, width, facing, floors } = req.body;
  const L = Number(length), W = Number(width);
  const floorsCount = Math.min(Math.max(Number(floors) || 1, 1), 3);
  if (!L || !W || L < 10 || W < 10 || L > 500 || W > 500) {
    return res.status(400).json({ error: "Enter a valid plot length and width between 10 and 500 ft." });
  }
  const variations = generateFloorVariations(L, W, floorsCount, 10);
  res.json({ length: L, width: W, facing: facing || "North", floors: floorsCount, area: L * W, variations });
});

// Auth required: save a chosen layout to the user's account
router.post("/save", requireAuth, (req, res) => {
  const { length, width, facing, rooms, floors, styleName } = req.body;
  if (!length || !width || !rooms) {
    return res.status(400).json({ error: "Missing plan data." });
  }
  const plan = savePlan({ userId: req.userId, length, width, facing, rooms, floors, styleName });
  res.status(201).json({ plan });
});

// Auth required: list the logged-in user's saved plans
router.get("/", requireAuth, (req, res) => {
  res.json({ plans: getPlansForUser(req.userId) });
});

router.get("/:id", requireAuth, (req, res) => {
  const plan = getPlanById(Number(req.params.id), req.userId);
  if (!plan) return res.status(404).json({ error: "Plan not found." });
  res.json({ plan });
});

router.delete("/:id", requireAuth, (req, res) => {
  const ok = deletePlan(Number(req.params.id), req.userId);
  if (!ok) return res.status(404).json({ error: "Plan not found." });
  res.json({ success: true });
});

export default router;
