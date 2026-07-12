import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import planRoutes from "./routes/plans.js";
import imageRoutes from "./routes/images.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "muskaan-ai-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/images", imageRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Muskaan.ai backend running on http://localhost:${PORT}`));
