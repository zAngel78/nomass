const express = require('express');
const router = express.Router();
const fileStorage = require('../utils/fileStorage');

// Definir badges del sistema (estos se crean automáticamente si no existen)
const SYSTEM_BADGES = [
  // Badges de Inicio
  {
    id: 'first_quiz',
    name: 'Primer Paso',
    description: 'Completa tu primer quiz',
    icon: '🎯',
    rarity: 'common',
    type: 'achievement',
    requirements: { gamesPlayed: 1 }
  },
  {
    id: 'login_streak_3',
    name: 'Constante',
    description: 'Mantén una racha de login de 3 días',
    icon: '🔥',
    rarity: 'common',
    type: 'streak',
    requirements: { loginStreak: 3 }
  },
  {
    id: 'login_streak_7',
    name: 'Dedicado',
    description: 'Mantén una racha de login de 7 días',
    icon: '⚡',
    rarity: 'uncommon',
    type: 'streak',
    requirements: { loginStreak: 7 }
  },
  
  // Badges por Materia
  {
    id: 'math_master',
    name: 'Maestro Matemático',
    description: 'Obtén 90% de precisión en 10 quizzes de Matemáticas',
    icon: '🔢',
    rarity: 'rare',
    type: 'subject',
    requirements: { subject: 'Matemáticas', accuracy: 0.9, gamesPlayed: 10 }
  },
  {
    id: 'language_expert',
    name: 'Experto Lingüístico',
    description: 'Obtén 90% de precisión en 10 quizzes de Castellano y Guaraní',
    icon: '📝',
    rarity: 'rare',
    type: 'subject',
    requirements: { subject: 'Castellano y Guaraní', accuracy: 0.9, gamesPlayed: 10 }
  },
  {
    id: 'history_scholar',
    name: 'Erudito Histórico',
    description: 'Obtén 90% de precisión en 10 quizzes de Historia y Geografía',
    icon: '🌍',
    rarity: 'rare',
    type: 'subject',
    requirements: { subject: 'Historia y Geografía', accuracy: 0.9, gamesPlayed: 10 }
  },
  {
    id: 'law_expert',
    name: 'Experto Legal',
    description: 'Obtén 90% de precisión en 10 quizzes de Legislación',
    icon: '⚖️',
    rarity: 'rare',
    type: 'subject',
    requirements: { subject: 'Legislación', accuracy: 0.9, gamesPlayed: 10 }
  },
  
  // Badges de Puntuación
  {
    id: 'score_100',
    name: 'Centurión',
    description: 'Alcanza 100 puntos totales',
    icon: '💯',
    rarity: 'common',
    type: 'score',
    requirements: { totalPoints: 100 }
  },
  {
    id: 'score_500',
    name: 'Veterano',
    description: 'Alcanza 500 puntos totales',
    icon: '🏆',
    rarity: 'uncommon',
    type: 'score',
    requirements: { totalPoints: 500 }
  },
  {
    id: 'score_1000',
    name: 'Campeón',
    description: 'Alcanza 1000 puntos totales',
    icon: '🥇',
    rarity: 'rare',
    type: 'score',
    requirements: { totalPoints: 1000 }
  },
  {
    id: 'score_2500',
    name: 'Leyenda',
    description: 'Alcanza 2500 puntos totales',
    icon: '👑',
    rarity: 'epic',
    type: 'score',
    requirements: { totalPoints: 2500 }
  },
  
  // Badges Especiales
  {
    id: 'perfect_quiz',
    name: 'Perfección',
    description: 'Completa un quiz con 100% de aciertos',
    icon: '✨',
    rarity: 'uncommon',
    type: 'performance',
    requirements: { perfectQuiz: true }
  },
  {
    id: 'quiz_marathon',
    name: 'Maratonista',
    description: 'Completa 50 quizzes',
    icon: '🏃',
    rarity: 'epic',
    type: 'achievement',
    requirements: { gamesPlayed: 50 }
  }
];

// Colores por rareza
const RARITY_COLORS = {
  common: '#8D8D8D',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF6D00'
};

