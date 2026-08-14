export interface StandardizedTest {
    id: string;
    name: string;
    score: string;
    notes?: string;
}

export interface Extracurricular {
    id: string;
    name: string;
    role: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    yearsInvolved?: number;
    description: string;
}

export interface HonorAward {
    id: string;
    name: string;
    level: "school" | "regional" | "state" | "national" | "international";
    description?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
}

export interface ApplicantProfile {
    id: string;
    name: string;
    intendedMajor?: string;
    tests: StandardizedTest[];
    extracurriculars: Extracurricular[];
    honors: HonorAward[];
    achievement: Achievement[];
}

export const RatingCategories = [
    "standardizedTesting",
    "academicAchievement",
    "extracurricularDepth",
    "extracurricularBreadth",
    "honorsAwards",
    "distinctionFactor"
] as const;

export type RatingCategory = (typeof RatingCategories)[number];

export const CategoryLabels: Record<RatingCategory, string> = {
    standardizedTesting: "Standardized Testing",
    academicAchievement: "Academic Achievement",
    extracurricularDepth: "Extracurricular Depth",
    extracurricularBreadth: "Extracurricular Breadth",
    honorsAwards: "Honors & Awards",
    distinctionFactor: "Distinction Factor",
};

export interface CategoryScore {
    category: RatingCategory;
    score: number; // X out of 100
    analysis: string; // analysis specificly for this category
}

export interface EvaluationResult {
    overallScore: number; // X out of 100 considering all the categories
    summary: string; // overall honest feedback
    categories: CategoryScore[];
    strengths: string[];
    weaknesses: string[];
    advice: string[]
}

export interface ComparisonResult {
    verdictSummary: string;
    winnerName: string | null; // name of the stronger candide and null if tied
    categoryComparison: {
        category: RatingCategory;
        profileAScore: number;
        profileBScore: number;
        note: string;
    }[];
    adviceForProfileA: string[]; // advice for profile A to surpass profile B
    adviceForProfileB: string[]; // advice for profile B to surpass profile A
}