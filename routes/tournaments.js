const express = require('express');
const router = express.Router();
const fileStorage = require('../utils/fileStorage');

// Torneos predefinidos del sistema
const SYSTEM_TOURNAMENTS = [
  {
    id: 'weekly_math',
    name: 'Torneo Semanal de Matemáticas',
    description: 'Competencia semanal para demostrar tus habilidades matemáticas',
    subject: 'Matemáticas',
    type: 'weekly',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 días
    participants: [],
    maxParticipants: 100,
    prize: {
      first: 500,
      second: 300,
      third: 200
    },
    rules: [
      'Solo se permite una participación por usuario',
      'Se evaluará la puntuación total obtenida en quizzes del tema',
      'En caso de empate, gana quien haya completado primero'
    ]
  },
  {
    id: 'monthly_general',
    name: 'Torneo Mensual General',
    description: 'El gran torneo mensual con todas las materias',
    subject: 'General',
    type: 'monthly', 
    status: 'upcoming',
    startDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // En 7 días
    endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // En 30 días
    participants: [],
    maxParticipants: 200,
    prize: {
      first: 1000,
      second: 600,
      third: 400
    },
    rules: [
      'Competencia con todas las materias',
      'Se suma la puntuación de todas las materias',
      'Duración: todo el mes'
    ]
  },
  {
    id: 'speed_challenge',
    name: 'Desafío de Velocidad',
    description: 'Torneo especial de velocidad y precisión',
    subject: 'General',
    type: 'special',
    status: 'finished',
    startDate: new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)).toISOString(), // Hace 14 días
    endDate: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(), // Hace 7 días
    participants: [
      { userId: 'user1', name: 'Ana García', score: 850, completedAt: new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString() },
      { userId: 'user2', name: 'Carlos Ruiz', score: 780, completedAt: new Date(Date.now() - (9 * 24 * 60 * 60 * 1000)).toISOString() },
      { userId: 'user3', name: 'María López', score: 720, completedAt: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString() }
    ],
    maxParticipants: 50,
    prize: {
      first: 300,
      second: 200,
      third: 100
    },
    rules: [
      'Máximo tiempo por quiz: 3 minutos',
      'Se prioriza velocidad y precisión',
      'Solo 1 intento por participante'
    ]
  }
];

// GET /api/tournaments - Obtener todos los torneos
router.get('/', async (req, res) => {
  try {
    await initializeTournamentSystem();
    const tournaments = await fileStorage.readFile('tournaments');
    
    // Actualizar estados de torneos
    const updatedTournaments = updateTournamentStatuses(tournaments);
    await fileStorage.writeFile('tournaments', updatedTournaments);
    
    // Filtrar por estado si se especifica
    const { status } = req.query;
    let filteredTournaments = updatedTournaments;
    
    if (status) {
      filteredTournaments = updatedTournaments.filter(t => t.status === status);
    }
    
    res.json({
      success: true,
      data: filteredTournaments
    });

  } catch (error) {
    console.error('Error obteniendo torneos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/tournaments/:id - Obtener un torneo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tournaments = await fileStorage.readFile('tournaments');
    const tournament = tournaments.find(t => t.id === id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Torneo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: tournament
    });

  } catch (error) {
    console.error('Error obteniendo torneo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tournaments/:id/join - Unirse a un torneo
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario requerido'
      });
    }
    
    // Verificar que el usuario existe
    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const tournaments = await fileStorage.readFile('tournaments');
    const tournamentIndex = tournaments.findIndex(t => t.id === id);
    
    if (tournamentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Torneo no encontrado'
      });
    }
    
    const tournament = tournaments[tournamentIndex];
    
    // Verificar que el torneo está activo
    if (tournament.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'El torneo no está activo'
      });
    }
    
    // Verificar que no está ya participando
    const alreadyParticipating = tournament.participants.some(p => p.userId === userId);
    if (alreadyParticipating) {
      return res.status(400).json({
        success: false,
        error: 'Ya estás participando en este torneo'
      });
    }
    
    // Verificar límite de participantes
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Torneo lleno'
      });
    }
    
    // Agregar participante
    tournament.participants.push({
      userId: user.id,
      name: user.name,
      avatar: user.avatar || '👤',
      score: 0,
      joinedAt: new Date().toISOString()
    });
    
    tournaments[tournamentIndex] = tournament;
    await fileStorage.writeFile('tournaments', tournaments);
    
    res.json({
      success: true,
      data: {
        message: 'Te has unido al torneo exitosamente',
        tournament: tournament
      }
    });

  } catch (error) {
    console.error('Error uniéndose al torneo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tournaments/:id/score - Actualizar puntuación en torneo
router.post('/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, score } = req.body;
    
    if (!userId || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario y puntuación requeridos'
      });
    }
    
    const tournaments = await fileStorage.readFile('tournaments');
    const tournamentIndex = tournaments.findIndex(t => t.id === id);
    
    if (tournamentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Torneo no encontrado'
      });
    }
    
    const tournament = tournaments[tournamentIndex];
    const participantIndex = tournament.participants.findIndex(p => p.userId === userId);
    
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'No estás participando en este torneo'
      });
    }
    
    // Actualizar puntuación (sumar si es un torneo acumulativo)
    tournament.participants[participantIndex].score += score;
    tournament.participants[participantIndex].lastUpdate = new Date().toISOString();
    
    // Ordenar participantes por puntuación
    tournament.participants.sort((a, b) => b.score - a.score);
    
    tournaments[tournamentIndex] = tournament;
    await fileStorage.writeFile('tournaments', tournaments);
    
    res.json({
      success: true,
      data: {
        message: 'Puntuación actualizada',
        newScore: tournament.participants[participantIndex].score,
        position: participantIndex + 1
      }
    });

  } catch (error) {
    console.error('Error actualizando puntuación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/tournaments/:id/leaderboard - Obtener tabla de posiciones
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const tournaments = await fileStorage.readFile('tournaments');
    const tournament = tournaments.find(t => t.id === id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Torneo no encontrado'
      });
    }
    
    // Ordenar participantes por puntuación
    const leaderboard = [...tournament.participants]
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => ({
        ...participant,
        position: index + 1
      }));
    
    res.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status
        },
        leaderboard
      }
    });

  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares

async function initializeTournamentSystem() {
  try {
    const existingTournaments = await fileStorage.readFile('tournaments');
    
    // Agregar torneos del sistema que no existan
    for (const systemTournament of SYSTEM_TOURNAMENTS) {
      const exists = existingTournaments.find(t => t.id === systemTournament.id);
      if (!exists) {
        existingTournaments.push({
          ...systemTournament,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await fileStorage.writeFile('tournaments', existingTournaments);
  } catch (error) {
    console.error('Error inicializando sistema de torneos:', error);
  }
}

function updateTournamentStatuses(tournaments) {
  const now = new Date();
  
  return tournaments.map(tournament => {
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    let newStatus = tournament.status;
    
    if (now < startDate) {
      newStatus = 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      newStatus = 'active';
    } else if (now > endDate) {
      newStatus = 'finished';
    }
    
    return {
      ...tournament,
      status: newStatus
    };
  });
}

module.exports = router;