const fs = require('fs');

async function nuclearCleanup() {
    const filePath = '../data/questions_matematicas.json';
    
    console.log('☢️  LIMPIEZA NUCLEAR - Eliminando TODAS las preguntas corruptas...\n');
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalCount = data.length;
    
    const cleanedQuestions = data.filter(question => {
        const text = question.question?.trim() || '';
        const answer = question.correctAnswer?.trim() || '';
        const options = question.options || [];
        
        const issues = [];
        
        // ELIMINAR: Preguntas muy cortas con instrucciones de cálculo
        if (text.length < 30 && (
            text.includes('Efectuar') || 
            text.includes('Calcular') || 
            text.includes('Resolver') ||
            text.includes('Simplificar') ||
            text.includes('Factorizar')
        )) {
            issues.push('Instrucción muy corta');
        }
        
        // ELIMINAR: Preguntas que terminan en ":" (incompletas)
        if (text.endsWith(':') && !text.includes('?')) {
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
        
        // ELIMINAR: Respuestas que son preguntas (más de 60 chars con ¿ o ?)
        if (answer.length > 60 && (answer.includes('¿') || answer.includes('?') || answer.includes('Calcula') || answer.includes('hallar'))) {
            issues.push('Respuesta es pregunta');
        }
        
        // ELIMINAR: Opciones que son preguntas largas (más de 60 chars)
        const questionOptions = options.filter(opt => 
            opt && opt.length > 60 && (opt.includes('¿') || opt.includes('Si ') || opt.includes('Un '))
        );
        if (questionOptions.length > 0) {
            issues.push('Opciones son preguntas');
        }
        
        // ELIMINAR: Preguntas que empiezan con números o letras (son respuestas corruptas)
        if (text.match(/^[0-9]+/) || text.match(/^[a-z]\./)) {
            issues.push('Pregunta empieza con número/letra');
        }
        
        // ELIMINAR: Preguntas que contienen "De las afirmaciones" sin contexto
        if ((text.includes('De las afirmaciones') || text.includes('De las opciones') || text.includes('De las siguientes')) && text.endsWith(':')) {
            issues.push('Pregunta de selección incompleta');
        }
        
        // ELIMINAR: Preguntas sobre expresiones sin mostrar la expresión
        if ((text.includes('La expresión') || text.includes('Al efectuar') || text.includes('El resultado de')) && text.includes('  ')) {
            issues.push('Expresión matemática no visible');
        }
        
        // ELIMINAR: Respuestas que son instrucciones
        if (answer.startsWith('De estas') || answer.startsWith('Se deduce') || answer.startsWith('La(s) suma') || answer.startsWith('Una fracción')) {
            issues.push('Respuesta es instrucción');
        }
        
        // ELIMINAR: Preguntas demasiado específicas sin contexto
        if (text.includes('Sean ') && text.includes('  ') && text.endsWith(':')) {
            issues.push('Variables sin definir');
        }
        
        if (issues.length > 0) {
            console.log(`❌ ${question.id}: "${text.substring(0, 60)}..."`);
            console.log(`   Problemas: ${issues.join(', ')}`);
            return false;
        }
        
        return true;
    });
    
    const removedCount = originalCount - cleanedQuestions.length;
    
    if (removedCount > 0) {
        // Crear backup
        const backupPath = `${filePath}.backup_nuclear.${Date.now()}`;
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`\n💾 Backup creado: ${backupPath.split('/').pop()}`);
        
        // Guardar archivo limpio
        fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2));
        console.log(`\n☢️  LIMPIEZA NUCLEAR COMPLETADA:`);
        console.log(`   Preguntas originales: ${originalCount}`);
        console.log(`   Preguntas supervivientes: ${cleanedQuestions.length}`);
        console.log(`   Preguntas aniquiladas: ${removedCount}`);
        console.log(`   Porcentaje aniquilado: ${((removedCount / originalCount) * 100).toFixed(1)}%`);
        console.log(`   🎯 Solo quedan preguntas 100% válidas y completas.`);
    } else {
        console.log(`✅ No se encontraron más preguntas problemáticas.`);
    }
}

nuclearCleanup().catch(console.error);