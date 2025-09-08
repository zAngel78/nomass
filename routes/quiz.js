const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');
const questionLoader = require('../utils/questionLoader');

const router = express.Router();

// POST /api/quiz/generate - Generar un nuevo quiz
router.post('/generate', async (req, res) => {
  try {
    const { subject, questionCount = -1, examType = 'normal', random = true } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere especificar la materia (subject)'
      });
    }

    // Usar questionLoader para obtener preguntas por materia y tipo
    let questions;
    if (examType === 'general') {
      questions = await questionLoader.getQuestionsBySubjectAndType(subject, 'general');
    } else {
      questions = await questionLoader.getQuestionsBySubjectAndType(subject, 'normal');
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No se encontraron preguntas para ${subject} - ${examType}`
      });
    }

    // Barajar si se solicita
    if (random) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Limitar cantidad si se especifica (questionCount = -1 significa todas)
    let selectedQuestions;
    if (questionCount === -1) {
      selectedQuestions = questions;
    } else {
      selectedQuestions = questions.slice(0, Math.min(questionCount, questions.length));
    }

    const quiz = {
      id: uuidv4(),
      subject: subject,
      examType: examType,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      startTime: new Date().toISOString(),
      timeLimit: getTimeLimitForSubject(subject),
      hasTimeLimit: hasTimeLimitForSubject(subject)
    };

    res.json({
      success: true,
      message: `Quiz generado con ${selectedQuestions.length} preguntas`,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error generando quiz',
      message: error.message
    });
  }
});

// POST /api/quiz/submit - Enviar resultados de quiz
router.post('/submit', async (req, res) => {
  try {
    const { userId, quizId, subject, answers, timeSpent } = req.body;

    if (!userId || !quizId || !subject || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: userId, quizId, subject, answers'
      });
    }

    // Obtener preguntas para calcular puntuación
    const questions = await fileStorage.readFile('questions');
    let correctAnswers = 0;
    let totalScore = 0;

    const detailedResults = answers.map((answer, index) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) {
        return {
          questionId: answer.questionId,
          userAnswer: answer.selectedAnswer,
          correctAnswer: null,
          isCorrect: false,
          points: 0
        };
      }

      // Manejar tanto índice como texto de respuesta
      let isCorrect = false;
      if (typeof answer.selectedAnswer === 'number') {
        // Flutter envía índice (número)
        isCorrect = answer.selectedAnswer === question.correct_answer_index;
      } else {
        // Texto de respuesta directo
        isCorrect = answer.selectedAnswer === question.correct_answer;
      }
      const points = isCorrect ? calculatePoints(question.difficulty || 1, timeSpent) : 0;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += points;
      }

      return {
        questionId: answer.questionId,
        userAnswer: answer.selectedAnswer,
        correctAnswer: question.correct_answer,
        isCorrect: isCorrect,
        points: points,
        question: question.question
      };
    });

    // Crear resultado del quiz
    const quizResult = {
      id: uuidv4(),
      userId: userId,
      quizId: quizId,
      subject: subject,
      totalQuestions: answers.length,
      correctAnswers: correctAnswers,
      totalScore: totalScore,
      timeSpent: timeSpent,
      accuracy: Math.round((correctAnswers / answers.length) * 100),
      completedAt: new Date().toISOString(),
      answers: detailedResults
    };

    // Guardar resultado
    await fileStorage.appendToFile('quiz_results', quizResult);

    // Actualizar puntuación del usuario
    try {
      const users = await fileStorage.readFile('users');
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        const user = users[userIndex];
        
        // Actualizar puntuaciones por materia
        if (!user.subjectScores[subject]) {
          user.subjectScores[subject] = {
            score: 0,
            gamesPlayed: 0,
            correctAnswers: 0,
            bestScore: 0
          };
        }

        const subjectScore = user.subjectScores[subject];
        subjectScore.score += totalScore;
        subjectScore.gamesPlayed += 1;
        subjectScore.correctAnswers += correctAnswers;
        subjectScore.bestScore = Math.max(subjectScore.bestScore, totalScore);

        // Actualizar puntos totales y diarios
        user.totalPoints += totalScore;
        user.dailyPoints += totalScore;
        user.updated_at = new Date().toISOString();

        users[userIndex] = user;
        await fileStorage.writeFile('users', users);
      }
    } catch (userUpdateError) {
      console.error('Error actualizando usuario:', userUpdateError);
      // Continuar aunque falle la actualización del usuario
    }

    res.json({
      success: true,
      message: 'Resultado de quiz procesado exitosamente',
      data: {
        result: quizResult,
        summary: {
          totalQuestions: answers.length,
          correctAnswers: correctAnswers,
          accuracy: Math.round((correctAnswers / answers.length) * 100),
          totalScore: totalScore,
          timeSpent: timeSpent
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error procesando resultado del quiz',
      message: error.message
    });
  }
});

// GET /api/quiz/results/:userId - Obtener resultados de quizzes de un usuario
router.get('/results/:userId', async (req, res) => {
  try {
    const { limit = 10, subject } = req.query;
    let results = await fileStorage.readFile('quiz_results');
    
    // Filtrar por usuario
    results = results.filter(r => r.userId === req.params.userId);

    // Filtrar por materia si se especifica
    if (subject) {
      results = results.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    }

    // Ordenar por fecha (más reciente primero)
    results = results
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo resultados',
      message: error.message
    });
  }
});

// Funciones auxiliares
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

function calculatePoints(difficulty, timeSpent) {
  const basePoints = difficulty * 10;
  // Bonus por velocidad (máximo 50% bonus)
  const timeBonus = Math.max(0, Math.min(0.5, (60 - timeSpent) / 60));
  return Math.round(basePoints * (1 + timeBonus));
}

module.exports = router;