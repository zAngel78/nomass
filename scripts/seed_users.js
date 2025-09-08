const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const usersFilePath = path.join(dataDir, 'users.json');

// Datos de prueba realistas
const testUsers = [
  {
    username: 'carlos_rodriguez',
    password: 'carlos123',
    name: 'Carlos Rodríguez',
    avatar: '👨',
    gender: 'male',
    totalPoints: 1250,
    dailyPoints: 85,
    loginStreak: 12,
    subjectScores: {
      'Matemáticas': { score: 420, gamesPlayed: 15, correctAnswers: 128, bestScore: 45 },
      'Castellano y Guaraní': { score: 380, gamesPlayed: 12, correctAnswers: 102, bestScore: 38 },
      'Historia y Geografía': { score: 290, gamesPlayed: 10, correctAnswers: 78, bestScore: 32 },
      'Legislación': { score: 160, gamesPlayed: 8, correctAnswers: 45, bestScore: 25 }
    }
  },
  {
    username: 'maria_gonzalez',
    password: 'maria456',
    name: 'María González',
    avatar: '👩',
    gender: 'female',
    totalPoints: 1180,
    dailyPoints: 72,
    loginStreak: 8,
    subjectScores: {
      'Matemáticas': { score: 350, gamesPlayed: 14, correctAnswers: 115, bestScore: 42 },
      'Castellano y Guaraní': { score: 440, gamesPlayed: 16, correctAnswers: 135, bestScore: 41 },
      'Historia y Geografía': { score: 310, gamesPlayed: 11, correctAnswers: 85, bestScore: 35 },
      'Legislación': { score: 80, gamesPlayed: 5, correctAnswers: 22, bestScore: 18 }
    }
  },
  {
    username: 'luis_martinez',
    password: 'luis789',
    name: 'Luis Martínez',
    avatar: '🧑',
    gender: 'male',
    totalPoints: 980,
    dailyPoints: 45,
    loginStreak: 5,
    subjectScores: {
      'Matemáticas': { score: 280, gamesPlayed: 12, correctAnswers: 92, bestScore: 35 },
      'Castellano y Guaraní': { score: 320, gamesPlayed: 13, correctAnswers: 98, bestScore: 33 },
      'Historia y Geografía': { score: 260, gamesPlayed: 9, correctAnswers: 71, bestScore: 30 },
      'Legislación': { score: 120, gamesPlayed: 6, correctAnswers: 35, bestScore: 22 }
    }
  },
  {
    username: 'ana_silva',
    password: 'ana321',
    name: 'Ana Silva',
    avatar: '👱‍♀️',
    gender: 'female',
    totalPoints: 1420,
    dailyPoints: 95,
    loginStreak: 15,
    subjectScores: {
      'Matemáticas': { score: 480, gamesPlayed: 18, correctAnswers: 152, bestScore: 48 },
      'Castellano y Guaraní': { score: 390, gamesPlayed: 14, correctAnswers: 118, bestScore: 39 },
      'Historia y Geografía': { score: 350, gamesPlayed: 13, correctAnswers: 98, bestScore: 38 },
      'Legislación': { score: 200, gamesPlayed: 9, correctAnswers: 58, bestScore: 28 }
    }
  },
  {
    username: 'pedro_lopez',
    password: 'pedro654',
    name: 'Pedro López',
    avatar: '👨‍💼',
    gender: 'male',
    totalPoints: 850,
    dailyPoints: 32,
    loginStreak: 3,
    subjectScores: {
      'Matemáticas': { score: 240, gamesPlayed: 10, correctAnswers: 78, bestScore: 30 },
      'Castellano y Guaraní': { score: 290, gamesPlayed: 11, correctAnswers: 82, bestScore: 32 },
      'Historia y Geografía': { score: 220, gamesPlayed: 8, correctAnswers: 61, bestScore: 28 },
      'Legislación': { score: 100, gamesPlayed: 5, correctAnswers: 28, bestScore: 20 }
    }
  },
  {
    username: 'sofia_mendez',
    password: 'sofia987',
    name: 'Sofia Méndez',
    avatar: '👩‍🎓',
    gender: 'female',
    totalPoints: 1320,
    dailyPoints: 88,
    loginStreak: 11,
    subjectScores: {
      'Matemáticas': { score: 410, gamesPlayed: 16, correctAnswers: 132, bestScore: 44 },
      'Castellano y Guaraní': { score: 460, gamesPlayed: 17, correctAnswers: 142, bestScore: 46 },
      'Historia y Geografía': { score: 290, gamesPlayed: 10, correctAnswers: 82, bestScore: 34 },
      'Legislación': { score: 160, gamesPlayed: 7, correctAnswers: 48, bestScore: 26 }
    }
  },
  {
    username: 'diego_herrera',
    password: 'diego123',
    name: 'Diego Herrera',
    avatar: '🧑‍💻',
    gender: 'male',
    totalPoints: 720,
    dailyPoints: 28,
    loginStreak: 2,
    subjectScores: {
      'Matemáticas': { score: 200, gamesPlayed: 9, correctAnswers: 65, bestScore: 28 },
      'Castellano y Guaraní': { score: 250, gamesPlayed: 10, correctAnswers: 72, bestScore: 29 },
      'Historia y Geografía': { score: 180, gamesPlayed: 7, correctAnswers: 52, bestScore: 26 },
      'Legislación': { score: 90, gamesPlayed: 4, correctAnswers: 25, bestScore: 23 }
    }
  },
  {
    username: 'valentina_ruiz',
    password: 'vale456',
    name: 'Valentina Ruiz',
    avatar: '👩‍🏫',
    gender: 'female',
    totalPoints: 1150,
    dailyPoints: 65,
    loginStreak: 7,
    subjectScores: {
      'Matemáticas': { score: 330, gamesPlayed: 13, correctAnswers: 108, bestScore: 38 },
      'Castellano y Guaraní': { score: 420, gamesPlayed: 15, correctAnswers: 128, bestScore: 42 },
      'Historia y Geografía': { score: 280, gamesPlayed: 9, correctAnswers: 78, bestScore: 31 },
      'Legislación': { score: 120, gamesPlayed: 6, correctAnswers: 36, bestScore: 24 }
    }
  },
  {
    username: 'ricardo_torres',
    password: 'ricardo789',
    name: 'Ricardo Torres',
    avatar: '👨‍⚖️',
    gender: 'male',
    totalPoints: 1380,
    dailyPoints: 92,
    loginStreak: 14,
    subjectScores: {
      'Matemáticas': { score: 360, gamesPlayed: 15, correctAnswers: 118, bestScore: 40 },
      'Castellano y Guaraní': { score: 340, gamesPlayed: 12, correctAnswers: 105, bestScore: 36 },
      'Historia y Geografía': { score: 380, gamesPlayed: 14, correctAnswers: 112, bestScore: 41 },
      'Legislación': { score: 300, gamesPlayed: 12, correctAnswers: 88, bestScore: 35 }
    }
  },
  {
    username: 'camila_castro',
    password: 'camila321',
    name: 'Camila Castro',
    avatar: '👩‍⚕️',
    gender: 'female',
    totalPoints: 960,
    dailyPoints: 55,
    loginStreak: 6,
    subjectScores: {
      'Matemáticas': { score: 270, gamesPlayed: 11, correctAnswers: 88, bestScore: 33 },
      'Castellano y Guaraní': { score: 310, gamesPlayed: 12, correctAnswers: 95, bestScore: 34 },
      'Historia y Geografía': { score: 250, gamesPlayed: 8, correctAnswers: 68, bestScore: 32 },
      'Legislación': { score: 130, gamesPlayed: 6, correctAnswers: 38, bestScore: 25 }
    }
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Iniciando seeder de usuarios...');

    // Crear directorio data si no existe
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('📁 Directorio data creado');
    }

    // Leer usuarios existentes o crear array vacío
    let existingUsers = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      existingUsers = JSON.parse(data);
      console.log(`📖 Usuarios existentes encontrados: ${existingUsers.length}`);
    } catch {
      console.log('📄 Creando nuevo archivo de usuarios');
    }

    // Procesar usuarios de prueba
    let addedCount = 0;
    const currentTime = new Date().toISOString();

    for (const userData of testUsers) {
      // Verificar si el usuario ya existe
      const userExists = existingUsers.some(user => 
        user.username === userData.username || user.name === userData.name
      );

      if (!userExists) {
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Crear usuario completo
        const newUser = {
          id: uuidv4(),
          username: userData.username,
          password: hashedPassword,
          name: userData.name,
          avatar: userData.avatar,
          gender: userData.gender,
          subjectScores: userData.subjectScores,
          totalPoints: userData.totalPoints,
          dailyPoints: userData.dailyPoints,
          loginStreak: userData.loginStreak,
          lastLogin: currentTime,
          hasVipAccess: false,
          canTakeGeneralExam: userData.totalPoints >= 180 && userData.loginStreak >= 3,
          created_at: currentTime,
          updated_at: currentTime
        };

        existingUsers.push(newUser);
        addedCount++;
        console.log(`✅ Usuario agregado: ${userData.name} (${userData.username})`);
      } else {
        console.log(`⏭️  Usuario ya existe: ${userData.name}`);
      }
    }

    // Guardar usuarios actualizados
    await fs.writeFile(usersFilePath, JSON.stringify(existingUsers, null, 2));

    console.log(`\n🎉 Seeder completado:`);
    console.log(`   • Usuarios agregados: ${addedCount}`);
    console.log(`   • Total de usuarios: ${existingUsers.length}`);
    console.log(`   • Archivo: ${usersFilePath}`);

    // Mostrar estadísticas de ranking
    const sortedByPoints = existingUsers.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    console.log(`\n🏆 Top 5 Ranking Global:`);
    sortedByPoints.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} - ${user.totalPoints} puntos`);
    });

    // Estadísticas por materia
    const subjects = ['Matemáticas', 'Castellano y Guaraní', 'Historia y Geografía', 'Legislación'];
    subjects.forEach(subject => {
      const subjectRanking = existingUsers
        .filter(user => user.subjectScores && user.subjectScores[subject])
        .sort((a, b) => (b.subjectScores[subject]?.score || 0) - (a.subjectScores[subject]?.score || 0))
        .slice(0, 3);
      
      if (subjectRanking.length > 0) {
        console.log(`\n📚 Top 3 en ${subject}:`);
        subjectRanking.forEach((user, index) => {
          const score = user.subjectScores[subject]?.score || 0;
          console.log(`   ${index + 1}. ${user.name} - ${score} puntos`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error en el seeder:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedUsers().then(() => {
    console.log('\n✨ Seeder finalizado exitosamente');
    process.exit(0);
  });
}

module.exports = { seedUsers };