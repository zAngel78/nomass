const express = require('express');
const router = express.Router();
const fileStorage = require('../utils/fileStorage');

// GET /api/stats/user/:userId - Obtener estadísticas de un usuario específico
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

        // Obtener todos los resultados de quiz del usuario
        const allResults = await fileStorage.readFile('quiz_results');
        const userResults = allResults.filter(result => result.userId === userId);

        // Calcular estadísticas generales
        const totalQuizzes = userResults.length;
        const totalTimeSpent = userResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0);
        const totalCorrectAnswers = userResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0);
        const totalQuestions = userResults.reduce((sum, result) => sum + (result.totalQuestions || 10), 0);
        const averageAccuracy = totalQuestions > 0 ? totalCorrectAnswers / totalQuestions : 0;

        // Estadísticas por materia
        const subjectStats = {};
        const subjects = ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'];
        
        subjects.forEach(subject => {
            const subjectResults = userResults.filter(result => result.subject === subject);
            const subjectCorrectAnswers = subjectResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0);
            const subjectTotalQuestions = subjectResults.reduce((sum, result) => sum + (result.totalQuestions || 10), 0);
            const subjectAccuracy = subjectTotalQuestions > 0 ? subjectCorrectAnswers / subjectTotalQuestions : 0;
            const bestScore = subjectResults.length > 0 ? Math.max(...subjectResults.map(r => r.score || 0)) : 0;
            const avgScore = subjectResults.length > 0 ? subjectResults.reduce((sum, r) => sum + (r.score || 0), 0) / subjectResults.length : 0;

            subjectStats[subject] = {
                quizzesCompleted: subjectResults.length,
                averageAccuracy: subjectAccuracy,
                bestScore,
                averageScore: avgScore,
                totalTimeSpent: subjectResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
            };
        });

        // Actividad diaria (últimos 30 días)
        const now = new Date();
        const dailyActivity = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            dailyActivity[dateStr] = 0;
        }

        // Contar actividad por día
        userResults.forEach(result => {
            if (result.completedAt) {
                const resultDate = new Date(result.completedAt).toISOString().split('T')[0];
                if (dailyActivity.hasOwnProperty(resultDate)) {
                    dailyActivity[resultDate]++;
                }
            }
        });

        // Generar recomendaciones
        const recommendations = generateRecommendations(user, subjectStats, userResults);

        // Calcular sesiones (días únicos con actividad)
        const uniqueDates = new Set();
        userResults.forEach(result => {
            if (result.completedAt) {
                const date = new Date(result.completedAt).toISOString().split('T')[0];
                uniqueDates.add(date);
            }
        });

        const statsData = {
            totalQuizzes,
            averageAccuracy,
            totalSessions: uniqueDates.size,
            totalTimeSpent: Math.round(totalTimeSpent / 60), // Convertir a minutos
            subjectStats,
            dailyActivity,
            recommendations,
            user: {
                name: user.name,
                avatar: user.avatar,
                totalPoints: user.totalPoints || 0,
                loginStreak: user.loginStreak || 0
            }
        };

        res.json({
            success: true,
            data: statsData
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/stats/global - Obtener estadísticas globales del sistema
router.get('/global', async (req, res) => {
    try {
        const allUsers = await fileStorage.readFile('users');
        const allResults = await fileStorage.readFile('quiz_results');

        const totalUsers = allUsers.length;
        const totalQuizzes = allResults.length;
        const totalQuestions = allResults.reduce((sum, result) => sum + (result.totalQuestions || 10), 0);
        const totalCorrectAnswers = allResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0);
        const globalAccuracy = totalQuestions > 0 ? totalCorrectAnswers / totalQuestions : 0;

        // Top usuarios por puntos
        const topUsers = allUsers
            .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
            .slice(0, 10)
            .map(user => ({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                totalPoints: user.totalPoints || 0
            }));

        // Estadísticas por materia a nivel global
        const subjects = ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'];
        const globalSubjectStats = {};

        subjects.forEach(subject => {
            const subjectResults = allResults.filter(result => result.subject === subject);
            const subjectCorrectAnswers = subjectResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0);
            const subjectTotalQuestions = subjectResults.reduce((sum, result) => sum + (result.totalQuestions || 10), 0);
            const subjectAccuracy = subjectTotalQuestions > 0 ? subjectCorrectAnswers / subjectTotalQuestions : 0;

            globalSubjectStats[subject] = {
                totalQuizzes: subjectResults.length,
                averageAccuracy: subjectAccuracy,
                averageScore: subjectResults.length > 0 ? subjectResults.reduce((sum, r) => sum + (r.score || 0), 0) / subjectResults.length : 0
            };
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                totalQuizzes,
                globalAccuracy,
                topUsers,
                subjectStats: globalSubjectStats
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas globales:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Función para generar recomendaciones personalizadas
function generateRecommendations(user, subjectStats, userResults) {
    const recommendations = [];

    // Recomendaciones basadas en precisión por materia
    Object.entries(subjectStats).forEach(([subject, stats]) => {
        if (stats.quizzesCompleted > 0 && stats.averageAccuracy < 0.7) {
            recommendations.push(`Practica más ${subject} para mejorar tu precisión (${(stats.averageAccuracy * 100).toFixed(1)}%)`);
        }
    });

    // Recomendación de racha de login
    const loginStreak = user.loginStreak || 0;
    if (loginStreak < 3) {
        recommendations.push('¡Mantén una racha de login diaria para obtener bonificaciones!');
    } else if (loginStreak >= 7) {
        recommendations.push('¡Excelente racha de login! Sigue así para mantener tu progreso.');
    }

    // Recomendaciones basadas en actividad reciente
    const recentResults = userResults.filter(result => {
        if (!result.completedAt) return false;
        const resultDate = new Date(result.completedAt);
        const threeDaysAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
        return resultDate > threeDaysAgo;
    });

    if (recentResults.length === 0) {
        recommendations.push('¡Es hora de practicar! No has jugado en los últimos días.');
    } else if (recentResults.length > 10) {
        recommendations.push('¡Excelente actividad! Estás en el camino correcto.');
    }

    // Recomendación de materia menos practicada
    const leastPracticedSubject = Object.entries(subjectStats)
        .sort(([,a], [,b]) => a.quizzesCompleted - b.quizzesCompleted)[0];
    
    if (leastPracticedSubject && leastPracticedSubject[1].quizzesCompleted < 5) {
        recommendations.push(`Considera practicar ${leastPracticedSubject[0]} - es tu materia menos practicada.`);
    }

    // Si no hay recomendaciones, agregar una genérica positiva
    if (recommendations.length === 0) {
        recommendations.push('¡Sigue practicando! Tu progreso es consistente.');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
}

module.exports = router;