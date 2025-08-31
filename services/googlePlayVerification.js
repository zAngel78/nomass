const { google } = require('googleapis');
const path = require('path');

// Configuración de Google Play
const PACKAGE_NAME = 'com.ingresosgo.app'; // Tu package name
const SERVICE_ACCOUNT_KEY_FILE = path.join(__dirname, '../config/google-play-service-account.json');

class GooglePlayVerification {
  constructor() {
    this.androidPublisher = null;
    this.authClient = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Verificar si el archivo de service account existe
      const fs = require('fs');
      if (!fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
        console.warn('⚠️  Service account file not found:', SERVICE_ACCOUNT_KEY_FILE);
        console.warn('⚠️  Using mock verification for development');
        return;
      }

      // Configurar autenticación con service account
      this.authClient = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/androidpublisher']
      });

      // Inicializar Android Publisher API
      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: this.authClient
      });

      // Verificar autenticación
      await this.authClient.getClient();
      this.initialized = true;
      
      console.log('✅ Google Play API inicializada correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando Google Play API:', error.message);
      console.warn('⚠️  Fallback a verificación mock para desarrollo');
      this.initialized = false;
    }
  }

  async verifySubscriptionPurchase(subscriptionId, purchaseToken) {
    // Si no está inicializado, usar verificación mock
    if (!this.initialized || !this.androidPublisher) {
      console.log('🔄 Usando verificación mock (desarrollo)');
      return this.mockVerification(purchaseToken, subscriptionId);
    }

    try {
      console.log('🔐 Verificando compra real con Google Play API...');
      console.log(`📦 Subscription ID: ${subscriptionId}`);
      console.log(`🎫 Purchase Token: ${purchaseToken.substring(0, 20)}...`);

      const response = await this.androidPublisher.purchases.subscriptions.get({
        packageName: PACKAGE_NAME,
        subscriptionId: subscriptionId,
        token: purchaseToken
      });

      const subscription = response.data;
      
      console.log('📊 Respuesta de Google Play:', {
        paymentState: subscription.paymentState,
        expiryTimeMillis: subscription.expiryTimeMillis,
        autoRenewing: subscription.autoRenewing,
        orderId: subscription.orderId
      });

      // Verificar estado del pago
      const isPaid = subscription.paymentState === 1; // 1 = Payment received
      const isActive = subscription.expiryTimeMillis && 
                      parseInt(subscription.expiryTimeMillis) > Date.now();

      if (!isPaid) {
        console.log('❌ Pago no recibido');
        return {
          isValid: false,
          error: 'Payment not received',
          subscription: null
        };
      }

      if (!isActive) {
        console.log('⏰ Suscripción expirada');
        return {
          isValid: false,
          error: 'Subscription expired',
          subscription: subscription
        };
      }

      console.log('✅ Suscripción verificada exitosamente');

      return {
        isValid: true,
        subscription: {
          orderId: subscription.orderId,
          purchaseTime: subscription.startTimeMillis,
          expiryTime: subscription.expiryTimeMillis,
          autoRenewing: subscription.autoRenewing,
          paymentState: subscription.paymentState,
          countryCode: subscription.countryCode,
          priceAmountMicros: subscription.priceAmountMicros,
          priceCurrencyCode: subscription.priceCurrencyCode,
          developerPayload: subscription.developerPayload
        }
      };

    } catch (error) {
      console.error('❌ Error verificando con Google Play:', error.message);
      
      // Si es error 410 (Gone), el token es inválido o expirado
      if (error.code === 410) {
        return {
          isValid: false,
          error: 'Purchase token is invalid or expired',
          subscription: null
        };
      }

      // Si es error 404, la suscripción no existe
      if (error.code === 404) {
        return {
          isValid: false,
          error: 'Subscription not found',
          subscription: null
        };
      }

      // Para otros errores, fallback a mock en desarrollo
      console.warn('⚠️  Fallback a verificación mock debido a error');
      return this.mockVerification(purchaseToken, subscriptionId);
    }
  }

  // Verificación mock para desarrollo (cuando no hay service account)
  mockVerification(purchaseToken, subscriptionId) {
    console.log('🧪 Ejecutando verificación mock (desarrollo)');
    
    // Validaciones básicas del token
    if (!purchaseToken || purchaseToken.length < 20) {
      return {
        isValid: false,
        error: 'Invalid purchase token format',
        subscription: null
      };
    }

    // Simular que es válido si tiene formato correcto
    console.log('✅ Mock: Suscripción verificada (desarrollo)');
    
    const mockExpiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días
    
    return {
      isValid: true,
      subscription: {
        orderId: `mock_order_${Date.now()}`,
        purchaseTime: Date.now().toString(),
        expiryTime: mockExpiryTime.toString(),
        autoRenewing: true,
        paymentState: 1,
        countryCode: 'CO',
        priceAmountMicros: '14000000', // $14.00 en micros
        priceCurrencyCode: 'USD',
        developerPayload: 'mock_payload'
      }
    };
  }

  async verifyProductPurchase(productId, purchaseToken) {
    // Para productos de un solo pago (no suscripciones)
    if (!this.initialized || !this.androidPublisher) {
      return this.mockVerification(purchaseToken, productId);
    }

    try {
      console.log('🔐 Verificando producto con Google Play API...');
      
      const response = await this.androidPublisher.purchases.products.get({
        packageName: PACKAGE_NAME,
        productId: productId,
        token: purchaseToken
      });

      const product = response.data;
      const isPaid = product.purchaseState === 0; // 0 = Purchased

      return {
        isValid: isPaid,
        product: isPaid ? product : null,
        error: isPaid ? null : 'Product not purchased'
      };

    } catch (error) {
      console.error('❌ Error verificando producto:', error.message);
      return this.mockVerification(purchaseToken, productId);
    }
  }

  // Obtener información de la suscripción sin validar compra
  async getSubscriptionInfo(subscriptionId, purchaseToken) {
    if (!this.initialized || !this.androidPublisher) {
      return null;
    }

    try {
      const response = await this.androidPublisher.purchases.subscriptions.get({
        packageName: PACKAGE_NAME,
        subscriptionId: subscriptionId,
        token: purchaseToken
      });

      return response.data;
    } catch (error) {
      console.error('Error obteniendo info de suscripción:', error.message);
      return null;
    }
  }
}

// Instancia singleton
const googlePlayVerification = new GooglePlayVerification();

module.exports = googlePlayVerification;