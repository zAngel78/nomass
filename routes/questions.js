const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');
const questionLoader = require('../utils/questionLoader');

const router = express.Router();

// GET /api/questions/subjects - Obtener lista de materias disponibles
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await questionLoader.getAvailableSubjects();
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo materias',
      message: error.message
    });
  }
});

// GET /api/questions/stats - Obtener estadísticas de preguntas
router.get('/stats', async (req, res) => {
  try {
    const stats = await questionLoader.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

// GET /api/questions - Obtener todas las preguntas
router.get('/', async (req, res) => {
  try {
    const { subject, type, limit, random } = req.query;
    let questions;

    // Cargar preguntas según los filtros
    if (subject && type) {
      questions = await questionLoader.getQuestionsBySubjectAndType(subject, type);
    } else if (subject) {
      questions = await questionLoader.getQuestionsBySubject(subject);
    } else if (type) {
      questions = await questionLoader.getQuestionsByType(type);
    } else {
      questions = await questionLoader.getAllQuestions();
    }

    // Barajar si se solicita
    if (random === 'true') {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Limitar cantidad si se especifica
    if (limit) {
      const limitNumber = parseInt(limit);
      questions = questions.slice(0, limitNumber);
    }

    res.json({
      success: true,
      count: questions.length,
      data: questions,
      filters: { subject, type, limit, random }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo preguntas',
      message: error.message
    });
  }
});

// GET /api/questions/subjects - Obtener todas las materias disponibles
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await questionLoader.getAvailableSubjects();
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo materias',
      message: error.message
    });
  }
});

// GET /api/questions/stats - Obtener estadísticas de preguntas
router.get('/stats', async (req, res) => {
  try {
    const stats = await questionLoader.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

// GET /api/questions/:id - Obtener una pregunta específica
router.get('/:id', async (req, res) => {
  try {
    const allQuestions = await questionLoader.getAllQuestions();
    const question = allQuestions.find(q => q.id === req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Pregunta no encontrada'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo pregunta',
      message: error.message
    });
  }
});

// POST /api/questions - Crear nueva pregunta
router.post('/', async (req, res) => {
  try {
    const { question, options, correct_answer, subject, difficulty, explanation } = req.body;

    // Validaciones básicas
    if (!question || !options || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: question, options, subject'
      });
    }

    const newQuestion = {
      id: uuidv4(),
      question: question.trim(),
      options,
      correct_answer: correct_answer || null,
      subject: subject.trim(),
      difficulty: difficulty || 1,
      explanation: explanation || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await fileStorage.appendToFile('questions', newQuestion);

    res.status(201).json({
      success: true,
      message: 'Pregunta creada exitosamente',
      data: newQuestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creando pregunta',
      message: error.message
    });
  }
});

// PUT /api/questions/:id - Actualizar pregunta
router.put('/:id', async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const updated = await fileStorage.updateInFile('questions', req.params.id, updatedData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Pregunta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Pregunta actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando pregunta',
      message: error.message
    });
  }
});

// DELETE /api/questions/:id - Eliminar pregunta
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await fileStorage.deleteFromFile('questions', req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Pregunta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Pregunta eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando pregunta',
      message: error.message
    });
  }
});

// POST /api/questions/import - Importar preguntas desde JSON
router.post('/import', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Se esperaba un array de preguntas'
      });
    }

    // Crear backup antes de importar
    await fileStorage.backupFile('questions');

    const processedQuestions = questions.map(q => ({
      id: uuidv4(),
      question: q.question || '',
      options: q.options || {},
      correct_answer: q.correct_answer || null,
      subject: q.subject || 'Castellano y Guaraní',
      difficulty: q.difficulty || 1,
      explanation: q.explanation || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    await fileStorage.writeFile('questions', processedQuestions);

    res.json({
      success: true,
      message: `${processedQuestions.length} preguntas importadas exitosamente`,
      count: processedQuestions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error importando preguntas',
      message: error.message
    });
  }
});

// GET /api/questions/general-stats - Obtener estadísticas de exámenes generales
router.get('/general-stats', async (req, res) => {
  try {
    const generalStats = {
      'Matemáticas': await getGeneralQuestionCount('matematicas'),
      'Castellano y Guaraní': await getGeneralQuestionCount('castellano'), 
      'Historia y Geografía': await getGeneralQuestionCount('historia'),
      'Legislación': await getGeneralQuestionCount('legislacion')
    };

    res.json({
      success: true,
      data: generalStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas de exámenes generales',
      message: error.message
    });
  }
});

async function getGeneralQuestionCount(subject) {
  try {
    let filename;
    switch (subject) {
      case 'matematicas':
        filename = 'questions_matematicas_general_final';
        break;
      case 'castellano':
        filename = 'questions_castellano_general_completo';
        break;
      case 'historia':
        filename = 'questions_historia_geografia_general';
        break;
      case 'legislacion':
        filename = 'questions_legislacion_general';
        break;
      default:
        return { questions: 0, parts: 0 };
    }

    const questions = await fileStorage.readFile(filename);
    const questionCount = questions.length;
    const parts = Math.ceil(questionCount / 20); // 20 preguntas por parte

    return {
      questions: questionCount,
      parts: parts,
      questionsPerPart: 20
    };
  } catch (error) {
    console.error(`Error loading ${subject} general questions:`, error);
    return { questions: 0, parts: 0 };
  }
}

module.exports = router;