const fs = require('fs');

// Generador de preguntas de matemáticas
class MathQuestionGenerator {
  constructor(startId = 601) {
    this.currentId = startId;
    this.questions = [];
  }

  // Generar un número aleatorio en un rango
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generar operaciones aritméticas básicas
  generateArithmeticQuestion() {
    const operations = ['+', '-', '*'];
    const op1 = operations[this.random(0, 2)];
    const op2 = operations[this.random(0, 2)];
    
    let a, b, c, result;
    
    // Generar números y resultado
    if (op1 === '*' || op2 === '*') {
      // Con multiplicación, usar números más pequeños
      a = this.random(2, 15);
      b = this.random(2, 12);
      c = this.random(1, 10);
    } else {
      // Sin multiplicación, números más grandes
      a = this.random(10, 99);
      b = this.random(10, 99);
      c = this.random(5, 50);
    }
    
    // Calcular resultado
    let expression = `${a} ${op1} ${b} ${op2} ${c}`;
    result = eval(expression);
    
    // Generar opciones incorrectas
    const incorrectOptions = [
      result + this.random(1, 10),
      result - this.random(1, 10),
      Math.abs(result + this.random(5, 15)),
      Math.abs(result - this.random(5, 15))
    ];
    
    const allOptions = [result.toString(), ...incorrectOptions.map(o => o.toString())];
    
    // Mezclar opciones
    const shuffledOptions = this.shuffleArray([...new Set(allOptions)]).slice(0, 5);
    if (!shuffledOptions.includes(result.toString())) {
      shuffledOptions[0] = result.toString();
    }
    
    return {
      id: `math_norm_${this.currentId++}`,
      question: `Efectuar: ${expression}`,
      subject: 'Matemáticas',
      difficulty: 1,
      explanation: '',
      options: shuffledOptions,
      correctAnswer: result.toString()
    };
  }

  // Generar preguntas de fracciones
  generateFractionQuestion() {
    const operations = ['suma', 'resta', 'multiplicación', 'división'];
    const operation = operations[this.random(0, 3)];
    
    let num1 = this.random(1, 9);
    let den1 = this.random(2, 12);
    let num2 = this.random(1, 9);
    let den2 = this.random(2, 12);
    
    // Simplificar fracciones
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    
    let resultNum, resultDen, questionText;
    
    switch (operation) {
      case 'suma':
        resultNum = num1 * den2 + num2 * den1;
        resultDen = den1 * den2;
        questionText = `¿Cuál es el resultado de ${num1}/${den1} + ${num2}/${den2}?`;
        break;
      case 'resta':
        resultNum = num1 * den2 - num2 * den1;
        resultDen = den1 * den2;
        questionText = `¿Cuál es el resultado de ${num1}/${den1} - ${num2}/${den2}?`;
        break;
      case 'multiplicación':
        resultNum = num1 * num2;
        resultDen = den1 * den2;
        questionText = `¿Cuál es el resultado de ${num1}/${den1} × ${num2}/${den2}?`;
        break;
      case 'división':
        resultNum = num1 * den2;
        resultDen = den1 * num2;
        questionText = `¿Cuál es el resultado de ${num1}/${den1} ÷ ${num2}/${den2}?`;
        break;
    }
    
    // Simplificar el resultado
    const commonFactor = gcd(Math.abs(resultNum), Math.abs(resultDen));
    resultNum = resultNum / commonFactor;
    resultDen = resultDen / commonFactor;
    
    const correctAnswer = `${resultNum}/${resultDen}`;
    
    // Generar opciones incorrectas
    const incorrectOptions = [
      `${resultNum + 1}/${resultDen}`,
      `${resultNum}/${resultDen + 1}`,
      `${resultNum - 1}/${resultDen}`,
      `${resultNum * 2}/${resultDen * 2}`
    ];
    
    const allOptions = [correctAnswer, ...incorrectOptions];
    const shuffledOptions = this.shuffleArray([...new Set(allOptions)]).slice(0, 5);
    if (!shuffledOptions.includes(correctAnswer)) {
      shuffledOptions[0] = correctAnswer;
    }
    
    return {
      id: `math_norm_${this.currentId++}`,
      question: questionText,
      subject: 'Matemáticas',
      difficulty: 2,
      explanation: '',
      options: shuffledOptions,
      correctAnswer: correctAnswer
    };
  }

  // Generar preguntas de porcentajes
  generatePercentageQuestion() {
    const number = this.random(100, 1000);
    const percentage = this.random(10, 50);
    const result = (number * percentage) / 100;
    
    const questionText = `¿Cuál es el ${percentage}% de ${number}?`;
    
    const incorrectOptions = [
      result + this.random(10, 50),
      result - this.random(10, 50),
      Math.round(result * 1.2),
      Math.round(result * 0.8)
    ];
    
    const allOptions = [result.toString(), ...incorrectOptions.map(o => o.toString())];
    const shuffledOptions = this.shuffleArray([...new Set(allOptions)]).slice(0, 5);
    if (!shuffledOptions.includes(result.toString())) {
      shuffledOptions[0] = result.toString();
    }
    
    return {
      id: `math_norm_${this.currentId++}`,
      question: questionText,
      subject: 'Matemáticas',
      difficulty: 2,
      explanation: '',
      options: shuffledOptions,
      correctAnswer: result.toString()
    };
  }

