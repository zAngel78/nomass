const fs = require('fs').promises;
const path = require('path');

class MathematicsFixer {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.mathFiles = [
      'questions_matematicas.json',
      'questions_matematicas_general_final.json'
    ];
    this.fixedQuestions = [];
    this.errors = [];
  }

  // Evaluar expresiones matemáticas de forma segura
  evaluateMathExpression(expression) {
    try {
      // Limpiar la expresión
      let cleanExpression = expression.replace(/\s+/g, '');
      
      // Verificar que solo contiene números, operadores y paréntesis
      if (!/^[\d+\-*/().]+$/.test(cleanExpression)) {
        throw new Error('Expresión contiene caracteres inválidos');
      }
      
      // Evaluar usando Function (más seguro que eval)
      const result = Function(`"use strict"; return (${cleanExpression})`)();
      
      if (!Number.isFinite(result)) {
        throw new Error('Resultado no es un número válido');
      }
      
      return Math.round(result); // Redondear a entero
    } catch (error) {
      console.error(`❌ Error evaluando: ${expression} - ${error.message}`);
      return null;
    }
  }

  // Convertir pregunta de formato viejo a nuevo
  fixQuestion(question) {
    try {
      const fixed = {
        id: question.id,
        question: question.question,
        subject: question.subject || 'Matemáticas',
        difficulty: question.difficulty || 1,
        explanation: question.explanation || ''
      };

      // Detectar si es una operación matemática
      const mathOperationRegex = /Efectuar:|Calcular:|Resolver:|=|\+|\-|\*|\/|\(|\)/;
      const isMathOperation = mathOperationRegex.test(question.question);

      if (isMathOperation) {
        // Intentar extraer la operación de la pregunta
        let operation = question.question
          .replace(/^(Efectuar:|Calcular:|Resolver:|Hallar:|Determinar:)/i, '')
          .trim();

        // Si hay un signo igual, tomar solo la parte antes del igual
        if (operation.includes('=')) {
          operation = operation.split('=')[0].trim();
        }

        console.log(`🧮 Procesando: ${operation}`);
        
        const correctResult = this.evaluateMathExpression(operation);

        if (correctResult !== null) {
          // Convertir opciones del formato {a: "1", b: "2"} a array
          let options = [];
          if (question.options && typeof question.options === 'object') {
            if (Array.isArray(question.options)) {
              options = question.options.filter(opt => typeof opt === 'string' && opt.trim());
            } else {
              // Formato {a: "1", b: "2", c: "3", d: "4"}
              const letters = ['a', 'b', 'c', 'd', 'e'];
              options = letters
                .map(letter => question.options[letter])
                .filter(opt => opt && typeof opt === 'string' && opt.trim() && !opt.includes('Efectuar'))
                .map(opt => opt.toString().trim());
            }
          }

          // Asegurar que tenemos al menos 4 opciones
          if (options.length < 4) {
            // Generar opciones adicionales basadas en el resultado correcto
            const correctStr = correctResult.toString();
            const variations = [
              (correctResult + 5).toString(),
              (correctResult - 3).toString(),
              (correctResult + 10).toString(),
              (correctResult - 7).toString()
            ].filter(v => !options.includes(v) && v !== correctStr);

            while (options.length < 4 && variations.length > 0) {
              options.push(variations.shift());
            }
          }

          // Asegurar que la respuesta correcta está en las opciones
          const correctStr = correctResult.toString();
          if (!options.includes(correctStr)) {
            if (options.length >= 4) {
              options[0] = correctStr; // Reemplazar la primera
            } else {
              options.unshift(correctStr); // Agregar al principio
            }
          }

          // Mezclar las opciones para que la correcta no siempre esté en la misma posición
          options = this.shuffleArray(options);

          fixed.options = options;
          fixed.correctAnswer = correctStr;

          console.log(`✅ Pregunta arreglada: ${correctStr} en opciones: [${options.join(', ')}]`);
        } else {
          throw new Error('No se pudo calcular el resultado');
        }
      } else {
        // No es operación matemática, usar formato existente si es válido
        if (question.options && question.correct_answer) {
          let options = [];
          if (Array.isArray(question.options)) {
            options = question.options;
          } else if (typeof question.options === 'object') {
            const letters = ['a', 'b', 'c', 'd', 'e'];
            options = letters
              .map(letter => question.options[letter])
              .filter(opt => opt && typeof opt === 'string' && opt.trim())
              .map(opt => opt.toString().trim());
          }

          const correctLetter = question.correct_answer;
          const correctAnswer = question.options[correctLetter];

          if (correctAnswer && options.includes(correctAnswer)) {
            fixed.options = options;
            fixed.correctAnswer = correctAnswer;
          } else {
            throw new Error('Respuesta correcta no encontrada en opciones');
          }
        } else {
          throw new Error('Formato de pregunta no reconocido');
        }
      }

      return fixed;
    } catch (error) {
      this.errors.push({
        id: question.id,
        question: question.question,
        error: error.message
      });
      console.error(`❌ Error procesando pregunta ${question.id}: ${error.message}`);
      return null;
    }
  }

  // Mezclar array (Fisher-Yates)
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Procesar un archivo de matemáticas
  async processFile(filename) {
    console.log(`\n📁 Procesando archivo: ${filename}`);
    
    try {
      const filePath = path.join(this.dataDir, filename);
      const rawData = await fs.readFile(filePath, 'utf8');
      const questions = JSON.parse(rawData);

      console.log(`📊 Total preguntas: ${questions.length}`);

      const fixed = [];
      const seenQuestions = new Set();

      for (const question of questions) {
        // Evitar duplicados
        if (seenQuestions.has(question.question)) {
          console.log(`⚠️ Pregunta duplicada omitida: ${question.question.substring(0, 50)}...`);
          continue;
        }
        seenQuestions.add(question.question);

        const fixedQuestion = this.fixQuestion(question);
        if (fixedQuestion) {
          fixed.push(fixedQuestion);
        }
      }

      console.log(`✅ Preguntas procesadas exitosamente: ${fixed.length}`);
      console.log(`❌ Preguntas con errores: ${this.errors.length}`);

      // Guardar archivo corregido
      const backupPath = path.join(this.dataDir, `${filename}.backup.${Date.now()}`);
      await fs.copyFile(filePath, backupPath);
      console.log(`💾 Backup creado: ${backupPath}`);

      await fs.writeFile(filePath, JSON.stringify(fixed, null, 2), 'utf8');
      console.log(`💾 Archivo actualizado: ${filePath}`);

      return {
        processed: fixed.length,
        errors: this.errors.length,
        filename
      };

    } catch (error) {
      console.error(`❌ Error procesando archivo ${filename}:`, error.message);
      return {
        processed: 0,
        errors: 1,
        filename,
        error: error.message
      };
    }
  }

  // Ejecutar corrección completa
  async fixAllMathFiles() {
    console.log('🚀 Iniciando corrección de archivos de matemáticas...\n');

    const results = [];

    for (const filename of this.mathFiles) {
      this.errors = []; // Reset errors for each file
      const result = await this.processFile(filename);
      results.push(result);
    }

    // Mostrar resumen
    console.log('\n📋 RESUMEN DE CORRECCIONES:');
    console.log('═══════════════════════════════════════');
    
    let totalProcessed = 0;
    let totalErrors = 0;

    for (const result of results) {
      console.log(`📁 ${result.filename}:`);
      console.log(`   ✅ Procesadas: ${result.processed}`);
      console.log(`   ❌ Errores: ${result.errors}`);
      if (result.error) {
        console.log(`   🚨 Error crítico: ${result.error}`);
      }
      console.log('');
      
      totalProcessed += result.processed;
      totalErrors += result.errors;
    }

    console.log(`🎯 TOTAL PROCESADAS: ${totalProcessed}`);
    console.log(`⚠️  TOTAL ERRORES: ${totalErrors}`);
    console.log('═══════════════════════════════════════\n');

    if (totalErrors > 0) {
      console.log('⚠️ Revisa los errores arriba para preguntas que necesitan corrección manual.');
    }

    console.log('✅ Corrección completada!');
    return results;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new MathematicsFixer();
  fixer.fixAllMathFiles()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error crítico:', error);
      process.exit(1);
    });
}

module.exports = MathematicsFixer;