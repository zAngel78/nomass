const fs = require('fs').promises;
const path = require('path');

const subscriptionsFile = path.join(__dirname, '../data/subscriptions.json');
const usersFile = path.join(__dirname, '../data/users.json');

// Verificar si un usuario tiene suscripción activa
async function checkUserPremiumStatus(userId) {
  try {
    // Leer suscripciones
    const subscriptionsData = await fs.readFile(subscriptionsFile, 'utf8');
    const subscriptions = JSON.parse(subscriptionsData);

    // Buscar suscripción activa del usuario
    const userSubscription = subscriptions
      .filter(sub => sub.userId === userId && sub.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!userSubscription) {
      return { isPremium: false, subscription: null };
    }

    const now = new Date();
    const expirationDate = new Date(userSubscription.expirationDate);
    const isActive = now < expirationDate;

    return {
      isPremium: isActive,
      subscription: userSubscription,
      daysRemaining: isActive ? Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24)) : 0
    };

  } catch (error) {
    console.error('Error verificando estado premium:', error);
    return { isPremium: false, subscription: null };
  }
}

// Middleware para verificar si el usuario es premium
function requirePremium(req, res, next) {
  // Este middleware se puede usar en rutas que requieren premium
  // Por ahora, solo registra y continúa
  console.log('🔐 Verificación premium requerida para:', req.path);
  next();
}

// Actualizar estado premium en el archivo de usuarios
async function updateUserPremiumStatus(userId, isPremium, expirationDate = null) {
  try {
    const usersData = await fs.readFile(usersFile, 'utf8');
    const users = JSON.parse(usersData);

    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].isPremium = isPremium;
      users[userIndex].subscriptionExpiry = expirationDate;
      users[userIndex].updatedAt = new Date().toISOString();

      await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error actualizando estado premium del usuario:', error);
    return false;
  }
}

// Limpiar suscripciones expiradas (tarea de mantenimiento)
async function cleanupExpiredSubscriptions() {
  try {
    const subscriptionsData = await fs.readFile(subscriptionsFile, 'utf8');
    const subscriptions = JSON.parse(subscriptionsData);
    const now = new Date();

    let updated = false;
    const updatedSubscriptions = subscriptions.map(sub => {
      if (sub.status === 'active' && new Date(sub.expirationDate) < now) {
        console.log(`⏰ Expirando suscripción: ${sub.id} para usuario: ${sub.userId}`);
        updated = true;
        return {
          ...sub,
          status: 'expired',
          updatedAt: new Date().toISOString()
        };
      }
      return sub;
    });

    if (updated) {
      await fs.writeFile(subscriptionsFile, JSON.stringify(updatedSubscriptions, null, 2));
      
      // Actualizar usuarios con suscripciones expiradas
      const usersData = await fs.readFile(usersFile, 'utf8');
      const users = JSON.parse(usersData);
      
      for (const user of users) {
        if (user.isPremium) {
          const status = await checkUserPremiumStatus(user.id);
          if (!status.isPremium) {
            await updateUserPremiumStatus(user.id, false, null);
          }
        }
      }
    }

    return updated;
  } catch (error) {
    console.error('Error limpiando suscripciones expiradas:', error);
    return false;
  }
}

// Obtener estadísticas rápidas de suscripciones
async function getSubscriptionStats() {
  try {
    const subscriptionsData = await fs.readFile(subscriptionsFile, 'utf8');
    const subscriptions = JSON.parse(subscriptionsData);
    const now = new Date();

    const active = subscriptions.filter(sub => 
      sub.status === 'active' && new Date(sub.expirationDate) > now
    );
    
    const expired = subscriptions.filter(sub => 
      sub.status === 'active' && new Date(sub.expirationDate) <= now
    );

    return {
      total: subscriptions.length,
      active: active.length,
      expired: expired.length,
      cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { total: 0, active: 0, expired: 0, cancelled: 0 };
  }
}

module.exports = {
  checkUserPremiumStatus,
  requirePremium,
  updateUserPremiumStatus,
  cleanupExpiredSubscriptions,
  getSubscriptionStats
};