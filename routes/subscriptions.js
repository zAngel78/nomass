const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { 
  checkUserPremiumStatus, 
  updateUserPremiumStatus,
  cleanupExpiredSubscriptions 
} = require('../utils/subscriptionUtils');
const googlePlayVerification = require('../services/googlePlayVerification');

// Archivo donde se almacenan las suscripciones
const subscriptionsFile = path.join(__dirname, '../data/subscriptions.json');

// Función para leer suscripciones
async function readSubscriptions() {
  try {
    const data = await fs.readFile(subscriptionsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, retorna array vacío
    return [];
  }
}

// Función para escribir suscripciones
async function writeSubscriptions(subscriptions) {
  try {
    await fs.writeFile(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
    return true;
  } catch (error) {
    console.error('Error escribiendo suscripciones:', error);
    return false;
  }
}

// Función para leer usuarios
async function readUsers() {
  try {
    const data = await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Función para escribir usuarios
async function writeUsers(users) {
  try {
    await fs.writeFile(path.join(__dirname, '../data/users.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error escribiendo usuarios:', error);
    return false;
  }
}

// POST /api/subscriptions/verify - Verificar compra de Google Play
router.post('/verify', async (req, res) => {
  try {
    const { userId, purchaseToken, productId, platform } = req.body;

    if (!userId || !purchaseToken || !productId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        required: ['userId', 'purchaseToken', 'productId']
      });
    }

    console.log(`🔐 Verificando compra para usuario: ${userId}`);
    console.log(`📦 Producto: ${productId}`);
    console.log(`🏪 Plataforma: ${platform}`);

    // Verificación REAL con Google Play API
    const verificationResult = await googlePlayVerification.verifySubscriptionPurchase(productId, purchaseToken);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        error: 'Compra inválida o no verificada',
        details: verificationResult.error
      });
    }

    // Usar fechas de Google Play si están disponibles, sino calcular
    const startDate = verificationResult.subscription?.purchaseTime 
      ? new Date(parseInt(verificationResult.subscription.purchaseTime))
      : new Date();
      
    const expirationDate = verificationResult.subscription?.expiryTime
      ? new Date(parseInt(verificationResult.subscription.expiryTime))
      : (() => {
          const date = new Date();
          if (productId === 'premium_monthly') {
            date.setMonth(date.getMonth() + 1);
          } else if (productId === 'premium_yearly') {
            date.setFullYear(date.getFullYear() + 1);
          }
          return date;
        })();

    // Crear registro de suscripción
    const subscription = {
      id: uuidv4(),
      userId,
      productId,
      purchaseToken,
      platform: platform || 'android',
      status: 'active',
      startDate: startDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar suscripción
    const subscriptions = await readSubscriptions();
    
    // Cancelar suscripciones anteriores del mismo usuario
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.userId === userId ? { ...sub, status: 'cancelled', updatedAt: new Date().toISOString() } : sub
    );
    
    updatedSubscriptions.push(subscription);
    await writeSubscriptions(updatedSubscriptions);

    // Actualizar usuario con información de suscripción
    await updateUserPremiumStatus(userId, true, expirationDate.toISOString());

    console.log(`✅ Suscripción verificada para usuario: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Suscripción verificada y activada',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        expirationDate: subscription.expirationDate,
        productId: subscription.productId
      }
    });

  } catch (error) {
    console.error('Error verificando suscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo verificar la suscripción'
    });
  }
});

// GET /api/subscriptions/user/:userId - Obtener suscripción de usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuario requerido'
      });
    }

    // Limpiar suscripciones expiradas antes de verificar
    await cleanupExpiredSubscriptions();

    const status = await checkUserPremiumStatus(userId);

    res.status(200).json({
      hasSubscription: !!status.subscription,
      isPremium: status.isPremium,
      subscription: status.subscription ? {
        id: status.subscription.id,
        productId: status.subscription.productId,
        status: status.subscription.status,
        startDate: status.subscription.startDate,
        expirationDate: status.subscription.expirationDate,
        daysRemaining: status.daysRemaining || 0
      } : null
    });

  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/subscriptions/cancel - Cancelar suscripción
router.post('/cancel', async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuario requerido'
      });
    }

    const subscriptions = await readSubscriptions();
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.userId === userId && sub.status === 'active' 
        ? { 
            ...sub, 
            status: 'cancelled', 
            cancelledAt: new Date().toISOString(),
            cancelReason: reason || 'Usuario solicitó cancelación',
            updatedAt: new Date().toISOString()
          } 
        : sub
    );

    await writeSubscriptions(updatedSubscriptions);

    // Actualizar usuario
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].isPremium = false;
      users[userIndex].updatedAt = new Date().toISOString();
      await writeUsers(users);
    }

    console.log(`❌ Suscripción cancelada para usuario: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/subscriptions/stats - Estadísticas de suscripciones (Admin)
router.get('/stats', async (req, res) => {
  try {
    const subscriptions = await readSubscriptions();
    const users = await readUsers();

    const activeSubscriptions = subscriptions.filter(sub => {
      const now = new Date();
      const expirationDate = new Date(sub.expirationDate);
      return sub.status === 'active' && now < expirationDate;
    });

    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      cancelledSubscriptions: subscriptions.filter(sub => sub.status === 'cancelled').length,
      totalUsers: users.length,
      premiumUsers: users.filter(u => u.isPremium).length,
      subscriptionRate: users.length > 0 ? (activeSubscriptions.length / users.length * 100).toFixed(2) : 0,
      productBreakdown: {
        monthly: subscriptions.filter(sub => sub.productId === 'premium_monthly').length,
        yearly: subscriptions.filter(sub => sub.productId === 'premium_yearly').length
      },
      recentSubscriptions: subscriptions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(sub => ({
          id: sub.id,
          userId: sub.userId,
          productId: sub.productId,
          status: sub.status,
          createdAt: sub.createdAt
        }))
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Inicializar verificación de Google Play al cargar el módulo
googlePlayVerification.initialize();

module.exports = router;