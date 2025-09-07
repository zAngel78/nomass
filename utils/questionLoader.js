const fs = require('fs').promises;
const path = require('path');

class QuestionLoader {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.questionFiles = {
      matematicas: {
        normal: 'questions_matematicas.json',
        general: 'questions_matematicas_general_final.json'
      },
      castellano: {
        normal: 'questions_castellano_normal_agresivo.json',
        general: 'questions_castellano_general_completo.json'
      },
      historia: {
        normal: 'questions_historia_geografia_normal_mejorado.json',
        general: 'questions_historia_geografia_general.json'
      },
      legislacion: {
        normal: 'questions_legislacion_normal.json',
        general: 'questions_legislacion_general.json'
      }
    };
  }

  async loadQuestionsFromFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`⚠️  No se pudo cargar ${filename}:`, error.message);
      return [];
    }
  }

  async getAllQuestions() {
    const allQuestions = [];
    let totalCount = 0;

    for (const [subject, files] of Object.entries(this.questionFiles)) {
      // Cargar preguntas normales
      const normalQuestions = await this.loadQuestionsFromFile(files.normal);
      const processedNormal = normalQuestions.map((q, index) => ({
        id: `${subject}_normal_${index + 1}`,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [q.options.a, q.options.b, q.options.c, q.options.d, q.options.e].filter(Boolean),
        correct_answer: q.correctAnswer || q.answer || q.correct_answer,
        subject: this.getSubjectDisplayName(subject),
        type: 'normal',
        difficulty: 1,
        explanation: q.explanation || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Cargar preguntas generales
      const generalQuestions = await this.loadQuestionsFromFile(files.general);
      const processedGeneral = generalQuestions.map((q, index) => ({
        id: `${subject}_general_${index + 1}`,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [q.options.a, q.options.b, q.options.c, q.options.d, q.options.e].filter(Boolean),
        correct_answer: q.correctAnswer || q.answer || q.correct_answer,
        subject: this.getSubjectDisplayName(subject),
        type: 'general',
        difficulty: 2,
        explanation: q.explanation || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      allQuestions.push(...processedNormal, ...processedGeneral);
      
      console.log(`📚 ${this.getSubjectDisplayName(subject)}: ${processedNormal.length} normales + ${processedGeneral.length} generales`);
      totalCount += processedNormal.length + processedGeneral.length;
    }

    console.log(`🎯 Total preguntas cargadas: ${totalCount}`);
    return allQuestions;
  }

  getSubjectDisplayName(subject) {
    const displayNames = {
      matematicas: 'Matemáticas',
      castellano: 'Castellano y Guaraní',
      historia: 'Historia y Geografía',
      legislacion: 'Legislación'
    };
    return displayNames[subject] || subject;
  }

  async getQuestionsBySubject(subject) {
    const allQuestions = await this.getAllQuestions();
    return allQuestions.filter(q => 
      q.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }

  async getQuestionsByType(type) {
    const allQuestions = await this.getAllQuestions();
    return allQuestions.filter(q => q.type === type);
  }

  async getQuestionsBySubjectAndType(subject, type) {
    const allQuestions = await this.getAllQuestions();
    console.log(`🔍 Buscando: "${subject}" tipo "${type}"`);
    console.log(`📋 Materias disponibles: ${[...new Set(allQuestions.map(q => q.subject))].join(', ')}`);
    
    const filtered = allQuestions.filter(q => {
      const subjectMatch = q.subject.toLowerCase().includes(subject.toLowerCase()) ||
                          subject.toLowerCase().includes(q.subject.toLowerCase());
      return subjectMatch && q.type === type;
    });
    
    console.log(`✅ Encontradas: ${filtered.length} preguntas`);
    return filtered;
  }

  async getAvailableSubjects() {
    const allQuestions = await this.getAllQuestions();
    const subjects = [...new Set(allQuestions.map(q => q.subject))];
    return subjects;
  }

  async getStatistics() {
    const allQuestions = await this.getAllQuestions();
    const stats = {
      total: allQuestions.length,
      bySubject: {},
      byType: {
        normal: allQuestions.filter(q => q.type === 'normal').length,
        general: allQuestions.filter(q => q.type === 'general').length
      }
    };

    // Estadísticas por materia
    const subjects = await this.getAvailableSubjects();
    for (const subject of subjects) {
      const subjectQuestions = allQuestions.filter(q => q.subject === subject);
      stats.bySubject[subject] = {
        total: subjectQuestions.length,
        normal: subjectQuestions.filter(q => q.type === 'normal').length,
        general: subjectQuestions.filter(q => q.type === 'general').length
      };
    }

    return stats;
  }
}

module.exports = new QuestionLoader();