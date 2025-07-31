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

try {
  // Initialize the server
  const { app } = configureBasicServer();

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