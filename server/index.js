import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import storesRoutes from './routes/stores.js';
import auditsRoutes from './routes/audits.js';
import visitsRoutes from './routes/visits.js';
import actionsRoutes from './routes/actions.js';
import scoresRoutes from './routes/scores.js';
import commentsRoutes from './routes/comments.js';
import checklistsRoutes from './routes/checklists.js';
import dotTeamLeaderRoutes from './routes/dot-team-leader.js';
import sectionEvaluationsRoutes from './routes/section-evaluations.js';
import adminContactsRoutes from './routes/admin-contacts.js';
import specialistManualsRoutes from './routes/specialist-manuals.js';
import folhetosRoutes from './routes/folhetos.js';
import estudoMercadoRoutes from './routes/estudo-mercado.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files for specialist manuals
app.use('/specialist-manuals', express.static(join(__dirname, '../public/specialist-manuals')));
// Serve static files for folhetos
app.use('/folhetos', express.static(join(__dirname, '../public/folhetos')));
// Serve static files for estudo-mercado
app.use('/estudo-mercado', express.static(join(__dirname, '../public/estudo-mercado')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/section-evaluations', sectionEvaluationsRoutes);
app.use('/api/admin-contacts', adminContactsRoutes);
app.use('/api/specialist-manuals', specialistManualsRoutes);
app.use('/api/folhetos', folhetosRoutes);
app.use('/api/estudo-mercado', estudoMercadoRoutes);
app.use('/api/analytics', analyticsRoutes);
// Non-API legacy route migrated to DOT Team Leader integrations
app.use('/dot-team-leader', dotTeamLeaderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
