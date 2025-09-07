const express = require('express');
const examPartsManager = require('../utils/examPartsManager');
const questionLoader = require('../utils/questionLoader');

const router = express.Router();

// GET /api/parts/:subject/:examType - Obtener información de partes disponibles
router.get('/:subject/:examType', async (req, res) => {
    try {
        const { subject, examType } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere userId como parámetro de query'
            });
        }

        // Obtener todas las preguntas de la materia y tipo
        const allQuestions = await questionLoader.getQuestionsBySubjectAndType(subject, examType);
        
        if (allQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No se encontraron preguntas para ${subject} - ${examType}`
            });
        }

        // Obtener información de las partes
        const partsInfo = await examPartsManager.getPartsInfo(userId, subject, examType, allQuestions.length);
        const subjectConfig = examPartsManager.getSubjectConfig(subject);

        res.json({
            success: true,
            data: {
                subject,
                examType,
                totalQuestions: allQuestions.length,
                questionsPerPart: subjectConfig.questionsPerPart,
                unlockThreshold: Math.round(subjectConfig.unlockThreshold * 100),
                parts: partsInfo
            }
        });

    } catch (error) {
        console.error('Error obteniendo partes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// POST /api/parts/generate - Generar quiz para una parte específica
router.post('/generate', async (req, res) => {
    try {
        const { subject, examType, partNumber, userId } = req.body;

        if (!subject || !examType || !partNumber || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: subject, examType, partNumber, userId'
            });
        }

        // Verificar que el usuario tenga acceso a esta parte
        const userProgress = await examPartsManager.getUserProgress(userId, subject, examType);
        const partKey = `parte${partNumber}`;
        const partProgress = userProgress.progress[partKey];

        if (!partProgress || !partProgress.unlocked) {
            return res.status(403).json({
                success: false,
                error: 'Esta parte aún no está desbloqueada'
            });
        }

        // Obtener todas las preguntas de la materia
        const allQuestions = await questionLoader.getQuestionsBySubjectAndType(subject, examType);
        
        if (allQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No se encontraron preguntas para ${subject} - ${examType}`
            });
        }

        // Obtener preguntas para la parte específica
        const partQuestions = examPartsManager.getQuestionsForPart(allQuestions, partNumber, subject);

        if (partQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `La parte ${partNumber} no tiene preguntas disponibles`
            });
        }

        // Crear el quiz
        const quiz = {
            id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            subject,
            examType,
            partNumber,
            partTitle: `${subject} ${examType} - Parte ${partNumber}`,
            questions: partQuestions,
            totalQuestions: partQuestions.length,
            startTime: new Date().toISOString(),
            timeLimit: getTimeLimitForSubject(subject),
            hasTimeLimit: hasTimeLimitForSubject(subject),
            metadata: {
                userId,
                questionsRange: `${((partNumber-1) * examPartsManager.QUESTIONS_PER_PART) + 1}-${((partNumber-1) * examPartsManager.QUESTIONS_PER_PART) + partQuestions.length}`,
                attempts: partProgress.attempts + 1,
                isRetake: partProgress.attempts > 0
            }
        };

        res.json({
            success: true,
            message: `Quiz generado para ${quiz.partTitle}`,
            data: quiz
        });

    } catch (error) {
        console.error('Error generando quiz de parte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// POST /api/parts/complete - Completar una parte y actualizar progreso
router.post('/complete', async (req, res) => {
    try {
        console.log('🎯 POST /api/parts/complete recibido');
        console.log('🎯 Body completo:', JSON.stringify(req.body, null, 2));
        
        const { userId, subject, examType, partNumber, score, totalQuestions, answers, timeSpent } = req.body;
        
        console.log('🎯 Datos extraídos:');
        console.log('   userId:', typeof userId, `"${userId}"`);
        console.log('   subject:', typeof subject, `"${subject}"`);
        console.log('   examType:', typeof examType, `"${examType}"`);
        console.log('   partNumber:', typeof partNumber, partNumber);

        if (!userId || !subject || !examType || !partNumber || score === undefined || !totalQuestions) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: userId, subject, examType, partNumber, score, totalQuestions'
            });
        }

        // Completar la parte y actualizar progreso
        const result = await examPartsManager.completePart(userId, subject, examType, partNumber, score, totalQuestions);

        // Obtener información actualizada de las partes
        const allQuestions = await questionLoader.getQuestionsBySubjectAndType(subject, examType);
        const partsInfo = await examPartsManager.getPartsInfo(userId, subject, examType, allQuestions.length);

        // Crear registro del resultado
        const partResult = {
            id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            subject,
            examType,
            partNumber,
            score,
            totalQuestions,
            accuracy: result.accuracy,
            timeSpent: timeSpent || 0,
            answers: answers || [],
            completedAt: new Date().toISOString(),
            metadata: {
                partCompleted: result.partCompleted,
                nextPartUnlocked: result.nextPartUnlocked,
                attempts: result.attempts,
                bestScore: result.bestScore
            }
        };

        // Guardar resultado (opcional, para histórico)
        try {
            const fileStorage = require('../utils/fileStorage');
            await fileStorage.appendToFile('part_results', partResult);
        } catch (error) {
            console.warn('No se pudo guardar el resultado de la parte:', error.message);
        }

        // Crear mensaje con información de puntos
        let message = result.partCompleted ? 
            `¡Parte ${partNumber} completada exitosamente! +${result.pointsEarned} puntos` : 
            `Parte ${partNumber} completada. Necesitas 70% para desbloquear la siguiente.`;
            
        if (result.allPartsCompleted) {
            message += ` 🎉 ¡Completaste todas las partes de ${subject}! Total: 20 puntos ganados.`;
        }

        res.json({
            success: true,
            message: message,
            data: {
                result: partResult,
                progress: result,
                updatedParts: partsInfo,
                pointsEarned: result.pointsEarned,
                allPartsCompleted: result.allPartsCompleted,
                totalParts: result.totalParts,
                completedParts: result.completedParts,
                nextAction: result.nextPartUnlocked ? 'next_part_available' : 'retry_or_continue'
            }
        });

    } catch (error) {
        console.error('Error completando parte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// GET /api/parts/progress/:userId - Obtener progreso general del usuario
router.get('/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await examPartsManager.getProgressStats(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error obteniendo progreso general:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// DELETE /api/parts/reset - Resetear progreso de una materia específica
router.delete('/reset', async (req, res) => {
    try {
        const { userId, subject, examType } = req.body;

        if (!userId || !subject || !examType) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: userId, subject, examType'
            });
        }

        const success = await examPartsManager.resetProgress(userId, subject, examType);

        if (success) {
            res.json({
                success: true,
                message: `Progreso reseteado para ${subject} - ${examType}`
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'No se pudo resetear el progreso'
            });
        }

    } catch (error) {
        console.error('Error reseteando progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Funciones auxiliares (copiadas de quiz.js)
function getTimeLimitForSubject(subject) {
    const timeLimits = {
        'Matemáticas': 0,
        'Castellano y Guaraní': 0,
        'Historia y Geografía': 30,
        'Legislación': 30
    };
    return timeLimits[subject] || 30;
}

function hasTimeLimitForSubject(subject) {
    const timeEnabledSubjects = {
        'Matemáticas': false,
        'Castellano y Guaraní': false,
        'Historia y Geografía': true,
        'Legislación': true
    };
    return timeEnabledSubjects[subject] || true;
}

module.exports = router;