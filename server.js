const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rutas
const questionsRouter = require('./routes/questions');
const usersRouter = require('./routes/users');
const rankingRouter = require('./routes/ranking');
const quizRouter = require('./routes/quiz');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');
const badgesRouter = require('./routes/badges');
const partsRouter = require('./routes/parts');
const subscriptionsRouter = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana de tiempo por IP
});
app.use('/api/', limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos para el dashboard admin
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas API
app.use('/api/questions', questionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/ranking', rankingRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/parts', partsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'Quiz Backend API v1.0.0',
    endpoints: [
      '/api/health',
      '/api/questions',
      '/api/users',
      '/api/ranking',
      '/api/quiz',
      '/api/stats',
      '/api/badges',
      '/api/subscriptions'
    ],
    admin: {
      dashboard: '/admin',
      description: 'Panel de administración para gestionar usuarios y ver estadísticas'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}/api`);
  console.log(`💊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Dashboard Admin: http://localhost:${PORT}/admin`);
});