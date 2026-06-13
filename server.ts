import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log available env keys for Firebase and API diagnostics
  console.log("[Server Diagnostics] Registered environment keys:", 
    Object.keys(process.env).filter(k => k.includes("FIREBASE") || k.includes("API") || k.includes("KEY") || k.includes("URL"))
  );

  // Expose Firebase config dynamically from system process environment or firebase-applet-config.json
  app.get("/firebase-config.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    
    let appletConfig: any = {};
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        appletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        console.log("[Firebase Config Endpoint] Loaded config from file:", configPath);
      }
    } catch (e) {
      console.warn("[Firebase Config Endpoint] Could not load firebase-applet-config.json:", e);
    }

    const firebaseVars = {
      apiKey: appletConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || "",
      authDomain: appletConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      databaseURL: appletConfig.databaseURL || process.env.VITE_FIREBASE_DATABASE_URL || "",
      projectId: appletConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: appletConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: appletConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: appletConfig.appId || process.env.VITE_FIREBASE_APP_ID || "",
      measurementId: appletConfig.measurementId || process.env.VITE_FIREBASE_MEASUREMENT_ID || "",
      vapidKey: appletConfig.vapidKey || process.env.VITE_FIREBASE_VAPID_KEY || ""
    };
    
    // Support either VITE_ prefix or direct firebase credentials names
    const config = {
      apiKey: firebaseVars.apiKey || process.env.FIREBASE_API_KEY || "",
      authDomain: firebaseVars.authDomain || process.env.FIREBASE_AUTH_DOMAIN || "",
      databaseURL: firebaseVars.databaseURL || process.env.FIREBASE_DATABASE_URL || (firebaseVars.projectId ? `https://${firebaseVars.projectId}-default-rtdb.firebaseio.com` : ""),
      projectId: firebaseVars.projectId || process.env.FIREBASE_PROJECT_ID || "",
      storageBucket: firebaseVars.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: firebaseVars.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
      appId: firebaseVars.appId || process.env.FIREBASE_APP_ID || "",
      measurementId: firebaseVars.measurementId || process.env.FIREBASE_MEASUREMENT_ID || "",
      vapidKey: firebaseVars.vapidKey || process.env.FIREBASE_VAPID_KEY || ""
    };

    console.log("[Firebase Config Endpoint] Serving config, keys resolved:", 
      Object.keys(config).filter(k => !!config[k as keyof typeof config])
    );

    res.send(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`);
  });

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // --- AI CENTER API ENDPOINTS ---

  // 1. General AI Chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages } = req.body; // Array of { role: 'user' | 'model', text: string }
      if (!ai) {
        return res.status(503).json({ error: "Gemini API is currently offline. Please configure GEMINI_API_KEY." });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Convert format for chats of @google/genai SDK
      const lastMessage = messages[messages.length - 1];
      const history = messages.slice(0, messages.length - 1).map(msg => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "You are the primary Elite AI Assistant of SkillCame LMS. Speak in an encouraging, highly professional, intelligent, and helpful educational tone. Format your responses with elegant markdown, and use scannable highlights.",
        },
        history: history
      });

      const result = await chat.sendMessage({ message: lastMessage.text });
      return res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      return res.status(500).json({ error: error.message || "Failed to process chat response" });
    }
  });

  // 2. Personal AI Tutor
  app.post("/api/ai/tutor", async (req, res) => {
    try {
      const { topic, question, courseContext } = req.body;
      if (!ai) {
        return res.status(503).json({ error: "Gemini API is currently offline. Please configure GEMINI_API_KEY." });
      }

      const prompt = `Topic: "${topic}"\nCourse context: "${courseContext || 'Digital Skills & Technology'}"\nStudent's inquiry: "${question}"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Personal AI Tutor on SkillCame LMS. Your goal is to guide students step-by-step through tough concepts, using relatable, clear analogies, active checkpoints, and mini-exercises instead of just giving away the direct answer immediately. Challenge them mildly and keep them engaged!",
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      return res.status(500).json({ error: error.message || "AI Tutor encountered an error." });
    }
  });

  // 3. AI Content Studio
  app.post("/api/ai/content", async (req, res) => {
    try {
      const { type, prompt, options } = req.body; // type: 'summary' | 'cheat_sheet' | 'flashcards' | 'quiz'
      if (!ai) {
        return res.status(503).json({ error: "Gemini API is currently offline. Please configure GEMINI_API_KEY." });
      }

      let systemInstruction = "";
      if (type === 'summary') {
        systemInstruction = "You are a professional Educational Content Strategist at SkillCame Studio. Generate a beautifully structured, highly readable, executive summaries of the provided context. Use bullet points, definitions of core keywords, and actionable key takeaways.";
      } else if (type === 'cheat_sheet') {
        systemInstruction = "You are a lead coder and expert designer on SkillCame. Create a pristine, condensed Cheatsheet of the specified topic. Include quick command reference tables, key formulas/syntax blocks, and pro tips. Keep it highly useful and actionable.";
      } else if (type === 'flashcards') {
        systemInstruction = "You are an educator at SkillCame. Generate a collection of interactive study flashcards. Provide each flashcard with a clear FRONT (Question/Concept) and BACK (Answer/Key Explanation). Format the response clearly.";
      } else {
        systemInstruction = "You are a Quiz master on SkillCame LMS. Generate an interactive 5-question multiple-choice quiz related to the topic. For each question, provide 4 options (A, B, C, D), specify the CORRECT option, and include a helpful, friendly EXPLANATION.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { systemInstruction }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Content Studio Error:", error);
      return res.status(500).json({ error: error.message || "AI Content Studio failed." });
    }
  });

  // 4. AI Career Coach
  app.post("/api/ai/career", async (req, res) => {
    try {
      const { careerInput, targetRole, yearsExperience, currentSkills } = req.body;
      if (!ai) {
        return res.status(503).json({ error: "Gemini API is currently offline. Please configure GEMINI_API_KEY." });
      }

      const prompt = `Target Role: "${targetRole}"\nCurrent Experience: "${yearsExperience} years"\nCurrent Skills: "${currentSkills || 'None listed'}"\nAdditional goals: "${careerInput || 'None'}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Executive AI Career Counselor at SkillCame. Based on the student's background, target career path, and skills gap, design a hyper-focused upskilling roadmap. Map out clear phase-by-phase actions (e.g. Phase 1: Foundations, Phase 2: Core Engineering, Phase 3: Project Mastery & Strategy), list precise technical skills they need to acquire, offer expert positioning/resume hacks, and suggest what domains of courses they should enroll in. Format the output brilliantly in Markdown."
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Career Error:", error);
      return res.status(500).json({ error: error.message || "AI Career Coach failed." });
    }
  });


  // --- STATIC AND VITE SERVING MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is routing on port ${PORT}`);
  });
}

startServer();
