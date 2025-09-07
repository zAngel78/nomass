const fs = require('fs');

async function smartNuclearCleanup() {
    const filePath = '../data/questions_matematicas.json';
    
    console.log('🧠 LIMPIEZA NUCLEAR INTELIGENTE - Preservando preguntas válidas...\n');
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalCount = data.length;
    
    const cleanedQuestions = data.filter(question => {
        const text = question.question?.trim() || '';
        const answer = question.correctAnswer?.trim() || '';
        const options = question.options || [];
        
        const issues = [];
        
        // ===== PRESERVAR PREGUNTAS VÁLIDAS DE EFECTUAR =====
        const isValidEffectuar = (
            (text.includes('Efectuar:') || text.includes('Efectúa:')) &&
            text.length > 15 && 
            /[0-9+\-*/()=]/.test(text) && // Contiene números y operaciones
            !text.includes('  ') && // Sin espacios dobles
            text !== 'Efectuar:' && // No es solo "Efectuar:"
            text !== 'Efectúa:' &&
            !text.endsWith(': ') && // No termina en ": "
            answer && answer.length > 0 && answer.length < 30 // Respuesta simple
        );
        
        if (isValidEffectuar) {
            console.log(`✅ PRESERVANDO: ${question.id} - "${text}"`);
            return true; // MANTENER preguntas válidas de Efectuar
        }
        
        // ===== ELIMINAR PREGUNTAS PROBLEMÁTICAS =====
        
        // ELIMINAR: Preguntas de "Efectuar" que están INCOMPLETAS
        if ((text.includes('Efectuar') || text.includes('Efectúa')) && (
            text === 'Efectuar:' ||
            text === 'Efectúa:' ||
            text.length < 15 ||
            text.includes('  ') || // Espacios dobles = fórmula faltante
            text.endsWith(': ') ||
            !answer || answer.length === 0
        )) {
            issues.push('Efectuar incompleto');
        }
        
        // ELIMINAR: Preguntas que terminan en ":" (incompletas) 
        if (text.endsWith(':') && !text.includes('?') && !isValidEffectuar) {
            issues.push('Pregunta incompleta');
        }
        
        // ELIMINAR: Preguntas con espacios dobles (fórmulas faltantes)
        if (text.includes('  ') || text.includes(' ,') || text.includes(' :')) {
            issues.push('Fórmulas faltantes');
        }
        
        // ELIMINAR: Respuestas que contienen tabuladores o formato de opciones
        if (answer.includes('\t') || answer.includes('b.') || answer.includes('c.') || answer.includes('d.') || answer.includes('e.')) {
            issues.push('Respuesta con formato corrupto');
        }
        
        // ELIMINAR: Respuestas que son preguntas largas (más de 80 chars con ¿ o ?)
        if (answer.length > 80 && (answer.includes('¿') || answer.includes('?') || answer.includes('Calcula') || answer.includes('hallar'))) {
            issues.push('Respuesta es pregunta');
        }
        
        // ELIMINAR: Opciones que son preguntas largas (más de 80 chars)
        const questionOptions = options.filter(opt => 
            opt && opt.length > 80 && (opt.includes('¿') || opt.includes('Si ') || opt.includes('Un '))
        );
        if (questionOptions.length > 0) {
            issues.push('Opciones son preguntas');
        }
        
        // ELIMINAR: Preguntas que empiezan con números o letras (son respuestas corruptas)
        if (text.match(/^[0-9]+\s/) || text.match(/^[0-9]+[a-z]\./) || text.match(/^[a-z]\./)) {
            issues.push('Pregunta empieza con número/letra');
        }
        
        // ELIMINAR: Preguntas que contienen "De las afirmaciones/opciones" sin contexto
        if ((text.includes('De las afirmaciones') || text.includes('De las opciones') || text.includes('De las siguientes')) && 
            (text.endsWith(':') || text.length < 50)) {
            issues.push('Pregunta de selección incompleta');
        }
        
        // ELIMINAR: Preguntas sobre expresiones matemáticas sin mostrar la expresión
        if ((text.includes('La expresión') || text.includes('El resultado de')) && 
            text.includes('  ') && !isValidEffectuar) {
            issues.push('Expresión matemática no visible');
        }
        
        // ELIMINAR: Respuestas que son instrucciones
        if (answer.startsWith('De estas') || answer.startsWith('Se deduce') || 
            answer.startsWith('La(s) suma') || answer.startsWith('Una fracción')) {
            issues.push('Respuesta es instrucción');
        }
        
        // ELIMINAR: Preguntas con variables sin definir
        if (text.includes('Sean ') && text.includes('  ') && text.endsWith(':')) {
            issues.push('Variables sin definir');
        }
        
        // ELIMINAR: Solo si hay problemas reales
        if (issues.length > 0) {
            console.log(`❌ ${question.id}: "${text.substring(0, 60)}..."`);
            console.log(`   Problemas: ${issues.join(', ')}`);
            return false;
        }
        
        return true; // MANTENER pregunta válida
    });
    
    const removedCount = originalCount - cleanedQuestions.length;
    
    if (removedCount > 0) {
        // Crear backup
        const backupPath = `${filePath}.backup_smart_nuclear.${Date.now()}`;
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`\n💾 Backup creado: ${backupPath.split('/').pop()}`);
        
        // Guardar archivo limpio
        fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2));
        console.log(`\n🧠 LIMPIEZA INTELIGENTE COMPLETADA:`);
        console.log(`   Preguntas originales: ${originalCount}`);
        console.log(`   Preguntas supervivientes: ${cleanedQuestions.length}`);
        console.log(`   Preguntas eliminadas: ${removedCount}`);
        console.log(`   Porcentaje eliminado: ${((removedCount / originalCount) * 100).toFixed(1)}%`);
        console.log(`   🎯 Preguntas válidas preservadas + problemáticas eliminadas.`);
    } else {
        console.log(`✅ No se encontraron preguntas problemáticas.`);
    }
}

smartNuclearCleanup().catch(console.error);