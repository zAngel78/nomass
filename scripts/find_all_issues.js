const fs = require('fs');

const data = JSON.parse(fs.readFileSync('../data/questions_matematicas.json', 'utf8'));

console.log('🔍 Búsqueda exhaustiva de ALL preguntas problemáticas...\n');

let problemCount = 0;
data.forEach((q, i) => {
  const text = q.question?.trim() || '';
  const answer = q.correctAnswer?.trim() || '';
  const options = q.options || [];
  
  const issues = [];
  
  // Preguntas que terminan abruptamente
  if (text.endsWith(':') && !text.includes('?') && text.length < 40) {
    issues.push('Termina en ":" sin contenido');
  }
  
  // Preguntas con espacios dobles (indican texto faltante)
  if (text.includes('  ') || text.includes(' ,') || text.includes(', ') && text.includes(' :')) {
    issues.push('Espacios sospechosos (texto faltante)');
  }
  
  // Preguntas muy cortas con palabras de cálculo
  if (text.length < 30 && (text.includes('Efectuar') || text.includes('Calcular') || text.includes('Resolver'))) {
    issues.push('Pregunta de cálculo muy corta');
  }
  
  // Respuestas que parecen preguntas
  if (answer.length > 40 && (answer.includes('¿') || answer.includes('?') || answer.includes('Calcula') || answer.includes('hallar'))) {
    issues.push('Respuesta parece ser una pregunta');
  }
  
  // Opciones que parecen preguntas largas
  const longQuestionOptions = options.filter(opt => 
    opt && opt.length > 60 && (opt.includes('¿') || opt.includes('Si ') || opt.includes('El área'))
  );
  if (longQuestionOptions.length > 0) {
    issues.push('Opciones contienen preguntas largas');
  }
  
  // Preguntas con palabras clave problemáticas
  if (text.includes('La expresión') && text.includes('es igual a:') && text.includes('  ')) {
    issues.push('Expresión matemática faltante');
  }
  
  if (text.includes('Al efectuar') && text.includes('  ')) {
    issues.push('Fórmula de efectuar faltante');
  }
  
  // Preguntas que son fragmentos
  if (text.includes('De las') && text.endsWith(':')) {
    issues.push('Pregunta incompleta de selección múltiple');
  }
  
  // Respuestas extrañas
  if (answer.includes('\t') || answer.includes('b.') || answer.includes('c.') || answer.includes('d.')) {
    issues.push('Respuesta contiene formato de opciones');
  }
  
  if (issues.length > 0) {
    problemCount++;
    console.log(`${problemCount}. ID: ${q.id} (posición ${i+1})`);
    console.log(`   Pregunta: "${text}"`);
    console.log(`   Respuesta: "${answer}"`);
    console.log(`   Problemas: ${issues.join(', ')}`);
    
    if (longQuestionOptions.length > 0) {
      console.log(`   Opción problemática: "${longQuestionOptions[0].substring(0, 80)}..."`);
    }
    console.log('');
  }
});

console.log(`📊 Total preguntas con posibles problemas: ${problemCount} de ${data.length}`);