const fs = require('fs');
const path = require('path');

// Script para limpiar preguntas incompletas o mal formateadas
async function cleanIncompleteQuestions() {
    const dataDir = path.join(__dirname, '../data');
    const files = [
        'questions_matematicas.json',
        'questions_castellano_normal_agresivo.json', 
        'questions_historia_geografia_normal_mejorado.json',
        'questions_legislacion_normal.json'
    ];

    let totalProcessed = 0;
    let totalRemoved = 0;

    for (const filename of files) {
        const filePath = path.join(dataDir, filename);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Archivo no encontrado: ${filename}`);
            continue;
        }

        console.log(`\n📋 Procesando: ${filename}`);
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const originalCount = data.length;
            
            // Filtrar preguntas válidas
            const cleanedQuestions = data.filter(question => {
                const issues = [];
                
                // Verificar que tenga pregunta válida
                if (!question.question || question.question.trim() === '') {
                    issues.push('Pregunta vacía');
                }
                
                // Verificar preguntas solo con "Efectuar:" o similares sin contenido
                const questionText = question.question.trim();
                if (questionText === 'Efectuar:' || 
                    questionText === 'Al efectuar:' ||
                    questionText === 'Efectuando:' ||
                    questionText.match(/^(Efectuar|Al efectuar|Efectuando):\s*$/i)) {
                    issues.push('Pregunta incompleta (solo "Efectuar:")');
                }
                
                // Verificar preguntas muy cortas o sospechosas
                if (questionText.length < 10 && questionText.includes('Efectuar')) {
                    issues.push('Pregunta muy corta');
                }
                
                // Verificar que tenga opciones válidas
                if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                    issues.push('Opciones inválidas');
                }
                
                // Verificar opciones vacías o solo con "Efectuar:"
                if (question.options && Array.isArray(question.options)) {
                    const validOptions = question.options.filter(opt => 
                        opt && opt.trim() !== '' && 
                        opt.trim() !== 'Efectuar:' &&
                        opt.trim() !== 'Al efectuar:' &&
                        opt.trim() !== 'Efectuando:' &&
                        opt.trim() !== 'Ninguna de las anteriores' &&
                        opt.trim() !== 'N.d.a.' &&
                        opt.trim() !== 'd.a.'
                    );
                    
                    if (validOptions.length < 2) {
                        issues.push('No hay suficientes opciones válidas');
                    }
                }
                
                // Verificar que tenga respuesta correcta
                if (!question.correctAnswer || question.correctAnswer.trim() === '') {
                    issues.push('Respuesta correcta vacía');
                }
                
                // Verificar respuestas correctas problemáticas
                if (question.correctAnswer && (
                    question.correctAnswer.trim() === 'Efectuar:' ||
                    question.correctAnswer.trim() === 'Al efectuar:' ||
                    question.correctAnswer.trim() === 'Efectuando:' ||
                    question.correctAnswer.trim() === 'El resultado obtenido al efectuar las operaciones indicadas:' ||
                    question.correctAnswer.trim() === 'Al efectuar la operación indicada y simplificar'
                )) {
                    issues.push('Respuesta correcta es instrucción, no respuesta');
                }
                
                // Si hay problemas, mostrar y filtrar
                if (issues.length > 0) {
                    console.log(`❌ Removiendo pregunta "${question.id}" - "${questionText.substring(0, 50)}..."`);
                    console.log(`   Problemas: ${issues.join(', ')}`);
                    if (question.correctAnswer) {
                        console.log(`   Respuesta: "${question.correctAnswer}"`);
                    }
                    if (question.options) {
                        console.log(`   Opciones: [${question.options.slice(0, 3).map(o => `"${o}"`).join(', ')}...]`);
                    }
                    return false;
                }
                
                return true;
            });
            
            const removedCount = originalCount - cleanedQuestions.length;
            totalProcessed += originalCount;
            totalRemoved += removedCount;
            
            if (removedCount > 0) {
                // Crear backup antes de modificar
                const backupPath = `${filePath}.backup_cleanup.${Date.now()}`;
                fs.writeFileSync(backupPath, fs.readFileSync(filePath));
                console.log(`💾 Backup creado: ${path.basename(backupPath)}`);
                
                // Guardar archivo limpio
                fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2));
                console.log(`✅ ${filename}: ${originalCount} → ${cleanedQuestions.length} preguntas (removidas: ${removedCount})`);
            } else {
                console.log(`✅ ${filename}: ${originalCount} preguntas (sin cambios)`);
            }
            
        } catch (error) {
            console.error(`❌ Error procesando ${filename}:`, error.message);
        }
    }
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   Total procesadas: ${totalProcessed}`);
    console.log(`   Total removidas: ${totalRemoved}`);
    console.log(`   Total válidas: ${totalProcessed - totalRemoved}`);
    console.log(`   Porcentaje limpieza: ${((totalRemoved / totalProcessed) * 100).toFixed(1)}%`);
}

// Ejecutar script
cleanIncompleteQuestions().catch(console.error);