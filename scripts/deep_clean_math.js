const fs = require('fs');

async function deepCleanMathQuestions() {
    const filePath = '../data/questions_matematicas.json';
    
    console.log('🧹 Limpieza profunda de preguntas de matemáticas...\n');
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalCount = data.length;
    
    // Lista específica de IDs problemáticos detectados
    const problematicIds = [
        'math_norm_015', // "Efectúa:" con respuesta "Efectúa:"
        'math_norm_026', // "Efectuar: 4" incompleta
        'math_norm_116', // Respuesta contiene múltiples opciones formateadas mal
        'math_norm_246', // "Resolviendo:  se obtiene:" - falta fórmula
        'math_norm_251', // Respuesta es otra pregunta completa
        'math_norm_274', // "Simplificar:" sin fórmula
        'math_norm_324', // "La expresión  es igual a:" - falta expresión
        'math_norm_325', // Respuesta es otra pregunta
        'math_norm_356', // "El valor de  es igual a:" - falta expresión
        'math_norm_398', // Respuesta es continuación de pregunta
        'math_norm_437', // Respuesta es continuación de pregunta  
        'math_norm_438', // Respuesta es continuación de pregunta
        'math_norm_441', // "Al efectuar:  se obtiene:" - falta fórmula
        'math_norm_482', // "La solución de , es:" - falta ecuación
        'math_norm_498', // "Efectuando ; resulta:" - falta fórmula
        'math_norm_512', // Respuesta es otra pregunta completa
        'math_gen_608', // "Efectúa: 5." incompleta
    ];
    
    const cleanedQuestions = data.filter(question => {
        const text = question.question?.trim() || '';
        const answer = question.correctAnswer?.trim() || '';
        
        // Eliminar IDs específicamente problemáticos
        if (problematicIds.includes(question.id)) {
            console.log(`❌ Removiendo ${question.id}: "${text.substring(0, 40)}..."`);
            console.log(`   Respuesta problemática: "${answer.substring(0, 50)}..."\n`);
            return false;
        }
        
        // Filtros adicionales para detectar otros problemas
        const isProblematic = (
            // Preguntas muy cortas que terminan en ":"
            (text.length < 25 && text.includes(':')) ||
            
            // Preguntas que son solo instrucciones sin contenido
            text === 'Efectúa:' ||
            text === 'Efectuar:' ||
            text === 'Al efectuar:' ||
            text === 'Efectuando:' ||
            text === 'Simplificar:' ||
            text === 'Calcular:' ||
            text === 'Resolver:' ||
            
            // Preguntas con espacios en blanco que indican fórmulas faltantes
            text.includes('  ') && (text.includes('Efectuar') || text.includes('expresión')),
            
            // Respuestas que son claramente otras preguntas
            answer.length > 50 && (
                answer.includes('¿') || 
                answer.includes('Si ') ||
                answer.includes('Al ') ||
                answer.includes('Calcula') ||
                answer.includes('hallar')
            ),
            
            // Respuestas que son instrucciones
            answer === 'Efectúa:' ||
            answer === 'Efectuar:' ||
            answer === 'Al efectuar:' ||
            answer.startsWith('De estas afirmaciones') ||
            answer.startsWith('Se deduce que') ||
            answer.startsWith('La(s) suma(s) correcta(s)')
        );
        
        if (isProblematic) {
            console.log(`❌ Removiendo ${question.id}: "${text.substring(0, 40)}..."`);
            console.log(`   Respuesta: "${answer.substring(0, 50)}..."\n`);
            return false;
        }
        
        return true;
    });
    
    const removedCount = originalCount - cleanedQuestions.length;
    
    if (removedCount > 0) {
        // Crear backup
        const backupPath = `${filePath}.backup_deep_clean.${Date.now()}`;
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`💾 Backup creado: ${backupPath.split('/').pop()}`);
        
        // Guardar archivo limpio
        fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2));
        console.log(`\n✅ LIMPIEZA COMPLETADA:`);
        console.log(`   Preguntas originales: ${originalCount}`);
        console.log(`   Preguntas válidas: ${cleanedQuestions.length}`);
        console.log(`   Preguntas removidas: ${removedCount}`);
        console.log(`   Porcentaje removido: ${((removedCount / originalCount) * 100).toFixed(1)}%`);
    } else {
        console.log(`✅ No se encontraron más preguntas problemáticas.`);
    }
}

deepCleanMathQuestions().catch(console.error);