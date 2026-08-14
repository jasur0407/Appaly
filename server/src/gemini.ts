import { GoogleGenAI, Type } from "@google/genai";
import type { EvaluationResult, ComparisonResult } from "./types.js";
import { RatingCategories } from "./types.js";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
    if (client) return client;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "Gemini API Key is missing, set up the API Key by filling .env file by relying on the .env.example"
        );
    }
    client = new GoogleGenAI({ apiKey });
    return client;
}


const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-2.5';

const categorySchemaEnum = { type: Type.STRING, enum: [...RatingCategories]}

const evaluateSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: categorySchemaEnum,
                    score: { type: Type.NUMBER },
                    analysis: { type: Type.STRING },
                },
                required: ["category", "score", "analysis"],
            },
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        advice: { type: Type.ARRAY }
    },
    required: ["overallScore", "summary", "categories", "strengths", "weaknesses", "advice"],
};

const compareSchema = {
    type: Type.OBJECT,
    properties: {
        verdictSummary: { type: Type.STRING },
        winnerName: { type: Type.STRING, nullable: true },
        categoryComparison: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: categorySchemaEnum,
                    profileAScore: { type: Type.NUMBER },
                    profileBScore: { type: Type.NUMBER },
                    note: { type: Type.STRING },
                },
                required: ["category", "profileAScore", "profileBScore", "note"]
            }
        },
        adviceForProfileA: { type: Type.ARRAY, items: { type: Type.STRING } },
        adviceForProfileB: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
        "verdictSummary",
        "winnerName",
        "categoryComparison",
        "adviceForProfileA",
        "adviceForProfileB",
    ]
};

async function generateJson<T>(prompt: string, schema: object): Promise<T> {
    const ai = getClient()
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema, 
            temperature: 0.4,
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("Gemini returned an empty output");
    }
    return JSON.parse(text) as T;
}

export async function evaluateProfile(prompt: string): Promise<EvaluationResult> {
    return generateJson<EvaluationResult>(prompt, evaluateSchema);
}

export async function compareProfiles(prompt: string): Promise<ComparisonResult> {
    return generateJson<ComparisonResult>(prompt, compareSchema);
}