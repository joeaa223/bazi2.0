import 'dotenv/config';
import session from "express-session";
import { 
  configureBasicServer, 
  setupLocationRoutes, 
  setupConversionRoute,
  setupBaziDataRoute 
} from "./baziCore.js";
import baziChatbotRouter from './bazi_chatbot.js';
import baziReportRouter from './bazi-report.js';
import JiaZiInfoRouter from './JiaZiInfo.js';
import { fileURLToPath } from "url";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import { generateImagePrompt } from "./imagePrompts.js";

try {
  // Initialize the server
  const { app } = configureBasicServer();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Set up session middleware
  app.use(session({
    secret: 'bazi_full_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 15 * 60 * 60 * 1000 // 15 hours
    }
  }));

  // Set up basic routes
  setupLocationRoutes(app);
  setupConversionRoute(app);
  setupBaziDataRoute(app);

  // Mount all routers
    app.use(baziChatbotRouter);
    app.use(baziReportRouter);
    app.use(JiaZiInfoRouter);

  // AI 图片融合路由（基于天干信息生成全新艺术图片）
  app.post('/api/fuse-images', async (req, res) => {
    try {
      const { tianGans } = req.body || {};
      if (!Array.isArray(tianGans) || tianGans.length < 4) {
        return res.status(400).json({ error: '需要提供四张天干信息' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const instruction = generateImagePrompt(tianGans);

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: [{ parts: [{ text: instruction }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          httpOptions: { timeout: 60000 }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      if (!imagePart) {
        return res.status(502).json({ error: 'AI 未返回图片数据' });
      }
      const mime = imagePart.inlineData.mimeType || 'image/png';
      const dataUrl = `data:${mime};base64,${imagePart.inlineData.data}`;
      return res.json({ fusedImageDataUrl: dataUrl });
    } catch (err) {
      console.error('图片融合失败:', err);
      return res.status(500).json({ error: '图片融合失败', message: err.message });
    }
  });



  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  });

  // Start server
  const PORT = process.env.PORT || 3010;
  const server = app.listen(PORT, () => {
    console.log(`Full Server running at http://localhost:${PORT}`);
    console.log('Environment variables:', {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'development'
    });
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => {
      console.log('Server closed');
    });
  });

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}