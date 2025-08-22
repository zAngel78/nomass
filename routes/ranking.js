const express = require('express');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// GET /api/ranking - Obtener ranking global
router.get('/', async (req, res) => {
  try {
    const { limit = 10, subject } = req.query;
    const users = await fileStorage.readFile('users');

    let sortedUsers;
    
    if (subject) {
      // Ranking por materia específica
      sortedUsers = users
        .filter(user => user.subjectScores[subject])
        .map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          score: user.subjectScores[subject].score,
          gamesPlayed: user.subjectScores[subject].gamesPlayed,
          bestScore: user.subjectScores[subject].bestScore,
          accuracy: user.subjectScores[subject].gamesPlayed > 0 
            ? (user.subjectScores[subject].correctAnswers / (user.subjectScores[subject].gamesPlayed * 10)) * 100
            : 0
        }))
        .sort((a, b) => b.score - a.score);
    } else {
      // Ranking global por puntos totales
      sortedUsers = users
        .map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          totalPoints: user.totalPoints,
          dailyPoints: user.dailyPoints,
          loginStreak: user.loginStreak,
          lastLogin: user.lastLogin
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // Agregar posición en el ranking
    const ranking = sortedUsers.slice(0, parseInt(limit)).map((user, index) => ({
      position: index + 1,
      ...user
    }));

    res.json({
      success: true,
      count: ranking.length,
      total: users.length,
      subject: subject || 'global',
      data: ranking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo ranking',
      message: error.message
    });
  }
});

// GET /api/ranking/user/:id - Obtener posición de un usuario específico
router.get('/user/:id', async (req, res) => {
  try {
    const { subject } = req.query;
    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    let position;
    let totalUsers;

    if (subject) {
      const subjectUsers = users
        .filter(u => u.subjectScores[subject])
        .sort((a, b) => b.subjectScores[subject].score - a.subjectScores[subject].score);
      
      position = subjectUsers.findIndex(u => u.id === req.params.id) + 1;
      totalUsers = subjectUsers.length;
    } else {
      const sortedUsers = users.sort((a, b) => b.totalPoints - a.totalPoints);
      position = sortedUsers.findIndex(u => u.id === req.params.id) + 1;
      totalUsers = users.length;
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        position: position,
        totalUsers: totalUsers,
        subject: subject || 'global',
        score: subject ? (user.subjectScores[subject]?.score || 0) : user.totalPoints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo posición del usuario',
      message: error.message
    });
  }
});

// GET /api/ranking/stats - Obtener estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const users = await fileStorage.readFile('users');
    const questions = await fileStorage.readFile('questions');

    // Estadísticas generales
    const stats = {
      totalUsers: users.length,
      totalQuestions: questions.length,
      activeUsers: users.filter(u => {
        const lastLogin = new Date(u.lastLogin);
        const now = new Date();
        const diffHours = Math.abs(now - lastLogin) / (1000 * 60 * 60);
        return diffHours <= 24; // Activos en las últimas 24 horas
      }).length,
      totalGamesPlayed: users.reduce((sum, user) => {
        return sum + Object.values(user.subjectScores || {}).reduce((subSum, subject) => {
          return subSum + (subject.gamesPlayed || 0);
        }, 0);
      }, 0)
    };

    // Estadísticas por materia
    const subjects = [...new Set(questions.map(q => q.subject))];
    const subjectStats = {};

    subjects.forEach(subject => {
      const subjectQuestions = questions.filter(q => q.subject === subject);
      const usersWithSubject = users.filter(u => u.subjectScores[subject]);
      
      subjectStats[subject] = {
        questions: subjectQuestions.length,
        playersCount: usersWithSubject.length,
        totalGamesPlayed: usersWithSubject.reduce((sum, user) => {
          return sum + (user.subjectScores[subject]?.gamesPlayed || 0);
        }, 0),
        averageScore: usersWithSubject.length > 0 
          ? usersWithSubject.reduce((sum, user) => {
              return sum + (user.subjectScores[subject]?.score || 0);
            }, 0) / usersWithSubject.length
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        general: stats,
        bySubject: subjectStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

// GET /api/ranking/leaderboard/:subject - Obtener tabla de líderes por materia
router.get('/leaderboard/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { period = 'all' } = req.query; // all, weekly, monthly
    const users = await fileStorage.readFile('users');

    const leaderboard = users
      .filter(user => user.subjectScores[subject])
      .map(user => {
        const subjectScore = user.subjectScores[subject];
        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          score: subjectScore.score,
          gamesPlayed: subjectScore.gamesPlayed,
          bestScore: subjectScore.bestScore,
          accuracy: subjectScore.gamesPlayed > 0 
            ? Math.round((subjectScore.correctAnswers / (subjectScore.gamesPlayed * 10)) * 100)
            : 0,
          lastPlayed: user.updated_at
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Top 20
      .map((user, index) => ({
        position: index + 1,
        ...user
      }));

    res.json({
      success: true,
      subject: subject,
      period: period,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo tabla de líderes',
      message: error.message
    });
  }
});

module.exports = router;