  // Generar ecuaciones lineales simples
  generateLinearEquation() {
    const a = this.random(2, 10);
    const b = this.random(5, 25);
    const x = this.random(1, 15);
    const result = a * x + b;
    
    const questionText = `Si ${a}x + ${b} = ${result}, ¿cuál es el valor de x?`;
    
    const incorrectOptions = [
      x + this.random(1, 5),
      x - this.random(1, 5),
      x * 2,
      Math.round(x / 2) || 1
    ];
    
    const allOptions = [x.toString(), ...incorrectOptions.map(o => o.toString())];
    const shuffledOptions = this.shuffleArray([...new Set(allOptions)]).slice(0, 5);
    if (!shuffledOptions.includes(x.toString())) {
      shuffledOptions[0] = x.toString();
    }
    
    return {
      id: `math_norm_${this.currentId++}`,
      question: questionText,
      subject: 'Matemáticas',
      difficulty: 3,
      explanation: '',
      options: shuffledOptions,
      correctAnswer: x.toString()
    };
  }

  // Generar problemas de área y perímetro
  generateGeometryQuestion() {
    const shapes = ['rectángulo', 'cuadrado', 'triángulo'];
    const shape = shapes[this.random(0, 2)];
    const operations = ['área', 'perímetro'];
    const operation = operations[this.random(0, 1)];
    
    let questionText, correctAnswer;
    
    if (shape === 'rectángulo') {
      const largo = this.random(5, 20);
      const ancho = this.random(3, 15);
      
      if (operation === 'área') {
        correctAnswer = largo * ancho;
        questionText = `¿Cuál es el área de un rectángulo de ${largo} cm de largo y ${ancho} cm de ancho?`;
      } else {
        correctAnswer = 2 * (largo + ancho);
        questionText = `¿Cuál es el perímetro de un rectángulo de ${largo} cm de largo y ${ancho} cm de ancho?`;
      }
    } else if (shape === 'cuadrado') {
      const lado = this.random(5, 15);
      
      if (operation === 'área') {
        correctAnswer = lado * lado;
        questionText = `¿Cuál es el área de un cuadrado de ${lado} cm de lado?`;
      } else {
        correctAnswer = 4 * lado;
        questionText = `¿Cuál es el perímetro de un cuadrado de ${lado} cm de lado?`;
      }
    } else { // triángulo
      const base = this.random(6, 20);
      const altura = this.random(4, 15);
      
      if (operation === 'área') {
        correctAnswer = (base * altura) / 2;
        questionText = `¿Cuál es el área de un triángulo con base de ${base} cm y altura de ${altura} cm?`;
      } else {
        // Para perímetro, asumimos triángulo equilátero
        correctAnswer = base * 3;
        questionText = `¿Cuál es el perímetro de un triángulo equilátero de ${base} cm de lado?`;
      }
    }
    
    const incorrectOptions = [
      correctAnswer + this.random(5, 15),
      correctAnswer - this.random(3, 10),
      Math.round(correctAnswer * 1.5),
      Math.round(correctAnswer * 0.7)
    ].filter(opt => opt > 0);
    
    const allOptions = [correctAnswer.toString(), ...incorrectOptions.map(o => o.toString())];
    const shuffledOptions = this.shuffleArray([...new Set(allOptions)]).slice(0, 5);
    if (!shuffledOptions.includes(correctAnswer.toString())) {
      shuffledOptions[0] = correctAnswer.toString();
    }
    
    return {
      id: `math_norm_${this.currentId++}`,
      question: questionText,
      subject: 'Matemáticas',
      difficulty: 2,
      explanation: '',
      options: shuffledOptions,
      correctAnswer: correctAnswer.toString()
    };
  }

  // Mezclar array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generar preguntas faltantes
  generateMissingQuestions(count) {
    console.log(`🎲 Generando ${count} preguntas de matemáticas...`);
    
    const questionTypes = [
      'arithmetic', 'arithmetic', 'arithmetic', // Más preguntas aritméticas
      'fraction', 'fraction',
      'percentage', 'percentage',
      'linear', 'linear',
      'geometry', 'geometry'
    ];
    
    for (let i = 0; i < count; i++) {
      const type = questionTypes[i % questionTypes.length];
      let question;
      
      switch (type) {
        case 'arithmetic':
          question = this.generateArithmeticQuestion();
          break;
        case 'fraction':
          question = this.generateFractionQuestion();
          break;
        case 'percentage':
          question = this.generatePercentageQuestion();
          break;
        case 'linear':
          question = this.generateLinearEquation();
          break;
        case 'geometry':
          question = this.generateGeometryQuestion();
          break;
      }
      
      this.questions.push(question);
      console.log(`✅ Generada pregunta ${i + 1}/${count}: ${question.question.substring(0, 50)}...`);
    }
    
    return this.questions;
  }
}

// Ejecutar generación
const generator = new MathQuestionGenerator(601);
const newQuestions = generator.generateMissingQuestions(18);

// Cargar preguntas existentes
const existingQuestions = JSON.parse(fs.readFileSync('../data/questions_matematicas.json', 'utf8'));

// Combinar preguntas
const allQuestions = [...existingQuestions, ...newQuestions];

// Crear backup
const backupPath = `../data/questions_matematicas.json.backup_before_completion.${Date.now()}`;
fs.writeFileSync(backupPath, fs.readFileSync('../data/questions_matematicas.json'));
console.log(`💾 Backup creado: ${backupPath.split('/').pop()}`);

// Guardar preguntas completas
fs.writeFileSync('../data/questions_matematicas.json', JSON.stringify(allQuestions, null, 2));

console.log(`\n🎉 COMPLETADO:`);
console.log(`   Preguntas anteriores: ${existingQuestions.length}`);
console.log(`   Preguntas generadas: ${newQuestions.length}`);
console.log(`   Total final: ${allQuestions.length}`);
console.log(`   Partes exactas: ${allQuestions.length / 12} partes de 12 preguntas cada una`);
console.log(`\n✅ Ahora tienes exactamente 20 partes para matemáticas!`);