const express = require('express');
const router = express.Router();
const fileStorage = require('../utils/fileStorage');

// Desafíos predefinidos del sistema
const SYSTEM_CHALLENGES = [
  {
    id: 'daily_streak',
    name: 'Racha Diaria',
    description: 'Mantén una racha de login de 7 días consecutivos',
    type: 'streak',
    difficulty: 'easy',
    status: 'active',
    requirements: {
      loginStreak: 7
    },
    rewards: {
      points: 100,
      experience: 50
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 días
    icon: '🔥'
  },
  {
    id: 'quiz_master',
    name: 'Maestro del Quiz',
    description: 'Completa 20 quizzes con 80% de precisión o más',
    type: 'performance',
    difficulty: 'medium',
    status: 'active',
    requirements: {
      quizzesCompleted: 20,
      minAccuracy: 0.8
    },
    rewards: {
      points: 200,
      experience: 100
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
    icon: '🎯'
  },
  {
    id: 'perfect_week',
    name: 'Semana Perfecta',
    description: 'Obtén 100% de aciertos en al menos 5 quizzes esta semana',
    type: 'performance',
    difficulty: 'hard',
    status: 'active',
    requirements: {
      perfectQuizzes: 5,
      timeframe: 7 // días
    },
    rewards: {
      points: 300,
      experience: 150
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 días
    icon: '⭐'
  },
  {
    id: 'subject_specialist',
    name: 'Especialista en Matemáticas',
    description: 'Completa 15 quizzes de Matemáticas con 90% de precisión',
    type: 'subject',
    difficulty: 'medium',
    status: 'active',
    requirements: {
      subject: 'Matemáticas',
      quizzesCompleted: 15,
      minAccuracy: 0.9
    },
    rewards: {
      points: 250,
      experience: 120
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
    icon: '🔢'
  },
  {
    id: 'speed_demon',
    name: 'Demonio de la Velocidad',
    description: 'Completa 3 quizzes en menos de 2 minutos cada uno con 70% de precisión',
    type: 'speed',
    difficulty: 'hard',
    status: 'active',
    requirements: {
      fastQuizzes: 3,
      maxTime: 120, // segundos
      minAccuracy: 0.7
    },
    rewards: {
      points: 400,
      experience: 200
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString(), // 14 días
    icon: '⚡'
  },
  {
    id: 'knowledge_explorer',
    name: 'Explorador del Conocimiento',
    description: 'Completa al menos 1 quiz en cada materia',
    type: 'exploration',
    difficulty: 'easy',
    status: 'active',
    requirements: {
      subjects: ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'],
      minQuizPerSubject: 1
    },
    rewards: {
      points: 150,
      experience: 80
    },
    progress: {},
    completedBy: [],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
    icon: '🌟'
  }
];

// GET /api/challenges - Obtener todos los desafíos
router.get('/', async (req, res) => {
  try {
    await initializeChallengeSystem();
    const challenges = await fileStorage.readFile('challenges');
    
    // Filtrar por estado si se especifica
    const { status } = req.query;
    let filteredChallenges = challenges;
    
    if (status) {
      filteredChallenges = challenges.filter(c => c.status === status);
    }
    
    res.json({
      success: true,
      data: filteredChallenges
    });

  } catch (error) {
    console.error('Error obteniendo desafíos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/challenges/user/:userId - Obtener progreso de desafíos de un usuario
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
    
    await initializeChallengeSystem();
    const challenges = await fileStorage.readFile('challenges');
    
    // Actualizar progreso de desafíos para este usuario
    const updatedChallenges = await updateUserChallengeProgress(userId);
    
    // Agregar información de progreso específica del usuario
    const challengesWithProgress = updatedChallenges.map(challenge => ({
      ...challenge,
      userProgress: challenge.progress[userId] || {},
      isCompleted: challenge.completedBy.includes(userId),
      canComplete: canCompleteChallenge(challenge, userId)
    }));
    
    res.json({
      success: true,
      data: challengesWithProgress
    });

  } catch (error) {
    console.error('Error obteniendo progreso de desafíos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/challenges/:id/complete - Completar un desafío
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario requerido'
      });
    }
    
    const challenges = await fileStorage.readFile('challenges');
    const challengeIndex = challenges.findIndex(c => c.id === id);
    
    if (challengeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Desafío no encontrado'
      });
    }
    
    const challenge = challenges[challengeIndex];
    
    // Verificar que no está ya completado
    if (challenge.completedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Ya has completado este desafío'
      });
    }
    
    // Verificar que cumple los requisitos
    const meetsRequirements = await checkChallengeRequirements(challenge, userId);
    
    if (!meetsRequirements) {
      return res.status(400).json({
        success: false,
        error: 'No cumples los requisitos para completar este desafío'
      });
    }
    
    // Marcar como completado
    challenge.completedBy.push(userId);
    
    // Aplicar recompensas al usuario
    await applyChallengeRewards(userId, challenge.rewards);
    
    challenges[challengeIndex] = challenge;
    await fileStorage.writeFile('challenges', challenges);
    
    res.json({
      success: true,
      data: {
        message: 'Desafío completado exitosamente',
        rewards: challenge.rewards,
        challenge: challenge
      }
    });

  } catch (error) {
    console.error('Error completando desafío:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/challenges/update-progress/:userId - Actualizar progreso de desafíos (llamado automáticamente)
router.post('/update-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameResult } = req.body; // Resultado del quiz recién completado
    
    const updatedChallenges = await updateUserChallengeProgress(userId, gameResult);
    const completedChallenges = await checkForCompletedChallenges(userId);
    
    res.json({
      success: true,
      data: {
        updatedChallenges,
        completedChallenges
      }
    });

  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares

async function initializeChallengeSystem() {
  try {
    const existingChallenges = await fileStorage.readFile('challenges');
    
    // Agregar desafíos del sistema que no existan
    for (const systemChallenge of SYSTEM_CHALLENGES) {
      const exists = existingChallenges.find(c => c.id === systemChallenge.id);
      if (!exists) {
        existingChallenges.push({
          ...systemChallenge,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await fileStorage.writeFile('challenges', existingChallenges);
  } catch (error) {
    console.error('Error inicializando sistema de desafíos:', error);
  }
}

async function updateUserChallengeProgress(userId, gameResult = null) {
  const challenges = await fileStorage.readFile('challenges');
  const users = await fileStorage.readFile('users');
  const user = users.find(u => u.id === userId);
  
  if (!user) return challenges;
  
  // Obtener estadísticas del usuario
  const userStats = await getUserStats(userId);
  
  // Actualizar progreso para cada desafío
  const updatedChallenges = challenges.map(challenge => {
    if (challenge.completedBy.includes(userId)) {
      return challenge; // Ya completado
    }
    
    if (!challenge.progress[userId]) {
      challenge.progress[userId] = {};
    }
    
    const progress = challenge.progress[userId];
    
    // Actualizar progreso según tipo de desafío
    switch (challenge.type) {
      case 'streak':
        progress.currentLoginStreak = user.loginStreak || 0;
        break;
        
      case 'performance':
        if (challenge.requirements.quizzesCompleted) {
          progress.quizzesCompleted = userStats.totalQuizzes || 0;
          progress.averageAccuracy = userStats.averageAccuracy || 0;
        }
        if (challenge.requirements.perfectQuizzes) {
          progress.perfectQuizzes = userStats.perfectQuizzes || 0;
        }
        break;
        
      case 'subject':
        const subject = challenge.requirements.subject;
        progress.subjectQuizzes = userStats.subjectStats?.[subject]?.quizzesCompleted || 0;
        progress.subjectAccuracy = userStats.subjectStats?.[subject]?.averageAccuracy || 0;
        break;
        
      case 'speed':
        progress.fastQuizzes = userStats.fastQuizzes || 0;
        break;
        
      case 'exploration':
        progress.subjects = {};
        challenge.requirements.subjects.forEach(subject => {
          progress.subjects[subject] = userStats.subjectStats?.[subject]?.quizzesCompleted || 0;
        });
        break;
    }
    
    return challenge;
  });
  
  await fileStorage.writeFile('challenges', updatedChallenges);
  return updatedChallenges;
}

async function checkChallengeRequirements(challenge, userId) {
  const userStats = await getUserStats(userId);
  const users = await fileStorage.readFile('users');
  const user = users.find(u => u.id === userId);
  
  switch (challenge.type) {
    case 'streak':
      return (user.loginStreak || 0) >= challenge.requirements.loginStreak;
      
    case 'performance':
      if (challenge.requirements.quizzesCompleted && challenge.requirements.minAccuracy) {
        return (userStats.totalQuizzes >= challenge.requirements.quizzesCompleted) &&
               (userStats.averageAccuracy >= challenge.requirements.minAccuracy);
      }
      if (challenge.requirements.perfectQuizzes) {
        return (userStats.perfectQuizzes || 0) >= challenge.requirements.perfectQuizzes;
      }
      break;
      
    case 'subject':
      const subjectData = userStats.subjectStats?.[challenge.requirements.subject];
      return subjectData &&
             (subjectData.quizzesCompleted >= challenge.requirements.quizzesCompleted) &&
             (subjectData.averageAccuracy >= challenge.requirements.minAccuracy);
             
    case 'speed':
      return (userStats.fastQuizzes || 0) >= challenge.requirements.fastQuizzes;
      
    case 'exploration':
      return challenge.requirements.subjects.every(subject => 
        (userStats.subjectStats?.[subject]?.quizzesCompleted || 0) >= challenge.requirements.minQuizPerSubject
      );
  }
  
  return false;
}

async function applyChallengeRewards(userId, rewards) {
  const users = await fileStorage.readFile('users');
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return;
  
  const user = users[userIndex];
  
  // Aplicar puntos
  if (rewards.points) {
    user.totalPoints = (user.totalPoints || 0) + rewards.points;
    user.dailyPoints = (user.dailyPoints || 0) + rewards.points;
  }
  
  // Aplicar experiencia (esto se podría distribuir entre materias)
  if (rewards.experience) {
    // Por simplicidad, lo agregaremos como puntos bonus
    user.totalPoints = (user.totalPoints || 0) + Math.floor(rewards.experience / 2);
  }
  
  users[userIndex] = user;
  await fileStorage.writeFile('users', users);
}

async function getUserStats(userId) {
  const allResults = await fileStorage.readFile('quiz_results');
  const userResults = allResults.filter(result => result.userId === userId);
  
  // Estadísticas básicas
  const totalQuizzes = userResults.length;
  const totalCorrectAnswers = userResults.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
  const totalQuestions = userResults.reduce((sum, r) => sum + (r.totalQuestions || 10), 0);
  const averageAccuracy = totalQuestions > 0 ? totalCorrectAnswers / totalQuestions : 0;
  
  // Quiz perfectos
  const perfectQuizzes = userResults.filter(r => 
    (r.correctAnswers || 0) === (r.totalQuestions || 10)
  ).length;
  
  // Quizzes rápidos (menos de 2 minutos con 70% precisión)
  const fastQuizzes = userResults.filter(r => 
    (r.timeSpent || 0) < 120 && 
    ((r.correctAnswers || 0) / (r.totalQuestions || 10)) >= 0.7
  ).length;
  
  // Estadísticas por materia
  const subjects = ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'];
  const subjectStats = {};
  
  subjects.forEach(subject => {
    const subjectResults = userResults.filter(r => r.subject === subject);
    const correctAnswers = subjectResults.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
    const totalQuestions = subjectResults.reduce((sum, r) => sum + (r.totalQuestions || 10), 0);
    
    subjectStats[subject] = {
      quizzesCompleted: subjectResults.length,
      averageAccuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0
    };
  });
  
  return {
    totalQuizzes,
    averageAccuracy,
    perfectQuizzes,
    fastQuizzes,
    subjectStats
  };
}

function canCompleteChallenge(challenge, userId) {
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  
  return challenge.status === 'active' && 
         now <= endDate && 
         !challenge.completedBy.includes(userId);
}

async function checkForCompletedChallenges(userId) {
  const challenges = await fileStorage.readFile('challenges');
  const completedChallenges = [];
  
  for (const challenge of challenges) {
    if (!challenge.completedBy.includes(userId)) {
      const meetsRequirements = await checkChallengeRequirements(challenge, userId);
      if (meetsRequirements) {
        completedChallenges.push(challenge);
      }
    }
  }
  
  return completedChallenges;
}

module.exports = router;