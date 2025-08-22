const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');

async function importQuestionsFromJson() {
  try {
    console.log('🚀 Iniciando importación de preguntas...');
    
    // Rutas a los archivos JSON de preguntas
    const questionsJsonPath = path.join(__dirname, '../preguntas_castellano_completo.json');
    const generalCastellanoPath = path.join(__dirname, '../data/questions_general_castellano.json');
    
    let allQuestions = [];
    
    // Importar preguntas regulares
    try {
      await fs.access(questionsJsonPath);
      console.log('📖 Leyendo preguntas regulares...');
      const jsonContent = await fs.readFile(questionsJsonPath, 'utf8');
      const questionsData = JSON.parse(jsonContent);
      
      if (Array.isArray(questionsData)) {
        allQuestions = [...questionsData];
        console.log(`✅ Cargadas ${questionsData.length} preguntas regulares`);
      }
    } catch (error) {
      console.log('⚠️ No se encontraron preguntas regulares, continuando...');
    }
    
    // Importar preguntas del Examen General Castellano y Guaraní (de Rudy - COMPLETO CON 5 OPCIONES)
    const rudyGeneralPath = path.join(__dirname, '../data/questions_general_castellano_rudy_complete.json');
    try {
      await fs.access(rudyGeneralPath);
      console.log('📖 Leyendo preguntas del Examen General Castellano y Guaraní (Rudy)...');
      const rudyContent = await fs.readFile(rudyGeneralPath, 'utf8');
      const rudyData = JSON.parse(rudyContent);
      
      if (Array.isArray(rudyData)) {
        allQuestions = [...allQuestions, ...rudyData];
        console.log(`✅ Cargadas ${rudyData.length} preguntas del Examen General (Rudy)`);
      }
    } catch (error) {
      console.log('⚠️ No se encontraron preguntas del Examen General (Rudy), intentando con las de muestra...');
      
      // Fallback a las preguntas de muestra
      try {
        await fs.access(generalCastellanoPath);
        console.log('📖 Leyendo preguntas del Examen General Castellano y Guaraní (muestra)...');
        const generalContent = await fs.readFile(generalCastellanoPath, 'utf8');
        const generalData = JSON.parse(generalContent);
        
        if (Array.isArray(generalData)) {
          allQuestions = [...allQuestions, ...generalData];
          console.log(`✅ Cargadas ${generalData.length} preguntas del Examen General (muestra)`);
        }
      } catch (error2) {
        console.log('⚠️ No se encontraron preguntas del Examen General, continuando...');
      }
    }
    
    if (allQuestions.length === 0) {
      console.error('❌ No se encontraron preguntas para importar');
      return;
    }
    
    console.log(`📊 Se encontraron ${allQuestions.length} preguntas en total`);
    
    // Procesar preguntas
    const processedQuestions = allQuestions.map((q, index) => {
      const processedQuestion = {
        id: q.id || uuidv4(),
        question: q.question || `Pregunta ${index + 1}`,
        options: q.options || {},
        correct_answer: q.correct_answer || null,
        subject: q.subject || 'Castellano y Guaraní',
        difficulty: q.difficulty || 1,
        explanation: q.explanation || '',
        created_at: q.created_at || new Date().toISOString(),
        updated_at: q.updated_at || new Date().toISOString(),
        imported_at: new Date().toISOString(),
        source: q.source || 'import_script'
      };
      
      // Validar que tenga al menos una opción
      if (!processedQuestion.options || Object.keys(processedQuestion.options).length === 0) {
        console.warn(`⚠️  Pregunta ${index + 1} no tiene opciones válidas`);
      }
      
      return processedQuestion;
    });
    
    // Crear backup de preguntas existentes si las hay
    console.log('💾 Creando backup de preguntas existentes...');
    await fileStorage.backupFile('questions');
    
    // Guardar preguntas procesadas
    console.log('💾 Guardando preguntas procesadas...');
    await fileStorage.writeFile('questions', processedQuestions);
    
    // Estadísticas
    const stats = {
      total: processedQuestions.length,
      withCorrectAnswer: processedQuestions.filter(q => q.correct_answer).length,
      withoutCorrectAnswer: processedQuestions.filter(q => !q.correct_answer).length,
      bySubject: {}
    };
    
    // Contar por materia
    processedQuestions.forEach(q => {
      if (!stats.bySubject[q.subject]) {
        stats.bySubject[q.subject] = 0;
      }
      stats.bySubject[q.subject]++;
    });
    
    console.log('\n✅ ¡Importación completada exitosamente!');
    console.log('\n📊 Estadísticas:');
    console.log(`   Total de preguntas: ${stats.total}`);
    console.log(`   Con respuesta correcta: ${stats.withCorrectAnswer}`);
    console.log(`   Sin respuesta correcta: ${stats.withoutCorrectAnswer}`);
    console.log('\n📚 Por materia:');
    Object.entries(stats.bySubject).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} preguntas`);
    });
    
    console.log('\n🎉 Las preguntas están listas para ser usadas por la API');
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  importQuestionsFromJson();
}

module.exports = importQuestionsFromJson;