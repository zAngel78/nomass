const fs = require('fs');
const path = require('path');

// Función para generar ID único
function generateId() {
  return `math_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función para mezclar array
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generar preguntas de nivel intermedio-avanzado (Parte 1)
function generateIntermediateQuestions() {
  return [
    {
      id: generateId(),
      question: "Resolver: ∛(8×27) + √(144) - ∜(16)",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["16", "18", "14", "20", "12"]),
      correctAnswer: "16"
    },
    {
      id: generateId(),
      question: "Si log₂(x) = 5, entonces x es igual a:",
      subject: "Matemáticas", 
      difficulty: "general",
      explanation: "",
      options: shuffle(["32", "10", "25", "16", "64"]),
      correctAnswer: "32"
    },
    {
      id: generateId(),
      question: "La derivada de f(x) = 3x² + 2x - 5 es:",
      subject: "Matemáticas",
      difficulty: "general", 
      explanation: "",
      options: shuffle(["6x + 2", "3x + 2", "6x - 5", "3x² + 2", "6x + 2x"]),
      correctAnswer: "6x + 2"
    },
    {
      id: generateId(),
      question: "Resolver el sistema: 2x + 3y = 12, x - y = 1. El valor de x es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["3", "4", "2", "5", "1"]),
      correctAnswer: "3"
    },
    {
      id: generateId(),
      question: "El área de un círculo con radio 5 cm es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["25π cm²", "10π cm²", "50π cm²", "5π cm²", "15π cm²"]),
      correctAnswer: "25π cm²"
    },
    {
      id: generateId(),
      question: "Si sen(θ) = 3/5 y θ está en el primer cuadrante, entonces cos(θ) =",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["4/5", "3/4", "5/4", "5/3", "2/5"]),
      correctAnswer: "4/5"
    },
    {
      id: generateId(),
      question: "La integral de ∫2x dx es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["x² + C", "2x² + C", "x²/2 + C", "2x + C", "x + C"]),
      correctAnswer: "x² + C"
    },
    {
      id: generateId(),
      question: "Factorizar: x² - 9x + 18",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["(x-3)(x-6)", "(x-2)(x-9)", "(x-1)(x-18)", "(x+3)(x-6)", "(x-4)(x-5)"]),
      correctAnswer: "(x-3)(x-6)"
    },
    {
      id: generateId(),
      question: "Una progresión aritmética tiene a₁ = 5 y d = 3. El término a₁₀ es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["32", "35", "29", "38", "30"]),
      correctAnswer: "32"
    },
    {
      id: generateId(),
      question: "El determinante de la matriz [[2,1],[3,4]] es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["5", "8", "11", "7", "6"]),
      correctAnswer: "5"
    },
    {
      id: generateId(),
      question: "Resolver: 2^(x+1) = 32",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["4", "5", "3", "6", "2"]),
      correctAnswer: "4"
    },
    {
      id: generateId(),
      question: "El límite de (x²-4)/(x-2) cuando x→2 es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["4", "2", "0", "∞", "No existe"]),
      correctAnswer: "4"
    },
    {
      id: generateId(),
      question: "La ecuación de la recta que pasa por (2,3) y (4,7) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["y = 2x - 1", "y = 2x + 1", "y = x + 1", "y = 3x - 3", "y = x - 1"]),
      correctAnswer: "y = 2x - 1"
    },
    {
      id: generateId(),
      question: "El volumen de un cilindro con radio 3 y altura 8 es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["72π", "48π", "96π", "24π", "36π"]),
      correctAnswer: "72π"
    },
    {
      id: generateId(),
      question: "Si f(x) = x³ - 2x + 1, entonces f'(2) =",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["10", "12", "8", "6", "14"]),
      correctAnswer: "10"
    },
    {
      id: generateId(),
      question: "La probabilidad de obtener al menos un 6 en dos lanzamientos de un dado es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["11/36", "1/6", "2/6", "5/36", "7/36"]),
      correctAnswer: "11/36"
    },
    {
      id: generateId(),
      question: "Resolver: |2x - 6| = 8",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["x = 7 o x = -1", "x = 5 o x = 1", "x = 6 o x = 2", "x = 8 o x = -2", "x = 4 o x = 0"]),
      correctAnswer: "x = 7 o x = -1"
    },
    {
      id: generateId(),
      question: "La suma de los ángulos interiores de un hexágono es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["720°", "540°", "900°", "1080°", "600°"]),
      correctAnswer: "720°"
    },
    {
      id: generateId(),
      question: "Si z = 3 + 4i, entonces |z| =",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["5", "7", "3", "4", "6"]),
      correctAnswer: "5"
    },
    {
      id: generateId(),
      question: "La ecuación x² + y² - 4x + 6y = -9 representa:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Un círculo con centro (2,-3) y radio 2", "Una parábola", "Una elipse", "Una hipérbola", "Un punto"]),
      correctAnswer: "Un círculo con centro (2,-3) y radio 2"
    }
  ];
}

// Generar preguntas de nivel avanzado (Parte 2)
function generateAdvancedQuestions() {
  return [
    {
      id: generateId(),
      question: "La transformada de Laplace de f(t) = e^(2t) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["1/(s-2)", "1/(s+2)", "2/s", "s/(s-2)", "2/(s-2)"]),
      correctAnswer: "1/(s-2)"
    },
    {
      id: generateId(),
      question: "El radio de convergencia de la serie ∑(x^n/n!) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["∞", "1", "0", "e", "π"]),
      correctAnswer: "∞"
    },
    {
      id: generateId(),
      question: "La ecuación diferencial y' + 2y = e^(-x) tiene solución general:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["y = Ce^(-2x) + xe^(-x)", "y = Ce^(-2x) + e^(-x)", "y = Ce^(2x) + xe^(-x)", "y = Ce^(-x) + xe^(-2x)", "y = Ce^(-2x) - xe^(-x)"]),
      correctAnswer: "y = Ce^(-2x) + xe^(-x)"
    },
    {
      id: generateId(),
      question: "El gradiente de f(x,y) = x²y + y³ en el punto (1,2) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["(4, 13)", "(2, 7)", "(4, 11)", "(3, 12)", "(5, 14)"]),
      correctAnswer: "(4, 13)"
    },
    {
      id: generateId(),
      question: "La integral doble ∬(xy) dA sobre R=[0,2]×[0,1] es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["1", "2", "1/2", "4", "3/2"]),
      correctAnswer: "1"
    },
    {
      id: generateId(),
      question: "Los valores propios de la matriz [[3,1],[0,2]] son:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["3 y 2", "1 y 2", "3 y 1", "2 y 0", "3 y 0"]),
      correctAnswer: "3 y 2"
    },
    {
      id: generateId(),
      question: "La serie de Fourier de f(x) = x en [-π,π] tiene coeficientes bn =",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["2(-1)^(n+1)/n", "(-1)^n/n", "1/n", "0", "π/n"]),
      correctAnswer: "2(-1)^(n+1)/n"
    },
    {
      id: generateId(),
      question: "La divergencia del campo vectorial F = (x²,y²,z²) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["2(x+y+z)", "2xyz", "x²+y²+z²", "2x+2y+2z", "6xyz"]),
      correctAnswer: "2(x+y+z)"
    },
    {
      id: generateId(),
      question: "La función generatriz de la sucesión de Fibonacci es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["x/(1-x-x²)", "1/(1-x-x²)", "x²/(1-x-x²)", "(1+x)/(1-x-x²)", "1/(1-x)²"]),
      correctAnswer: "x/(1-x-x²)"
    },
    {
      id: generateId(),
      question: "El teorema de Green relaciona una integral de línea con:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Una integral doble", "Una integral triple", "Una integral simple", "Una serie infinita", "Un límite"]),
      correctAnswer: "Una integral doble"
    },
    {
      id: generateId(),
      question: "La transformada de Fourier de δ(t) (delta de Dirac) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["1", "0", "∞", "δ(ω)", "2π"]),
      correctAnswer: "1"
    },
    {
      id: generateId(),
      question: "El teorema del valor medio para integrales establece que existe c tal que:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["f(c) = (1/(b-a))∫f(x)dx", "f'(c) = (f(b)-f(a))/(b-a)", "f(c) = 0", "f''(c) = 0", "f(c) = f(a)+f(b)"]),
      correctAnswer: "f(c) = (1/(b-a))∫f(x)dx"
    },
    {
      id: generateId(),
      question: "La convolución de f*g se define como:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["∫f(τ)g(t-τ)dτ", "∫f(t)g(t)dt", "f(t)×g(t)", "f(t)+g(t)", "∫f(t-τ)g(τ)dτ"]),
      correctAnswer: "∫f(τ)g(t-τ)dτ"
    },
    {
      id: generateId(),
      question: "El laplaciano de f(x,y,z) = x²+y²+z² es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["6", "2(x+y+z)", "2", "x²+y²+z²", "0"]),
      correctAnswer: "6"
    },
    {
      id: generateId(),
      question: "La ecuación de Euler para el cálculo de variaciones es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["∂F/∂y - d/dx(∂F/∂y') = 0", "∂F/∂x = 0", "F = 0", "∂²F/∂y² = 0", "dF/dx = 0"]),
      correctAnswer: "∂F/∂y - d/dx(∂F/∂y') = 0"
    },
    {
      id: generateId(),
      question: "El número de permutaciones de n objetos tomados r a la vez es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["n!/(n-r)!", "n!/r!", "n!/(r!(n-r)!)", "n^r", "r^n"]),
      correctAnswer: "n!/(n-r)!"
    },
    {
      id: generateId(),
      question: "La distribución normal estándar tiene media y varianza:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["μ=0, σ²=1", "μ=1, σ²=0", "μ=1, σ²=1", "μ=0, σ²=0", "μ=π, σ²=e"]),
      correctAnswer: "μ=0, σ²=1"
    },
    {
      id: generateId(),
      question: "El criterio de convergencia de Cauchy establece que una serie converge si:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["lim|an+p - an| = 0", "lim|an| = 0", "∑an < ∞", "an → 0", "Todas las anteriores"]),
      correctAnswer: "lim|an+p - an| = 0"
    },
    {
      id: generateId(),
      question: "La función zeta de Riemann ζ(2) es igual a:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["π²/6", "π/4", "1", "e", "π"]),
      correctAnswer: "π²/6"
    },
    {
      id: generateId(),
      question: "El teorema de Stokes relaciona una integral de superficie con:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Una integral de línea", "Una integral doble", "Una integral triple", "Una suma", "Un producto"]),
      correctAnswer: "Una integral de línea"
    }
  ];
}

// Generar preguntas de nivel muy avanzado (Parte 3)
function generateExpertQuestions() {
  return [
    {
      id: generateId(),
      question: "El grupo fundamental del toro es isomorfo a:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Z×Z", "Z", "Z/2Z", "S₁", "R"]),
      correctAnswer: "Z×Z"
    },
    {
      id: generateId(),
      question: "La característica de Euler del plano proyectivo real es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["1", "2", "0", "-1", "3"]),
      correctAnswer: "1"
    },
    {
      id: generateId(),
      question: "El anillo de polinomios Z[x] es un dominio de ideales principales:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Falso", "Verdadero", "Depende de x", "Solo para grado ≤ 2", "Solo si x es primo"]),
      correctAnswer: "Falso"
    },
    {
      id: generateId(),
      question: "La dimensión de Hausdorff del conjunto de Cantor es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["log(2)/log(3)", "1/2", "0", "1", "2"]),
      correctAnswer: "log(2)/log(3)"
    },
    {
      id: generateId(),
      question: "El lema de Zorn es equivalente a:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["El axioma de elección", "El teorema de Cantor", "La hipótesis del continuo", "El teorema de Gödel", "Ninguna de las anteriores"]),
      correctAnswer: "El axioma de elección"
    },
    {
      id: generateId(),
      question: "La conjetura de Goldbach afirma que todo número par > 2 es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Suma de dos primos", "Producto de dos primos", "Potencia de un primo", "Primo", "Compuesto"]),
      correctAnswer: "Suma de dos primos"
    },
    {
      id: generateId(),
      question: "El grupo de Galois de x⁴ - 2 sobre Q es isomorfo a:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["D₄", "S₄", "Z₄", "V₄", "A₄"]),
      correctAnswer: "D₄"
    },
    {
      id: generateId(),
      question: "La función modulor j es invariante bajo la acción de:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["PSL₂(Z)", "GL₂(R)", "SL₂(C)", "O(n)", "U(1)"]),
      correctAnswer: "PSL₂(Z)"
    },
    {
      id: generateId(),
      question: "El teorema de Atiyah-Singer relaciona:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Índice analítico con topológico", "Homología con cohomología", "Geometría con álgebra", "Análisis con topología", "Todas las anteriores"]),
      correctAnswer: "Índice analítico con topológico"
    },
    {
      id: generateId(),
      question: "La hipótesis de Riemann se refiere a los ceros de:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["ζ(s)", "Γ(s)", "L(s,χ)", "Todas las L-funciones", "θ(s)"]),
      correctAnswer: "ζ(s)"
    },
    {
      id: generateId(),
      question: "El número de clases del cuerpo Q(√-5) es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["2", "1", "3", "4", "5"]),
      correctAnswer: "2"
    },
    {
      id: generateId(),
      question: "La categoría de espacios topológicos es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Completa y cocompleta", "Solo completa", "Solo cocompleta", "Ni completa ni cocompleta", "Abeliana"]),
      correctAnswer: "Completa y cocompleta"
    },
    {
      id: generateId(),
      question: "El teorema de clasificación de superficies dice que toda superficie compacta es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Suma conexa de toros o planos proyectivos", "Homeomorfa a S²", "Orientable", "Simplemente conexa", "De género finito"]),
      correctAnswer: "Suma conexa de toros o planos proyectivos"
    },
    {
      id: generateId(),
      question: "La constante de Euler-Mascheroni γ es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["lim(Hₙ - ln n)", "e", "π", "φ", "√2"]),
      correctAnswer: "lim(Hₙ - ln n)"
    },
    {
      id: generateId(),
      question: "El último teorema de Fermat fue demostrado usando:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Curvas elípticas y formas modulares", "Teoría de números algebraicos", "Geometría algebraica", "Análisis complejo", "Lógica matemática"]),
      correctAnswer: "Curvas elípticas y formas modulares"
    },
    {
      id: generateId(),
      question: "La conjetura de Poincaré se refiere a la caracterización de:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["La 3-esfera", "El toro", "El plano proyectivo", "La botella de Klein", "El disco"]),
      correctAnswer: "La 3-esfera"
    },
    {
      id: generateId(),
      question: "El teorema de los cuatro colores se refiere a:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["Coloreo de mapas planares", "Partición de números", "Teoría de grafos", "Topología algebraica", "Geometría diferencial"]),
      correctAnswer: "Coloreo de mapas planares"
    },
    {
      id: generateId(),
      question: "La medida de Lebesgue en R es:",
      subject: "Matemáticas",
      difficulty: "general",
      explanation: "",
      options: shuffle(["σ-finita y invariante por traslaciones", "Finita", "Solo invariante por rotaciones", "Discreta", "Singular"]),
      correctAnswer: "σ-finita y invariante por traslaciones"
    }
  ];
}

// Función principal
async function generateAllQuestions() {
  try {
    // Leer preguntas existentes
    const existingPath = path.join(__dirname, '../data/questions_matematicas_general_final.json');
    const existingQuestions = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    
    // Generar nuevas preguntas
    const intermediateQuestions = generateIntermediateQuestions();
    const advancedQuestions = generateAdvancedQuestions();
    const expertQuestions = generateExpertQuestions();
    
    // Combinar todas las preguntas
    const allQuestions = [
      ...existingQuestions,
      ...intermediateQuestions,
      ...advancedQuestions,
      ...expertQuestions
    ];
    
    // Verificar que tenemos 60 preguntas
    console.log(`📊 Total de preguntas generadas: ${allQuestions.length}`);
    console.log(`📝 Preguntas existentes: ${existingQuestions.length}`);
    console.log(`🎯 Preguntas nivel intermedio: ${intermediateQuestions.length}`);
    console.log(`🚀 Preguntas nivel avanzado: ${advancedQuestions.length}`);
    console.log(`💫 Preguntas nivel experto: ${expertQuestions.length}`);
    
    // Guardar el archivo actualizado
    fs.writeFileSync(existingPath, JSON.stringify(allQuestions, null, 2), 'utf8');
    
    console.log(`✅ Archivo actualizado exitosamente: ${existingPath}`);
    console.log(`🎉 Total de preguntas: ${allQuestions.length}/60`);
    
  } catch (error) {
    console.error('❌ Error generando preguntas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateAllQuestions();
}

module.exports = { generateAllQuestions };