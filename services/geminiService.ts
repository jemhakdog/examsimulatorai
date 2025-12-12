import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, GeneratedQuizResponse, AISettings } from "../types";
// @ts-ignore
import * as _pdfjsLib from 'pdfjs-dist';

// Handle ESM/CommonJS interoperability for PDF.js
const pdfjsLib = (_pdfjsLib as any).default || _pdfjsLib;

// Set PDF.js worker source to cdnjs for better reliability (avoids importScripts errors)
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const SYSTEM_INSTRUCTION = `
You are a rigorous exam generation AI. Your goal is to create a comprehensive exam that covers 100% of the provided study material. 
Do not summarize or skip details. You must verify knowledge on every section, list, diagram, and key fact presented in the content.
Ensure distractors (wrong answers) are plausible and difficult to distinguish for someone who hasn't studied the material closely.
`;

const getQuizSchema = () => {
  return {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionText: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["questionText", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  };
};

const PROMPT_TEMPLATE = (difficulty: Difficulty) => `
    TASK: Create a comprehensive exam based on the attached content.
    
    CRITICAL INSTRUCTION: Cover ALL parts of the source material. Do not skip any section, paragraph, or bullet point.
    
    1. Analyze the content sentence by sentence.
    2. Identify every distinct fact, concept, definition, and rule.
    3. Generate a multiple-choice question for EACH identified piece of information.
    
    DENSITY:
    - You must generate enough questions to ensure that a student who passes this exam has read and understood the ENTIRE document.
    - Do not limit yourself arbitrarily. If the document is dense, generate as many questions as needed (up to 50+) to cover everything.
    - If the document is short, ensure every sentence is tested.
    
    DIFFICULTY: ${difficulty}. 
    - For 'Hard', focus on nuance, application of concepts, and connecting multiple facts.
    
    OUTPUT FORMAT:
    - Strictly JSON matching the schema.
    - Each question must have exactly 4 options.
    - Explanation must quote or reference the specific part of the text the answer comes from.
`;

export const generateQuizFromContent = async (
  base64Data: string,
  mimeType: string,
  difficulty: Difficulty,
  settings?: AISettings
): Promise<GeneratedQuizResponse> => {

  const provider = settings?.provider || 'gemini';

  if (provider === 'gemini') {
    return generateWithGemini(base64Data, mimeType, difficulty, settings);
  } else {
    return generateWithOpenAI(base64Data, mimeType, difficulty, settings!.openai);
  }
};

const generateWithGemini = async (
  base64Data: string,
  mimeType: string,
  difficulty: Difficulty,
  settings?: AISettings
) => {
  try {
    // Use custom key if provided in settings, otherwise use env key
    const apiKey = settings?.gemini?.apiKey || process.env.API_KEY;

    if (!apiKey) {
      throw new Error("Missing Gemini API Key. Please provide one in settings or configure the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: PROMPT_TEMPLATE(difficulty)
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: getQuizSchema()
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    return JSON.parse(text) as GeneratedQuizResponse;

  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error);
    throw error;
  }
};

const extractTextFromPdf = async (base64Data: string): Promise<string> => {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use a try-catch block specifically for loading the document to catch Worker errors early
    let pdf;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      pdf = await loadingTask.promise;
    } catch (loadError: any) {
      console.error("PDF Load Error:", loadError);
      throw new Error(`Could not load PDF document. ${loadError.message}`);
    }

    let fullText = '';
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
      } catch (pageError) {
        console.warn(`Skipping page ${i} due to extraction error`, pageError);
        fullText += `--- PAGE ${i} (Extraction Failed) ---\n\n`;
      }
    }

    if (!fullText.trim()) {
      throw new Error("PDF appears to be empty or contains only scanned images without text layer.");
    }

    return fullText;
  } catch (error: any) {
    console.error("PDF Extraction Error:", error);
    // Provide a more user-friendly error message
    if (error.message.includes("Worker")) {
      throw new Error("PDF Worker failed to initialize. Please refresh or try a different browser.");
    }
    throw new Error(error.message || "Failed to extract text from PDF.");
  }
};

const generateWithOpenAI = async (
  base64Data: string,
  mimeType: string,
  difficulty: Difficulty,
  config: AISettings['openai']
) => {

  const messages: any[] = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION
    }
  ];

  let userContent: any[] = [];
  const promptText = PROMPT_TEMPLATE(difficulty);

  // Handle different mime types for OpenAI
  if (mimeType === 'application/pdf') {
    // Extract text from PDF for OpenAI (doesn't support PDF directly)
    const extractedText = await extractTextFromPdf(base64Data);
    userContent = [
      { type: "text", text: extractedText },
      { type: "text", text: promptText }
    ];
  } else if (mimeType.startsWith('image/')) {
    // OpenAI supports images via URL or base64
    userContent = [
      {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Data}` }
      },
      { type: "text", text: promptText }
    ];
  } else {
    // For text-based content
    const textContent = atob(base64Data);
    userContent = [
      { type: "text", text: textContent },
      { type: "text", text: promptText }
    ];
  }

  messages.push({
    role: "user",
    content: userContent
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config?.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config?.model || 'gpt-4o',
        messages: messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response generated from OpenAI.");
    }

    return JSON.parse(content) as GeneratedQuizResponse;

  } catch (error) {
    console.error("OpenAI Quiz Generation Error:", error);
    throw error;
  }
};