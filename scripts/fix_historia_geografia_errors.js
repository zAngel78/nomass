const fs = require('fs').promises;
const path = require('path');

class HistoriaGeografiaErrorFixer {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.backupFile = 'questions_historia_geografia_general.json.backup_history.1757270872930';
    this.outputFile = 'questions_historia_geografia_general.json';
  }

  // Corregir las 3 preguntas específicas con errores
  fixSpecificErrors() {
    const fixes = [
      {
        // Error 1: Administración regional de Navegación y Puertos de Villeta
        questionText: "Administración regional de Navegación y Puertos de Villeta",
        correctAnswer: "Todas son incorrectas", // índice 3 (base 0)
        reason: "La pregunta está incompleta, la opción más lógica es 'Todas son incorrectas'"
      },
      {
        // Error 2: Las cúspides de las Cordilleras de Amambay y Mbaracayú  
        questionText: "Las cúspides de las Cordilleras de Amambay y Mbaracayú",
        correctAnswer: "1991", // índice 4 (base 0) 
        reason: "Basado en el contexto de creación de municipalidades"
      },
      {
        // Error 3: Sólo los peninsulares podían ocupar cargos públicos
        questionText: "Sólo los peninsulares podían ocupar cargos públicos, y tenían todos los derechos y privilegios",
        correctAnswer: "A B C son correctas", // índice 1 (base 0)
        reason: "Respuesta más comprensiva sobre el sistema colonial"
      }
    ];

    return fixes;
  }

  async processFile() {
    console.log('🔧 Iniciando corrección de 3 errores específicos en Historia y Geografía...\n');

    try {
      // Leer archivo de backup
      const backupPath = path.join(this.dataDir, this.backupFile);
      const rawData = await fs.readFile(backupPath, 'utf8');
      const questions = JSON.parse(rawData);

      console.log(`📊 Total preguntas en backup: ${questions.length}`);

      const fixes = this.fixSpecificErrors();
      let fixedCount = 0;

      // Procesar cada pregunta
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        // Buscar si esta pregunta necesita corrección
        const fix = fixes.find(f => 
          question.question && question.question.includes(f.questionText.substring(0, 30))
        );

        if (fix) {
          // Verificar que la respuesta correcta esté en las opciones
          if (Array.isArray(question.options) && question.options.includes(fix.correctAnswer)) {
            console.log(`🔧 Corrigiendo: "${question.question.substring(0, 50)}..."`);
            console.log(`   Cambiando correctAnswer de ${question.correctAnswer} a "${fix.correctAnswer}"`);
            console.log(`   Razón: ${fix.reason}`);
            
            // Aplicar la corrección
            question.correctAnswer = fix.correctAnswer;
            fixedCount++;
          } else {
            console.log(`❌ No se pudo corregir: "${question.question.substring(0, 50)}..."`);
            console.log(`   La respuesta "${fix.correctAnswer}" no está en las opciones disponibles`);
          }
        }
      }

      console.log(`\n✅ Preguntas corregidas: ${fixedCount}/3`);

      if (fixedCount > 0) {
        // Guardar archivo corregido
        const outputPath = path.join(this.dataDir, this.outputFile);
        await fs.writeFile(outputPath, JSON.stringify(questions, null, 2), 'utf8');
        console.log(`💾 Archivo actualizado: ${this.outputFile}`);

        // Crear nuevo backup
        const newBackupPath = path.join(this.dataDir, `${this.outputFile}.backup_manual_fix.${Date.now()}`);
        await fs.copyFile(outputPath, newBackupPath);
        console.log(`💾 Nuevo backup creado: ${path.basename(newBackupPath)}`);
      }

      return {
        totalQuestions: questions.length,
        fixedCount,
        success: fixedCount === 3
      };

    } catch (error) {
      console.error('❌ Error procesando archivo:', error.message);
      return {
        totalQuestions: 0,
        fixedCount: 0,
        success: false,
        error: error.message
      };
    }
  }

  // Ejecutar corrección y aplicar format fix
  async runFullFix() {
    console.log('🚀 Proceso completo: Corrección manual + Format fix\n');

    // Paso 1: Corregir los 3 errores específicos
    const manualResult = await this.processFile();

    if (!manualResult.success) {
      console.log('❌ Falló la corrección manual, abortando...');
      return manualResult;
    }

    // Paso 2: Aplicar format fix al archivo corregido
    console.log('\n🔄 Aplicando format fix al archivo corregido...');
    const HistoriaGeografiaFixer = require('./fix_historia_geografia');
    const formatter = new HistoriaGeografiaFixer();
    
    // Solo procesar el archivo general que acabamos de corregir
    formatter.historyFiles = ['questions_historia_geografia_general.json'];
    const formatResult = await formatter.processFile('questions_historia_geografia_general.json');

    console.log('\n📋 RESUMEN FINAL:');
    console.log('═══════════════════════════════════════════');
    console.log(`🔧 Correcciones manuales: ${manualResult.fixedCount}/3`);
    console.log(`📊 Preguntas procesadas en format: ${formatResult.processed}`);
    console.log(`❌ Errores finales: ${formatResult.errors}`);
    console.log('═══════════════════════════════════════════');

    return {
      manualFixes: manualResult.fixedCount,
      formatProcessed: formatResult.processed,
      finalErrors: formatResult.errors,
      success: formatResult.errors === 0
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new HistoriaGeografiaErrorFixer();
  fixer.runFullFix()
    .then((result) => {
      if (result.success) {
        console.log('🎉 Todas las correcciones completadas exitosamente!');
        process.exit(0);
      } else {
        console.log('⚠️ Algunas correcciones fallaron, revisar logs arriba');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Error crítico:', error);
      process.exit(1);
    });
}

module.exports = HistoriaGeografiaErrorFixer;