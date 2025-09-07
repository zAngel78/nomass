const fs = require('fs').promises;
const path = require('path');

class HistoriaGeografiaFixer {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.historyFiles = [
      'questions_historia_geografia_normal_mejorado.json',
      'questions_historia_geografia_general.json'
    ];
    this.errors = [];
  }

  // Convertir pregunta de índice a texto
  fixQuestion(question, index) {
    try {
      // Validar campos básicos
      if (!question.question || !question.question.trim()) {
        throw new Error('Pregunta vacía');
      }

      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw new Error('Opciones inválidas');
      }

      if (question.correctAnswer === null || question.correctAnswer === undefined) {
        throw new Error('No hay respuesta correcta definida');
      }

      // Crear pregunta corregida
      const fixed = {
        id: question.id || `history_${Date.now()}_${index}`,
        question: question.question.trim(),
        subject: 'Historia y Geografía',
        difficulty: this.normalizeDifficulty(question.difficulty),
        explanation: question.explanation || ''
      };

      // Limpiar opciones
      const cleanOptions = question.options
        .filter(opt => opt && typeof opt === 'string' && opt.trim())
        .map(opt => opt.trim());

      if (cleanOptions.length < 2) {
        throw new Error('Menos de 2 opciones válidas');
      }

      // Convertir correctAnswer de índice a texto
      let correctAnswerText = '';
      
      if (typeof question.correctAnswer === 'number') {
        const answerIndex = question.correctAnswer;
        if (answerIndex >= 0 && answerIndex < cleanOptions.length) {
          correctAnswerText = cleanOptions[answerIndex];
        } else {
          throw new Error(`Índice de respuesta fuera de rango: ${answerIndex}`);
        }
      } else if (typeof question.correctAnswer === 'string') {
        correctAnswerText = question.correctAnswer.trim();
      } else {
        throw new Error('Formato de correctAnswer no reconocido');
      }

      // Verificar que la respuesta esté en las opciones
      if (!cleanOptions.includes(correctAnswerText)) {
        throw new Error(`Respuesta correcta "${correctAnswerText}" no está en opciones`);
      }

      fixed.options = cleanOptions;
      fixed.correctAnswer = correctAnswerText;

      return fixed;

    } catch (error) {
      console.error(`❌ Error en pregunta ${index}: ${error.message}`);
      console.error(`   Pregunta: ${(question.question || '').substring(0, 60)}...`);
      
      this.errors.push({
        index,
        question: (question.question || '').substring(0, 100),
        error: error.message,
        original: {
          correctAnswer: question.correctAnswer,
          options: question.options
        }
      });
      
      return null;
    }
  }

  // Normalizar dificultad
  normalizeDifficulty(difficulty) {
    if (typeof difficulty === 'number') return difficulty;
    
    const difficultyMap = {
      'normal': 1,
      'general': 2,
      'facil': 1,
      'medio': 2,
      'dificil': 3
    };
    
    return difficultyMap[difficulty?.toLowerCase()] || 1;
  }

  // Procesar un archivo completo
  async processFile(filename) {
    console.log(`\n📁 Procesando archivo: ${filename}`);
    
    try {
      const filePath = path.join(this.dataDir, filename);
      const rawData = await fs.readFile(filePath, 'utf8');
      const questions = JSON.parse(rawData);

      console.log(`📊 Total preguntas en archivo: ${questions.length}`);

      const converted = [];
      const seenQuestions = new Set();

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        // Evitar duplicados por contenido
        const questionKey = (question.question || '').toLowerCase().trim();
        if (seenQuestions.has(questionKey)) {
          console.log(`⚠️ Pregunta duplicada omitida: ${questionKey.substring(0, 50)}...`);
          continue;
        }
        seenQuestions.add(questionKey);

        // Convertir formato
        const fixedQuestion = this.fixQuestion(question, i + 1);
        if (fixedQuestion) {
          converted.push(fixedQuestion);
          if ((i + 1) % 50 === 0) {
            console.log(`📊 Progreso: ${i + 1}/${questions.length} preguntas procesadas...`);
          }
        }
      }

      console.log(`✅ Preguntas convertidas exitosamente: ${converted.length}`);
      console.log(`❌ Preguntas con errores: ${this.errors.length}`);

      // Crear backup del archivo original
      const backupPath = path.join(this.dataDir, `${filename}.backup_history.${Date.now()}`);
      await fs.copyFile(filePath, backupPath);
      console.log(`💾 Backup creado: ${path.basename(backupPath)}`);

      // Guardar archivo convertido
      await fs.writeFile(filePath, JSON.stringify(converted, null, 2), 'utf8');
      console.log(`💾 Archivo actualizado: ${filename}`);

      return {
        processed: converted.length,
        errors: this.errors.length,
        filename,
        originalCount: questions.length
      };

    } catch (error) {
      console.error(`❌ Error crítico procesando ${filename}:`, error.message);
      return {
        processed: 0,
        errors: 1,
        filename,
        error: error.message
      };
    }
  }

  // Mostrar reporte de errores detallado
  showErrorReport() {
    if (this.errors.length === 0) return;

    console.log('\n📋 REPORTE DETALLADO DE ERRORES:');
    console.log('═══════════════════════════════════════════════════════════');

    // Agrupar errores por tipo
    const errorsByType = {};
    for (const error of this.errors) {
      const type = error.error;
      if (!errorsByType[type]) {
        errorsByType[type] = [];
      }
      errorsByType[type].push(error);
    }

    for (const [errorType, errors] of Object.entries(errorsByType)) {
      console.log(`\n🚨 ${errorType}: ${errors.length} casos`);
      
      // Mostrar algunos ejemplos
      const examples = errors.slice(0, 3);
      for (const example of examples) {
        console.log(`   📄 ${example.question}...`);
        console.log(`      Original: correctAnswer="${example.original.correctAnswer}", options=${JSON.stringify(example.original.options).substring(0, 100)}...`);
      }
      
      if (errors.length > 3) {
        console.log(`   ... y ${errors.length - 3} más`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  // Ejecutar corrección completa
  async fixAllFiles() {
    console.log('🚀 Iniciando corrección de formato para Historia y Geografía...\n');

    const results = [];

    for (const filename of this.historyFiles) {
      this.errors = []; // Reset errors for each file
      const result = await this.processFile(filename);
      results.push(result);
    }

    // Mostrar resumen
    console.log('\n📋 RESUMEN DE CONVERSIÓN:');
    console.log('═══════════════════════════════════════════');
    
    let totalOriginal = 0;
    let totalProcessed = 0;
    let totalErrors = 0;

    for (const result of results) {
      console.log(`📁 ${result.filename}:`);
      console.log(`   📊 Originales: ${result.originalCount || 'N/A'}`);
      console.log(`   ✅ Convertidas: ${result.processed}`);
      console.log(`   ❌ Errores: ${result.errors}`);
      if (result.error) {
        console.log(`   🚨 Error crítico: ${result.error}`);
      }
      
      const successRate = result.originalCount ? 
        ((result.processed / result.originalCount) * 100).toFixed(1) : 'N/A';
      console.log(`   📈 Tasa éxito: ${successRate}%`);
      console.log('');
      
      totalOriginal += result.originalCount || 0;
      totalProcessed += result.processed;
      totalErrors += result.errors;
    }

    console.log(`🎯 TOTAL ORIGINALES: ${totalOriginal}`);
    console.log(`✅ TOTAL CONVERTIDAS: ${totalProcessed}`);
    console.log(`❌ TOTAL ERRORES: ${totalErrors}`);
    console.log(`📈 TASA ÉXITO GENERAL: ${totalOriginal ? ((totalProcessed / totalOriginal) * 100).toFixed(1) : 'N/A'}%`);
    console.log('═══════════════════════════════════════════\n');

    // Mostrar reporte detallado de errores
    this.showErrorReport();

    console.log('✅ Conversión de formato completada!');
    return results;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new HistoriaGeografiaFixer();
  fixer.fixAllFiles()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error crítico:', error);
      process.exit(1);
    });
}

module.exports = HistoriaGeografiaFixer;