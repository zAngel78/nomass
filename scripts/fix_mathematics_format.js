const fs = require('fs').promises;
const path = require('path');

class MathematicsFormatFixer {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.mathFiles = [
      'questions_matematicas.json',
      'questions_matematicas_general_final.json'
    ];
    this.fixed = [];
    this.errors = [];
  }

  // Convertir pregunta de formato viejo a formato Flutter
  convertQuestionFormat(question) {
    try {
      // Validar que la pregunta tenga los campos necesarios
      if (!question.question || !question.question.trim()) {
        throw new Error('Pregunta vacía');
      }

      if (!question.options) {
        throw new Error('No tiene opciones');
      }

      // Crear objeto base
      const converted = {
        id: question.id || `math_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: question.question.trim(),
        subject: question.subject || 'Matemáticas',
        difficulty: question.difficulty || 1,
        explanation: question.explanation || ''
      };

      // Manejar diferentes formatos de opciones
      let optionsArray = [];
      let correctAnswerText = '';

      if (Array.isArray(question.options)) {
        // Si ya es array: ["opcion1", "opcion2", ...]
        optionsArray = question.options.filter(opt => 
          opt && typeof opt === 'string' && opt.trim() && 
          !opt.toLowerCase().includes('efectuar') && 
          opt.trim().length < 200
        );

        // Buscar correctAnswer
        if (question.correctAnswer) {
          correctAnswerText = question.correctAnswer;
        } else if (question.correct_answer && typeof question.correct_answer === 'number') {
          correctAnswerText = optionsArray[question.correct_answer] || '';
        } else if (question.answer) {
          correctAnswerText = question.answer;
        }
      } else if (typeof question.options === 'object') {
        // Formato {a: "opcion1", b: "opcion2", ...}
        const letters = ['a', 'b', 'c', 'd', 'e'];
        
        optionsArray = letters
          .map(letter => question.options[letter])
          .filter(opt => 
            opt && 
            typeof opt === 'string' && 
            opt.trim() && 
            !opt.toLowerCase().includes('efectuar') &&
            opt.trim().length < 200
          );

        // Buscar correctAnswer usando la letra
        if (question.correct_answer && question.options[question.correct_answer]) {
          correctAnswerText = question.options[question.correct_answer];
        } else if (question.correctAnswer) {
          correctAnswerText = question.correctAnswer;
        } else if (question.answer) {
          correctAnswerText = question.answer;
        }
      }

      // Validaciones
      if (optionsArray.length < 2) {
        throw new Error(`Solo ${optionsArray.length} opciones válidas encontradas`);
      }

      if (!correctAnswerText || !correctAnswerText.trim()) {
        throw new Error('No se pudo determinar la respuesta correcta');
      }

      correctAnswerText = correctAnswerText.trim();

      // Verificar que la respuesta correcta esté en las opciones
      if (!optionsArray.includes(correctAnswerText)) {
        // Intentar encontrar una opción similar
        const similar = optionsArray.find(opt => 
          opt.toLowerCase().includes(correctAnswerText.toLowerCase()) ||
          correctAnswerText.toLowerCase().includes(opt.toLowerCase())
        );

        if (similar) {
          correctAnswerText = similar;
        } else {
          // Si no está en las opciones, agregarla y remover una duplicada
          if (optionsArray.length >= 4) {
            optionsArray[0] = correctAnswerText; // Reemplazar primera
          } else {
            optionsArray.unshift(correctAnswerText); // Agregar al inicio
          }
        }
      }

      // Asegurar que tenemos al menos 4 opciones únicas
      const uniqueOptions = [...new Set(optionsArray)]; // Remover duplicados

      if (uniqueOptions.length < 4) {
        // Generar opciones adicionales básicas si es necesario
        const fillers = ['Ninguna de las anteriores', 'No se puede determinar', 'Faltan datos', 'Otra respuesta'];
        
        for (const filler of fillers) {
          if (!uniqueOptions.includes(filler) && uniqueOptions.length < 4) {
            uniqueOptions.push(filler);
          }
        }
      }

      converted.options = uniqueOptions.slice(0, 5); // Máximo 5 opciones
      converted.correctAnswer = correctAnswerText;

      // Validación final
      if (!converted.options.includes(converted.correctAnswer)) {
        throw new Error(`Respuesta correcta "${correctAnswerText}" no está en opciones: [${converted.options.join(', ')}]`);
      }

      return converted;

    } catch (error) {
      console.error(`❌ Error convirtiendo pregunta: ${error.message}`);
      console.error(`   Pregunta: ${(question.question || '').substring(0, 80)}...`);
      
      this.errors.push({
        id: question.id || 'unknown',
        question: (question.question || '').substring(0, 100),
        error: error.message,
        original: {
          correct_answer: question.correct_answer,
          correctAnswer: question.correctAnswer,
          options: question.options
        }
      });
      
      return null;
    }
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
        const convertedQuestion = this.convertQuestionFormat(question);
        if (convertedQuestion) {
          converted.push(convertedQuestion);
          if ((i + 1) % 100 === 0) {
            console.log(`📊 Progreso: ${i + 1}/${questions.length} preguntas procesadas...`);
          }
        }
      }

      console.log(`✅ Preguntas convertidas exitosamente: ${converted.length}`);
      console.log(`❌ Preguntas con errores: ${this.errors.length}`);

      // Crear backup del archivo original
      const backupPath = path.join(this.dataDir, `${filename}.backup_format.${Date.now()}`);
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
        console.log(`      Original: correct_answer="${example.original.correct_answer}", options=${JSON.stringify(example.original.options).substring(0, 100)}...`);
      }
      
      if (errors.length > 3) {
        console.log(`   ... y ${errors.length - 3} más`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  // Ejecutar corrección completa
  async fixAllFiles() {
    console.log('🚀 Iniciando corrección de formato para matemáticas...\n');

    const results = [];

    for (const filename of this.mathFiles) {
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
  const fixer = new MathematicsFormatFixer();
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

module.exports = MathematicsFormatFixer;