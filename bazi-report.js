import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import { formatBaziData } from "./sourcecode/formatBaziData.js";

const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const language = "Mandarin"

// --- Report Generation Endpoint Framework ---
// POST /generate-report
// Accepts: { baziData, isoString, gender, ... }
// Returns: { report: '...' }
router.post('/generate-report', async (req, res) => {
  try {

    let baziData;
    
    // Try to get data from request body, fall back to session if needed
    if (Object.keys(req.body).length > 0) {
      baziData = req.body;
    } else if (req.session && req.session.baziData) {
      baziData = req.session.baziData;
    } else {
      return res.status(400).json({ 
        error: "请先填写生日信息", 
        message: "您需要先在表单页面填写完整的生日信息（年月日时间、性别、出生地点），然后点击'开始探索命理'按钮生成八字数据，之后才能生成报告。",
        action: "请返回表单页面填写生日信息"
      });
    }
    
    const { formattedString } = await formatBaziData(baziData, req);

    try {
        const report = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
            thinkingConfig: {
                includeThoughts: true,
                thinkingBudget: -1, // Dynamic thinking budget, at most 32726 tokens
            },
            httpOptions: {
                timeout: 180*1000 // 180 seconds timeout
            },
            maxOutputTokens: 40000,
            responseMimeType: "application/json",
            responseSchema:{
                type: Type.OBJECT,
                properties: {
                    polygonChart:{
                        type: Type.OBJECT,
                        description: "Polygon chart representing core personality dimensions. Scores (1–10) must reflect weighted pillar analysis (Day 60%, Year 10%, Month 10%, Hour 10%, Da Yun 10%).",
                        properties: {
                            leadershipAndIndependence: { type: Type.NUMBER, description: "Score for Leadership & Independence (1-10)"},
                            empathyAndConnection: { type: Type.NUMBER, description: "Score for Empathy & Connection (1-10)"},
                            creativityAndExpression: { type: Type.NUMBER, description: "Score for Creativity & Expression (1-10)" },
                            analyticalAndStrategicMind: { type: Type.NUMBER, description: "Score for Analytical & Strategic Mind (1-10)" },
                            diligenceAndReliability: { type: Type.NUMBER, description: "Score for Diligence & Reliability (1-10)"},
                            adventurousAndAdaptableSpirit: { type: Type.NUMBER, description: "Score for Adventurous & Adaptable Spirit (1-10)"}
                        },
                        required: ["leadershipAndIndependence", "empathyAndConnection", "creativityAndExpression", "analyticalAndStrategicMind", "diligenceAndReliability", "adventurousAndAdaptableSpirit"],
                        propertyOrdering: ["leadershipAndIndependence", "empathyAndConnection", "creativityAndExpression", "analyticalAndStrategicMind", "diligenceAndReliability", "adventurousAndAdaptableSpirit"]

                    },
                    tenGodsScores:{
                        type: Type.OBJECT,
                        description: "Scores for each of the Ten Gods based on the Day Pillar, Year Pillar, Month Pillar, Hour Pillar, and Current Da Yun. Each score must be between 1 and 10.",
                        properties: {
                            比肩: { type: Type.NUMBER, description: "Score for 比肩 (1-10)" },
                            劫财: { type: Type.NUMBER, description: "Score for 劫财 (1-10)" },
                            食神: { type: Type.NUMBER, description: "Score for 食神 (1-10)" },
                            伤官: { type: Type.NUMBER, description: "Score for 伤官 (1-10)" },
                            偏财: { type: Type.NUMBER, description: "Score for 偏财 (1-10)" },
                            正财: { type: Type.NUMBER, description: "Score for 正财 (1-10)" },
                            七杀: { type: Type.NUMBER, description: "Score for 七杀 (1-10)" },
                            正官: { type: Type.NUMBER, description: "Score for 正官 (1-10)" },
                            偏印: { type: Type.NUMBER, description: "Score for 偏印 (1-10)" },
                            正印: { type: Type.NUMBER, description: "Score for 正印 (1-10)" }
                        },
                    },
                    personalityProfile: {
                        type: Type.OBJECT,
                        properties: {
                            summary: {
                                type: Type.STRING,
                                description: "A concise overall summary of the individual's personality, derived from weighted factors: Day Pillar (60%), Year Pillar (10%), Month Pillar (10%), Hour Pillar (10%), and Current Da Yun (10%). Gender must be thoughtfully integrated to ensure culturally relevant examples."
                            },
                            strengths: {
                                type: Type.ARRAY,
                                description: "An array of 3 key personality strengths derived primarily from the Day Pillar, supplemented by Year, Month, Hour Pillars, and Current Da Yun.",
                                items: { type: Type.STRING },
                                minItems: 3,
                                maxItems: 3
                            },
                            challenges: {
                                type: Type.ARRAY,
                                description: "An array of 3 different potential personality challenges or growth opportunities, based on the weighted pillars.",
                                items: { type: Type.STRING },
                                minItems: 3,
                                maxItems: 3
                            },
                            communicationStyle: {
                                type: Type.STRING,
                                description: "Description of the individual's communication and interpersonal style, considering their gender and cultural context, informed by weighted pillars."
                            },
                            careerSuggestions: {
                                type: Type.ARRAY,
                                description: "An array of 5 suggested career fields or roles primarily informed by the Day and Month Pillars.",
                                items: { type: Type.STRING },
                                minItems: 5,
                                maxItems: 5
                            }
                        },
                        required: ["summary", "strengths", "challenges", "communicationStyle", "careerSuggestions"],
                        propertyOrdering: ["summary", "strengths", "challenges", "communicationStyle", "careerSuggestions"]

                    },
                    practicalAdvice: {
                        type: Type.ARRAY,
                        description: "An array of 5 concrete, actionable daily life tips and suggestions tailored specifically to the individual's personality profile, incorporating culturally relevant recommendations.",
                        items: { type: Type.STRING },
                        minItems: 5,
                        maxItems: 5,
                    },
                    reflectiveQuestions: {
                        type: Type.ARRAY,
                        description: "An array of 3 different open-ended, thought-provoking questions carefully crafted to encourage self-reflection, personal insight, and deeper self-awareness, considering gender and cultural context.",
                        items: { type: Type.STRING },
                        minItems: 3,
                        maxItems: 3,
                    }
                },
                required: ["polygonChart", "personalityProfile", "practicalAdvice", "reflectiveQuestions"],
                propertyOrdering: ["polygonChart", "personalityProfile", "practicalAdvice", "reflectiveQuestions"]
                },

            systemInstruction: ` 
        1. #ROLE & GOAL#
        You are an expert in BaZi (Chinese astrology) and developmental psychology, specializing in creating insightful, empowering personality reports. Your task is to translate BaZi data into clear, actionable insights that help individuals deeply understand their personality, strengths, challenges, communication style, and life path. Your report MUST NOT be predictive, fortune-telling, or fatalistic. Instead, it must offer logical explanations, compassionate insights, and practical advice for personal growth.

        2. #RULES#
        *You don't have to introduce yourself or greet user. Generate the report directly.*

        Language": MUST Use ${language} for all text, ensuring it is culturally appropriate and resonates with the target audience.

        Output Token: Maximum 2500 tokens for the entire report.

        3. #TONE & PRINCIPLES#

        * Clear & Engaging:
        Use conversational, friendly, and straightforward language.
        Minimize technical jargon. When BaZi-specific terms (e.g., "Day Pillar", "Five Elements", "Seven Killings") are used sparingly, immediately clarify them with relatable examples or explanations.

        * Warm & Personal:
        Always address the individual directly using second-person (“you”) to build rapport.

        * Balanced Positivity & Realism:
        Highlight strengths positively and authentically.
        Clearly and compassionately communicate challenges as opportunities for self-improvement, rather than obstacles.

        *Actionable & Practical:
        Provide specific, achievable, and realistic advice for everyday life, relationships, and career development.
        Offer practical tips that individuals can implement immediately for relevant section of the report.

        * Reflective & Introspective:
        Include thoughtful reflection questions to encourage deeper self-awareness and personal growth.

        4. #PERSONALITY ANALYSIS#
        Your analysis should carefully integrate BaZi elements, clearly respecting these specific weighted factors to determine the individual's personality:

        Day Pillar (日柱): 60%
        Primary determinant of core identity, decision-making, inner drives, and motivations
        Consider the primary personality description, Ten Gods (十神), Yin/Yang balance (阴阳), and the Five Elements (五行).

        Year Pillar (年柱): 10%
        Focus on inherent traits influenced by early-life environment, background, and ancestral tendencies. Use Ten Gods briefly to explain inherent strengths or possible inherited challenges.

        Month Pillar (月柱): 10%
        Emphasize career inclinations, social roles, and public image influences. Analyze briefly through Ten Gods and elements.

        Hour Pillar (时柱): 10%
        Address subtle, inner personality tendencies, hidden motivations, and potential later-life developments. Analyze relevant Ten Gods and elemental interactions.

        Current Da Yun (大运): 10%
        Current phase of life, subtly shaping personality development or shifts. Include a subtle influence representing the individual's current life phase and personal growth direction.

        5. #TEN GODS ANALYSIS#
        Give a score from 1 to 10 for each of the following Ten Gods based on the Day Pillar, Year Pillar, Month Pillar, Hour Pillar, and Current Da Yun. The scores must reflect the weighted influence of each pillar
        
        比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印

        6. #CONTENT GENERATION#
        - Storytelling & Real-Life Examples:
        Integrate short anecdotes, relatable scenarios, or metaphors to illustrate personality traits clearly.
        Make insights vivid and personally meaningful.

        -Brief Technical Explanations (Optional):
        When using occasional technical references (such as BaZi elements), clearly translate their meanings into practical implications.
        Example: "Your Day Pillar 'Geng Shen' (庚申) indicates strong determination and independence—qualities you naturally display when facing new challenges."

        -Age-Appropriate & Contextually Relevant (CRITICAL for Minors):
        If the individual is young, ensure all examples and advice are age-appropriate, specifically addressing relevant life contexts (school, friendships, family relationships, hobbies).

        -Empowering, NOT Fatalistic:
        Your insights should empower the reader, emphasizing potential and opportunities for positive growth. Avoid any deterministic or predictive statements about the future.

        -Gender Context:
        * Use the provided gender to select appropriate pronouns (e.g., 他/她). Avoid gender stereotypes; use gender context only to enhance relatability and practical relevance.

        7. #COHERENCE & INTEGRATION#
        The entire report must be internally consistent.

        8. #REFLECTIVE QUESTIONS#
        Generate carefully crafted questions designed to prompt meaningful reflection.
        Examples:
        - “How have your natural leadership skills helped you overcome past challenges?”
        - “In what ways might your assertive approach impact your relationships, positively or negatively?”

        `,
        },
        contents: {
            text: `You will utilize the Ba Zi data given below to generate a report for the user:
            ${formattedString}

            *You don't have to introduce yourself or greet user. Generate the report directly.*

            `
        }
    });
  
    for (const part of report.candidates[0].content.parts) {
    if (!part.text) {
      continue;
    }
    else if (part.thought) {
      console.log("Thoughts summary:");
      console.log(part.text);
    }
    }

    if(!report.text){
        throw new Error("Report text is empty");
    }
    else {
      // Store report in session for later retrieval
      if (req.session) {
        req.session.baziReport = report.text;
      }
      
      // Send back the response
      res.status(200).json({
        report: report.text
      });
    }


} catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ 
      error: "Failed to generate report.",
      details: error.message || 'An unexpected error occurred.' });
}

} catch (err) {
    console.error("Error in report generation endpoint:", err);
    res.status(500).json({ error: err.message || 'Failed to process report generation request.' });
}
});

// Endpoint to fetch the last generated report
router.get('/get-report', (req, res) => {
  if (!req.session || !req.session.baziReport) {
    return res.status(404).json({ error: "No BaZi report found. Please generate a report first." });
  }
  
  res.json({
    report: req.session.baziReport
  });
});

export default router;

