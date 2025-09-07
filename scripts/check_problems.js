const fs = require('fs');

const data = JSON.parse(fs.readFileSync('../data/questions_matematicas.json', 'utf8'));

console.log('🔍 Buscando preguntas problemáticas...\n');

let problemCount = 0;
data.forEach((q, i) => {
  const text = q.question?.trim() || '';
  const isProblematic = (
    text.length < 20 || 
    text === 'Efectuar:' || 
    text === 'Al efectuar:' ||
    text === 'Efectuando:' ||
    (text.endsWith(':') && text.length < 30) ||
    !q.correctAnswer || 
    q.correctAnswer.trim() === '' ||
    q.correctAnswer === 'Efectuar:' ||
    q.correctAnswer === 'Al efectuar:'
  );
  
  if (isProblematic) {
    problemCount++;
    console.log(`${problemCount}. ID: ${q.id} (posición ${i+1})`);
    console.log(`   Pregunta: "${text}"`);
    console.log(`   Respuesta: "${q.correctAnswer || 'N/A'}"`);
    if (q.options && q.options.length > 0) {
      console.log(`   Opciones: ["${q.options[0]}", "${q.options[1]}", ...]`);
    }
    console.log('');
  }
});

console.log(`📊 Total preguntas problemáticas: ${problemCount} de ${data.length}`);