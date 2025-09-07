const fs = require('fs');

const data = JSON.parse(fs.readFileSync('../data/questions_matematicas.json', 'utf8'));

console.log('📊 Análisis de preguntas de matemáticas:');
console.log('Total preguntas actuales:', data.length);
console.log('');

// Para 20 partes exactas, necesitamos un múltiplo de 20
const questionsPer20Parts = Math.ceil(data.length / 20) * 20;
console.log('Preguntas necesarias para 20 partes exactas:', questionsPer20Parts);
console.log('Preguntas que faltan:', questionsPer20Parts - data.length);
console.log('Preguntas por parte:', questionsPer20Parts / 20);
console.log('');

// Analizar dificultades existentes
const difficulties = {};
data.forEach(q => {
  const diff = q.difficulty || 1;
  difficulties[diff] = (difficulties[diff] || 0) + 1;
});

console.log('🎯 Distribución actual por dificultad:');
Object.keys(difficulties).sort().forEach(diff => {
  console.log(`  Dificultad ${diff}: ${difficulties[diff]} preguntas`);
});

console.log('');

// Encontrar el último ID para continuar la secuencia
let maxIdNumber = 0;
data.forEach(q => {
  const match = q.id.match(/math_norm_(\d+)/);
  if (match) {
    maxIdNumber = Math.max(maxIdNumber, parseInt(match[1]));
  }
});

console.log('🔢 Último ID numérico encontrado:', maxIdNumber);
console.log('Próximo ID a usar: math_norm_' + (maxIdNumber + 1));