// GET /api/badges/user/:userId - Obtener badges de un usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Inicializar sistema de badges si no existe
    await initializeBadgeSystem();

    // Obtener todos los badges del sistema
    const allBadges = await fileStorage.readFile('badges');
    
    // Obtener badges desbloqueados del usuario
    const userBadges = user.badges || [];
    
    // Obtener estadísticas del usuario para verificar badges
    const userStats = await calculateUserStats(userId);
    
    // Verificar y actualizar badges desbloqueados
    const updatedBadges = await checkAndUnlockBadges(userId, userStats);
    
    // Preparar respuesta con todos los badges marcados como desbloqueados o no
    const badgesWithStatus = allBadges.map(badge => {
      const unlockedBadge = updatedBadges.find(ub => ub.id === badge.id);
      return {
        ...badge,
        isUnlocked: !!unlockedBadge,
        unlockedAt: unlockedBadge ? unlockedBadge.unlockedAt : null,
        rarityColor: RARITY_COLORS[badge.rarity] || RARITY_COLORS.common,
        rarityName: getRarityDisplayName(badge.rarity)
      };
    });

    // Agrupar por rareza
    const badgesByRarity = {};
    badgesWithStatus.forEach(badge => {
      if (!badgesByRarity[badge.rarity]) {
        badgesByRarity[badge.rarity] = [];
      }
      badgesByRarity[badge.rarity].push(badge);
    });

    // Calcular estadísticas
    const totalBadges = allBadges.length;
    const unlockedCount = updatedBadges.length;
    const completionPercentage = totalBadges > 0 ? (unlockedCount / totalBadges) * 100 : 0;

    res.json({
      success: true,
      data: {
        badgesByRarity,
        stats: {
          total: totalBadges,
          unlocked: unlockedCount,
          remaining: totalBadges - unlockedCount,
          completionPercentage: Math.round(completionPercentage * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo badges del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/badges/system - Obtener todos los badges del sistema
router.get('/system', async (req, res) => {
  try {
    await initializeBadgeSystem();
    const badges = await fileStorage.readFile('badges');
    
    const badgesWithColors = badges.map(badge => ({
      ...badge,
      rarityColor: RARITY_COLORS[badge.rarity] || RARITY_COLORS.common,
      rarityName: getRarityDisplayName(badge.rarity)
    }));

    res.json({
      success: true,
      data: badgesWithColors
    });

  } catch (error) {
    console.error('Error obteniendo badges del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/badges/check/:userId - Verificar y desbloquear badges para un usuario
router.post('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const userStats = await calculateUserStats(userId);
    const newBadges = await checkAndUnlockBadges(userId, userStats);

    res.json({
      success: true,
      data: {
        newBadges,
        totalBadges: (user.badges || []).length + newBadges.filter(badge => 
          !(user.badges || []).some(ub => ub.id === badge.id)
        ).length
      }
    });

  } catch (error) {
    console.error('Error verificando badges:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares

async function initializeBadgeSystem() {
  try {
    const existingBadges = await fileStorage.readFile('badges');
    
    // Solo agregar badges que no existan
    for (const systemBadge of SYSTEM_BADGES) {
      const exists = existingBadges.find(badge => badge.id === systemBadge.id);
      if (!exists) {
        existingBadges.push({
          ...systemBadge,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await fileStorage.writeFile('badges', existingBadges);
  } catch (error) {
    console.error('Error inicializando sistema de badges:', error);
  }
}

async function calculateUserStats(userId) {
  const allResults = await fileStorage.readFile('quiz_results');
  const userResults = allResults.filter(result => result.userId === userId);
  const users = await fileStorage.readFile('users');
  const user = users.find(u => u.id === userId);

  // Estadísticas básicas
  const totalGames = userResults.length;
  const totalPoints = user.totalPoints || 0;
  const loginStreak = user.loginStreak || 0;

  // Estadísticas por materia
  const subjectStats = {};
  const subjects = ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'];
  
  subjects.forEach(subject => {
    const subjectResults = userResults.filter(r => r.subject === subject);
    const correctAnswers = subjectResults.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
    const totalQuestions = subjectResults.reduce((sum, r) => sum + (r.totalQuestions || 10), 0);
    
    subjectStats[subject] = {
      gamesPlayed: subjectResults.length,
      accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
      results: subjectResults
    };
  });

  // Verificar quiz perfecto
  const hasPerfectQuiz = userResults.some(result => 
    (result.correctAnswers || 0) === (result.totalQuestions || 10)
  );

  return {
    totalGames,
    totalPoints,
    loginStreak,
    subjectStats,
    hasPerfectQuiz,
    user
  };
}

async function checkAndUnlockBadges(userId, userStats) {
  const users = await fileStorage.readFile('users');
  const user = users.find(u => u.id === userId);
  const currentBadges = user.badges || [];
  const allBadges = await fileStorage.readFile('badges');
  const newlyUnlocked = [];

  for (const badge of allBadges) {
    // Skip si ya está desbloqueado
    if (currentBadges.some(ub => ub.id === badge.id)) {
      continue;
    }

    let shouldUnlock = false;

    // Verificar requisitos según tipo
    switch (badge.type) {
      case 'achievement':
        if (badge.requirements.gamesPlayed && userStats.totalGames >= badge.requirements.gamesPlayed) {
          shouldUnlock = true;
        }
        break;

      case 'streak':
        if (badge.requirements.loginStreak && userStats.loginStreak >= badge.requirements.loginStreak) {
          shouldUnlock = true;
        }
        break;

      case 'subject':
        const subjectData = userStats.subjectStats[badge.requirements.subject];
        if (subjectData && 
            subjectData.gamesPlayed >= badge.requirements.gamesPlayed &&
            subjectData.accuracy >= badge.requirements.accuracy) {
          shouldUnlock = true;
        }
        break;

      case 'score':
        if (badge.requirements.totalPoints && userStats.totalPoints >= badge.requirements.totalPoints) {
          shouldUnlock = true;
        }
        break;

      case 'performance':
        if (badge.requirements.perfectQuiz && userStats.hasPerfectQuiz) {
          shouldUnlock = true;
        }
        break;
    }

    if (shouldUnlock) {
      const unlockedBadge = {
        id: badge.id,
        unlockedAt: new Date().toISOString()
      };
      
      newlyUnlocked.push(unlockedBadge);
      currentBadges.push(unlockedBadge);
    }
  }

  // Actualizar usuario con nuevos badges
  if (newlyUnlocked.length > 0) {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, badges: currentBadges } : u
    );
    await fileStorage.writeFile('users', updatedUsers);
  }

  return currentBadges;
}

function getRarityDisplayName(rarity) {
  const names = {
    common: 'Común',
    uncommon: 'Poco Común',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Legendario'
  };
  return names[rarity] || 'Desconocido';
}

module.exports = router;