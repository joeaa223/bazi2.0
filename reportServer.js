import session from "express-session";
import { configureBasicServer, setupLocationRoutes, setupConversionRoute } from "./baziCore.js";
import baziReportRouter from './bazi-report.js';
import JiaZiInfoRouter from './JiaZiInfo.js';

try{
  // Initialize the server
  const { app } = configureBasicServer();

  // Set up session middleware
  app.use(session({
    secret: 'bazi_report_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 15 * 60 * 60 * 1000 // 15 hours
    }
  }));

  // Set up routes
  setupLocationRoutes(app);
  setupConversionRoute(app);

  // Mount report routers
  app.use(baziReportRouter);
  app.use(JiaZiInfoRouter);

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Report server error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  });

  // Start server
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`Report Server running at http://localhost:${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => {
      console.log('Server closed');
    });
  });

} catch (error) {
  console.error('Failed to start report server:', error);
  process.exit(1);
}