const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// GET /api/users - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await fileStorage.readFile('users');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo usuarios',
      message: error.message
    });
  }
});

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', async (req, res) => {
  try {
    const user = await fileStorage.findInFile('users', u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo usuario',
      message: error.message
    });
  }
});

// POST /api/users - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { name, avatar, gender, email, canTakeGeneralExam, passwordOption, customPassword, username } = req.body;

    if (!name || !avatar) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: name, avatar'
      });
    }

    // Generar username si no se proporciona
    let finalUsername = username;
    if (!finalUsername) {
      // Generar username basado en el nombre (sin espacios, minúsculas)
      const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000);
      finalUsername = `${baseName}${randomSuffix}`;
    }

    // Verificar que el username no exista
    const existingUsers = await fileStorage.readFile('users');
    const usernameExists = existingUsers.some(u => u.username === finalUsername);
    
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        error: 'El username ya existe'
      });
    }

    // Generar o usar contraseña
    let plainPassword;
    let hashedPassword = null;
    
    if (passwordOption) {
      // Creación desde dashboard admin - con contraseña
      if (passwordOption === 'auto') {
        plainPassword = generateRandomPassword();
      } else if (passwordOption === 'custom') {
        if (!customPassword || customPassword.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'La contraseña personalizada debe tener al menos 6 caracteres'
          });
        }
        plainPassword = customPassword;
      } else {
        return res.status(400).json({
          success: false,
          error: 'passwordOption debe ser "auto" o "custom"'
        });
      }
      
      // Hash de la contraseña
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    } else {
      // Creación desde app Flutter - sin contraseña (sistema sin login)
      plainPassword = null;
      hashedPassword = null;
    }

    const newUser = {
      id: uuidv4(),
      username: finalUsername,
      name: name.trim(),
      email: email || '',
      avatar,
      gender: gender || 'other',
      password: hashedPassword,
      subjectScores: {},
      totalPoints: 0,
      dailyPoints: 0,
      level: 1,
      experience: 0,
      lastLogin: new Date().toISOString(),
      loginStreak: 1,
      canChooseSubject: true,
      canTakeGeneralExam: canTakeGeneralExam || false,
      dailyWheelSpins: 0,
      hasSubscription: false,
      subscriptionExpiry: null,
      achievements: [],
      badges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await fileStorage.appendToFile('users', newUser);

    // Retornar usuario con contraseña en texto plano SOLO para mostrar al admin
    const userForResponse = {
      ...newUser,
      plainPassword: plainPassword,
      displayUsername: finalUsername  // Para mostrar en el dashboard
    };
    
    // Remover el hash de la respuesta por seguridad
    delete userForResponse.password;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userForResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creando usuario',
      message: error.message
    });
  }
});

// Función auxiliar para generar contraseña aleatoria
function generateRandomPassword(length = 8) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '@#$%&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Asegurar que tenga al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// POST /api/users/login - Verificar credenciales de usuario
router.post('/login', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if ((!userId && !username) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren (userId o username) y password'
      });
    }

    const users = await fileStorage.readFile('users');
    
    // Buscar usuario por ID o por username
    let user;
    if (userId) {
      user = users.find(u => u.id === userId);
    } else if (username) {
      user = users.find(u => u.username === username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    // Actualizar último login
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const diffHours = Math.abs(now - lastLogin) / (1000 * 60 * 60);

    // Actualizar racha de login
    if (diffHours > 48) {
      user.loginStreak = 1;
      user.dailyPoints = 0;
    } else if (diffHours > 24) {
      user.loginStreak += 1;
      user.dailyPoints = 0;
    }

    user.lastLogin = now.toISOString();
    user.canTakeGeneralExam = user.loginStreak >= 4;
    user.updated_at = now.toISOString();

    // Actualizar en el archivo
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex] = user;
    await fileStorage.writeFile('users', users);

    // Retornar usuario sin contraseña
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en el login',
      message: error.message
    });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const updated = await fileStorage.updateInFile('users', req.params.id, updatedData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando usuario',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const users = await fileStorage.readFile('users');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    await fileStorage.writeFile('users', users);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando usuario',
      message: error.message
    });
  }
});

// POST /api/users/:id/quiz-result - Actualizar puntuación de usuario después de quiz
router.post('/:id/quiz-result', async (req, res) => {
  try {
    const { subject, score, correctAnswers, totalQuestions } = req.body;

    const users = await fileStorage.readFile('users');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = users[userIndex];
    
    // Actualizar puntuaciones por materia
    if (!user.subjectScores[subject]) {
      user.subjectScores[subject] = {
        score: 0,
        gamesPlayed: 0,
        correctAnswers: 0,
        bestScore: 0
      };
    }

    const subjectScore = user.subjectScores[subject];
    subjectScore.score += score;
    subjectScore.gamesPlayed += 1;
    subjectScore.correctAnswers += correctAnswers;
    subjectScore.bestScore = Math.max(subjectScore.bestScore, score);

    // Actualizar puntos totales y diarios
    user.totalPoints += score;
    user.dailyPoints += score;
    user.updated_at = new Date().toISOString();

    // Verificar si puede elegir materia y tomar examen general
    user.canChooseSubject = user.dailyPoints >= 100; // Requiere 100 puntos diarios
    user.canTakeGeneralExam = user.totalPoints >= 180 && user.loginStreak >= 3; // Requiere 180 puntos totales y 3 días de racha

    users[userIndex] = user;
    await fileStorage.writeFile('users', users);

    res.json({
      success: true,
      message: 'Puntuación actualizada exitosamente',
      data: {
        user: user,
        scoreAdded: score,
        newTotalPoints: user.totalPoints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando puntuación',
      message: error.message
    });
  }
});

// POST /api/users/:id/check-login - Verificar racha de login
router.post('/:id/check-login', async (req, res) => {
  try {
    const users = await fileStorage.readFile('users');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = users[userIndex];
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const diffHours = Math.abs(now - lastLogin) / (1000 * 60 * 60);

    // Si han pasado más de 48 horas, reiniciar racha
    if (diffHours > 48) {
      user.loginStreak = 1;
      user.dailyPoints = 0; // Reiniciar puntos diarios
    } else if (diffHours > 24) {
      // Si han pasado más de 24 horas pero menos de 48, mantener racha
      user.loginStreak += 1;
      user.dailyPoints = 0; // Reiniciar puntos diarios
    }
    // Si han pasado menos de 24 horas, no cambiar racha

    user.lastLogin = now.toISOString();
    user.canTakeGeneralExam = user.loginStreak >= 4;
    user.updated_at = now.toISOString();

    users[userIndex] = user;
    await fileStorage.writeFile('users', users);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error verificando login',
      message: error.message
    });
  }
});

module.exports = router;