import "dotenv/config";
import express from "express";
import cors from "cors";
import { buildComparePrompt, buildEvaluatePrompt } from "./prompt.js";
import { compareProfiles, evaluateProfile } from "./gemini.js";
import type { ApplicantProfile } from "./types.js"

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/get/health", (_req, res) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
})

app.post("/api/evaluate", async (req, res) => {
    try {
        const profile = req.body.profile as ApplicantProfile;
        if (!profile || !profile.name) {
            return res.status(400).json({ error: "A proper applicant profile is required" });
        }
        const prompt = buildEvaluatePrompt(profile);
        const result = await evaluateProfile(prompt)
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err instanceof Error ? err.message: "Evaluation error" })
    }
})


app.post("/api/compare", async (req, res) => {
    try {
        const profileA = req.body.profileA as ApplicantProfile;
        const profileB = req.body.profileB as ApplicantProfile;
        if (!profileA?.name || !profileB?.name) {
            return res.status(400).json({error: "Two proper applicant profiles are required"})
        }
        const prompt = buildComparePrompt(profileA, profileB);
        const result = await compareProfiles(prompt);
        res.json(result);
    } catch(err) {
        console.error(err)
        res.status(500).json({ error: err instanceof Error ? err.message: "Comparison failed" })
    }
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
    console.log(`Appaly server listening on https://localhost:${PORT}`);
})