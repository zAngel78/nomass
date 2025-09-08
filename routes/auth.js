const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const fileStorage = require('../utils/fileStorage');

const router = express.Router();

// POST /api/auth/register - Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, avatar, gender } = req.body;

    // Validaciones básicas
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: username, password, name'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 4 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const users = await fileStorage.readFile('users');
    const existingUser = users.find(u => u.username === username);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo usuario
    const newUser = {
      id: uuidv4(),
      username: username.trim(),
      password: await bcrypt.hash(password, 10), // Hash de la contraseña
      name: name.trim(),
      avatar: avatar || '👤',
      gender: gender || 'other',
      subjectScores: {},
      totalPoints: 0,
      dailyPoints: 0,
      lastLogin: new Date().toISOString(),
      loginStreak: 1,
      canChooseSubject: true, // Sin restricciones
      canTakeGeneralExam: false,
      hasVipAccess: false, // Los usuarios normales no tienen acceso VIP
      achievements: [],
      badges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await fileStorage.appendToFile('users', newUser);

    // Retornar usuario sin contraseña
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error registrando usuario',
      message: error.message
    });
  }
});

// POST /api/auth/login - Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: username, password'
      });
    }

    // Buscar usuario
    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }
    
    // Verificar contraseña con bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }

    // Actualizar último login
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const diffHours = Math.abs(now - lastLogin) / (1000 * 60 * 60);

    // Calcular racha de login
    if (diffHours > 48) {
      user.loginStreak = 1;
      user.dailyPoints = 0; // Reiniciar puntos diarios
    } else if (diffHours > 24) {
      user.loginStreak += 1;
      user.dailyPoints = 0; // Reiniciar puntos diarios
    }

    user.lastLogin = now.toISOString();
    user.canChooseSubject = user.dailyPoints >= 100; // Requiere 100 puntos diarios
    // Usuarios VIP tienen acceso sin requisitos, otros necesitan 180 puntos y 3 días de racha
    user.canTakeGeneralExam = user.hasVipAccess || (user.totalPoints >= 180 && user.loginStreak >= 3);
    user.updated_at = now.toISOString();

    // Actualizar usuario en archivo
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    await fileStorage.writeFile('users', users);

    // Retornar usuario sin contraseña
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en login',
      message: error.message
    });
  }
});

// POST /api/auth/check - Verificar si un usuario existe
router.post('/check', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el nombre de usuario'
      });
    }

    const users = await fileStorage.readFile('users');
    const userExists = users.some(u => u.username === username);

    res.json({
      success: true,
      exists: userExists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error verificando usuario',
      message: error.message
    });
  }
});

// GET /api/auth/me/:id - Obtener datos del usuario actual
router.get('/me/:id', async (req, res) => {
  try {
    const users = await fileStorage.readFile('users');
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Retornar usuario sin contraseña
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo usuario',
      message: error.message
    });
  }
});

// PUT /api/auth/change-password/:id - Cambiar contraseña
router.put('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren las contraseñas actual y nueva'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 4 caracteres'
      });
    }

    const users = await fileStorage.readFile('users');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = users[userIndex];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña con hash
    user.password = await bcrypt.hash(newPassword, 10);
    user.updated_at = new Date().toISOString();

    users[userIndex] = user;
    await fileStorage.writeFile('users', users);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error cambiando contraseña',
      message: error.message
    });
  }
});

module.exports = router;