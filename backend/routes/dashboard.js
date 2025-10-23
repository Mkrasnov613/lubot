import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const DashboardRouter = Router();

DashboardRouter.get("/", requireAuth, async (req, res) => {
  res.send({ok: true, user: req.user})
})