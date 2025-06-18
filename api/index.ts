import { registerRoutes } from '../server/routes';
import { setupVite, serveStatic } from '../server/vite';
import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
await registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
}

export default app; 