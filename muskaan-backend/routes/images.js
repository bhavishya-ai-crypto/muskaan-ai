import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Style prompts — real design briefs, reused whether or not an image API is connected
const STYLE_PROMPTS = {
  "Modern Minimalist": "modern minimalist Indian house {room}, clean lines, neutral tones, large glass openings, natural light, architectural photography",
  "Traditional Indian": "traditional Indian house {room}, jaali screen details, courtyard influence, warm terracotta and stone finishes, architectural photography",
  "Contemporary Urban": "contemporary urban Indian house {room}, exposed concrete, black steel frames, muted green accents, architectural photography",
  "Industrial Loft": "industrial loft style Indian house {room}, exposed brick, iron fixtures, factory-style windows, architectural photography"
};

/**
 * POST /api/images/generate
 * body: { styleName: "Modern Minimalist", room: "living room", count: 10 }
 *
 * Calls xAI's Grok image-generation API (https://api.x.ai/v1/images/generations).
 * Bring your own key: set IMAGE_API_KEY in .env to a key from console.x.ai.
 *
 * ⚠️ Check console.x.ai yourself for current pricing/free-tier terms before
 * relying on this — that can change and this code doesn't assume either way.
 * If xAI's request/response shape differs from what's below by the time you
 * read this, check their current docs and adjust the fetch call accordingly.
 */
router.post("/generate", requireAuth, async (req, res) => {
  const { styleName, room, count = 10 } = req.body;
  const prompt = STYLE_PROMPTS[styleName];
  if (!prompt) {
    return res.status(400).json({ error: "Unknown style. Choose one of: " + Object.keys(STYLE_PROMPTS).join(", ") });
  }

  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error: "Image generation isn't configured yet.",
      detail: "Set IMAGE_API_KEY in your .env file to an xAI API key (from console.x.ai) to enable this route.",
      wouldUsePrompt: prompt.replace("{room}", room || "interior")
    });
  }

  try {
    const fullPrompt = prompt.replace("{room}", room || "interior");
    const n = Math.min(Math.max(Number(count) || 10, 1), 10);

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-2-image-1212", // check console.x.ai for the current image model name
        prompt: fullPrompt,
        n,
        response_format: "url"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI image API error:", errText);
      return res.status(502).json({ error: "The image generation provider returned an error.", detail: errText });
    }

    const data = await response.json();
    const images = (data.data || []).map(d => d.url).filter(Boolean);

    res.json({ styleName, room, prompt: fullPrompt, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate images." });
  }
});

export default router;
