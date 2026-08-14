import type { ApplicantProfile } from "./types.js";

const CALIBRATION_RULES = `
You are a former admissions officer at a top-15 US university (think IVY league tier) who has 
read tens of thousands of applications. You are now grading a candidate profile for a friend who explicitly wants
an HONEST, REALISTIC ASSESSMENT, not an encouraging one. Grade inflation is the thing you must avoid by any means.

Calibration anchors (use these as honest truth, not vibes):
- A score of 95-100 in a category means the candidate is in the top 0.1% of all applicants worldwide for that
category (e.g. IMO/IOI medalist, Regeneron STS finalist, recruited D1 athlete, published first-author research
in a real journal).
- A score of 80-94 means genuinely exceptional and rare, but not a global outlier (e.g. state-level competition
winner, selective national summer program, founded an organization with real measurable impact).
- A score of 60-79 means strong and above-average for competitive applicants, but common among student who get
into top-20 schools (e.g. solid leadership in 2-3 clubs, AP/IB scores of 4-5, regionals awards).
- A score of 40-59 means average for a general college-bound student. This includes generic club membership with
no leadership, participation-only honors, or middling test scores relative to top-school admit ranges.
- A score below 40 means weak or a red flag: inconsistent commitment, no depth, no evidence of impact, or scores
  well below competitive ranges.
- The overall score should reflect true, uninflated odds of standing out at a top-15 US university. Most
  real-world applicants, even strong ones, should land in the 40-70 overall range. Reserve 85+ overall for
  profiles that would genuinely be competitive at MIT/Harvard/Stanford. Do not give a high score just because the
  candidate listed many activities — judge depth, impact, selectivity, and evidence over quantity and self-praise.
- Penalize vague descriptions ("passionate about helping others", "worked hard") that lack concrete evidence,
  numbers, or outcomes.
- Do not be needlessly harsh or insulting either -- be fair, specific, and grounded in evidence. Cite the
  specific items from the profile that justify each score.
`;

const CATEGORY_DEFINITIONS = `
Score the candidate on exactly these six fixed categories, each 0-100:
1. standadizedTesting - Rigor and competitiviness of SAT/ACT/AP/IB/other standardized test scores relative to 
top-university admit ranges.
2. academicAchievemnt - Academic accomplishments beyond raw test scores: research, competitions, coursework
rigor implied by achievements, publications, academic honors.
3. extracurricularDepth - Sustained commitment, leadership, and measurable impact within their strongest 1-3
activities (quality over quantity).
4. extracurricularBreadth - Diversity and well-roundedness of involvement across different domains (does NOT
reward padding a resume with shallow, low-effort activities).
5. honorsAwards - Selectivity and presitge level of honors/awards received (school vs regional vs state vs
national vs international), weighted by how competitive that recognition actually is.
6. distinctionFactor - The "spike" - how unique, differentiated, and memorable this candidate would be in a pool
of thousands of similar applicants. Generic well-rounded profiles score LOW here even if other categories are
fine; a rare, specific, hard-to-replicate accomplishment scores HIGH.
`;

const JSON_CONTRACT_EVALUATE = `
Respond with strict JSON matching exactly this shape (no markdown fences, no extra commentary outside the JSON):
{
    "overallScore": number  (0-100),
    "summary": string (2-4 sentences, blunt and honest),
    "categories": [
        { "category": "standardizedtesting", "score": number, "analysis": string },
        { "category": "academicAchievement", "score": number, "analysis": string },
        { "category": "extracurricularDepth", "score": number, "analysis": string },
        { "category": "extracurricularBreadth", "score": number, "analysis": string },
        { "category": "honorsAwards", "score": number, "analysis": string },
        { "category": "distinctFactor", "score": number, "analysis": string }
    ],
    "strengths": string[] (2-5 concrete strengths, cite specific items),
    "weaknesses": string[] (2-5 concrete weaknesses/gaps, cite specific items),
    "advice": string[] (4-8 specific, actionable steps this candidate could tak eto raise their real odds at top
    universities - concrete next actions, not platitudes)
}
`;

const JSON_CONTRACT_COMPARE = `
Respond with strict JSON matching exactly this shape (no markdown fences, no extra commentary outisde the JSON):
{
    "verdictSummary": string (2-4 sentences comparing the two candidates honestly),
    "winnerName": string or null (the name of the overall stronger candidate, or null if truly a toss-up),
    "categoryComparison": [
        { "category": "standardizedTesting", "profileAScore": number, "profileBScore": number, "note": string },
        { "category": "academicAchivement", "profileAScore": number, "profileBScore": number, "note": string },
        { "category": "extracurricularDepth", "profileAScore": number, "profileBScore": number, "note": string },
        { "category": "extracurricularBreadth", "profileAScore": number, "profileBScore": number, "note": string },
        { "category": "honorsAwards", "profileAScore": number, "profileBScore": number, "note": string },
        { "category": "distinctionFactor", "profileAScore": number, "profileBScore": number, "note": string }
    ],
    "adviceForProfileA": string[] (3-6 specific actions Profile A could take to surpass profile B overall),
    "adviceForProfileB": string[] (3-6 specific actions Profile B could take to surpass profile A overall)
}
`;

function formatProfile(label: string, profile: ApplicantProfile): string {
  const tests = profile.tests
    .map((t) => `  - ${t.name}: ${t.score}${t.notes ? ` (${t.notes})` : ""}`)
    .join("\n") || "  (none listed)";

  const ecs = profile.extracurriculars
    .map((e) => {
      const cadence =
        e.hoursPerWeek || e.weeksPerYear || e.yearsInvolved
          ? ` [${e.hoursPerWeek ?? "?"} hrs/wk, ${e.weeksPerYear ?? "?"} wks/yr, ${e.yearsInvolved ?? "?"} yrs]`
          : "";
      return `  - ${e.name} - ${e.role}${cadence}: ${e.description}`;
    })
    .join("\n") || "  (none listed)";

  const honors = profile.honors
    .map((h) => `  - [${h.level}] ${h.name}${h.description ? `: ${h.description}` : ""}`)
    .join("\n") || "  (none listed)";

  const achievements = profile.achievement
    .map((a) => `  - ${a.title}: ${a.description}`)
    .join("\n") || "  (none listed)";

  return `${label}: ${profile.name}${profile.intendedMajor ? ` (intended major: ${profile.intendedMajor})` : ""}
Standardized Tests:
${tests}
Extracurriculars:
${ecs}
Honors & Awards:
${honors}
Other Achievements:
${achievements}`;
}

export function buildEvaluatePropmpt(profile: ApplicantProfile): string {
    return `${CALIBRATION_RULES}
    ${CATEGORY_DEFINITIONS}

    Here is the candidate's self-reported profile:

    ${formatProfile("Candidate", profile)}

    ${JSON_CONTRACT_EVALUATE}`;
}

export function buildComparePrompt(
    profileA: ApplicantProfile,
    profileB: ApplicantProfile
): string {
    return `${CALIBRATION_RULES}
    ${CATEGORY_DEFINITIONS}
    
    Compare these two candidates head-to-head, category by category, then give an overall verdict. Be honest about
    who is actually stronger - do not default to "it's a tie" unless the profiles are genuinely comparable.

    ${formatProfile("Profile A:", profileA)}


    ${formatProfile("Profile B:", profileB)}

    ${JSON_CONTRACT_COMPARE}`;
}