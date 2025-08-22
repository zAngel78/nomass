# Quiz Backend API

Backend Node.js para la aplicación de quiz del ejército con almacenamiento en archivos JSON.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Importar preguntas existentes
```bash
node scripts/importQuestions.js
```

### 3. Iniciar servidor
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor se ejecutará en: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
backend/
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── routes/                # Rutas de la API
│   ├── questions.js       # Endpoints de preguntas
│   ├── users.js          # Endpoints de usuarios
│   ├── ranking.js        # Endpoints de ranking
│   └── quiz.js           # Endpoints de quiz
├── utils/
│   └── fileStorage.js    # Sistema de almacenamiento en archivos
├── scripts/
│   └── importQuestions.js # Script para importar preguntas
└── data/                 # Archivos JSON de datos (se crea automáticamente)
    ├── questions.json    # Preguntas
    ├── users.json       # Usuarios
    ├── quiz_results.json # Resultados de quizzes
    └── backups/         # Respaldos automáticos
```

## 🔌 Endpoints de la API

### Sistema
- `GET /api/health` - Estado del servidor
- `GET /` - Información general de la API

### Preguntas
- `GET /api/questions` - Obtener todas las preguntas
- `GET /api/questions?subject=Castellano y Guaraní` - Filtrar por materia
- `GET /api/questions?limit=10&random=true` - Limitar y aleatorizar
- `GET /api/questions/subjects` - Obtener materias disponibles
- `GET /api/questions/:id` - Obtener pregunta específica
- `POST /api/questions` - Crear nueva pregunta
- `PUT /api/questions/:id` - Actualizar pregunta
- `DELETE /api/questions/:id` - Eliminar pregunta
- `POST /api/questions/import` - Importar preguntas masivamente

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario específico
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `POST /api/users/:id/quiz-result` - Actualizar puntuación después de quiz
- `POST /api/users/:id/check-login` - Verificar racha de login

### Ranking
- `GET /api/ranking` - Ranking global
- `GET /api/ranking?subject=Matemáticas` - Ranking por materia
- `GET /api/ranking/user/:id` - Posición de usuario específico
- `GET /api/ranking/stats` - Estadísticas generales
- `GET /api/ranking/leaderboard/:subject` - Tabla de líderes por materia

### Quiz
- `POST /api/quiz/generate` - Generar nuevo quiz
- `POST /api/quiz/submit` - Enviar resultados de quiz
- `GET /api/quiz/results/:userId` - Obtener resultados de usuario

## 📊 Ejemplos de Uso

### Generar Quiz
```bash
curl -X POST http://localhost:3000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Castellano y Guaraní",
    "questionCount": -1,
    "random": false
  }'
```

### Crear Usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "avatar": "👨",
    "gender": "male"
  }'
```

### Obtener Ranking
```bash
curl http://localhost:3000/api/ranking?limit=10
```

## 🗂️ Formato de Datos

### Pregunta
```json
{
  "id": "uuid",
  "question": "¿Cuál es la capital de Paraguay?",
  "options": {
    "a": "Asunción",
    "b": "Ciudad del Este",
    "c": "Encarnación",
    "d": "Pedro Juan Caballero"
  },
  "correct_answer": "a",
  "subject": "Historia y Geografía",
  "difficulty": 1,
  "explanation": "Asunción es la capital de Paraguay",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Usuario
```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "avatar": "👨",
  "gender": "male",
  "subjectScores": {
    "Matemáticas": {
      "score": 150,
      "gamesPlayed": 5,
      "correctAnswers": 35,
      "bestScore": 90
    }
  },
  "totalPoints": 500,
  "dailyPoints": 50,
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "loginStreak": 3,
  "canChooseSubject": true,
  "canTakeGeneralExam": false
}
```

## ⚙️ Configuración

### Variables de Entorno (Opcionales)
- `PORT` - Puerto del servidor (default: 3000)
- `NODE_ENV` - Entorno de ejecución (development/production)

### Configuración de Tiempo Límite por Materia
```javascript
// En routes/quiz.js
const timeLimits = {
  'Matemáticas': 0,              // Sin límite
  'Castellano y Guaraní': 0,     // Sin límite
  'Historia y Geografía': 30,    // 30 segundos
  'Legislación': 30              // 30 segundos
};
```

## 🔒 Características de Seguridad

- ✅ CORS habilitado
- ✅ Helmet para headers de seguridad
- ✅ Rate limiting (100 requests/15min)
- ✅ Validación de entrada
- ✅ Manejo de errores centralizado
- ✅ Logging de requests

## 📝 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor con nodemon (desarrollo)
- `node scripts/importQuestions.js` - Importar preguntas desde JSON

## 🔧 Mantenimiento

### Crear Backup Manual
Los backups se crean automáticamente antes de operaciones destructivas, pero puedes crear uno manual:

```javascript
const fileStorage = require('./utils/fileStorage');
await fileStorage.backupFile('questions');
```

### Ver Logs
Los logs se muestran en consola con timestamps y información de requests.

### Monitoreo de Salud
Visita `http://localhost:3000/api/health` para verificar el estado del servidor.

## 🐛 Solución de Problemas

1. **Error de archivo no encontrado**: Verifica que el directorio `data/` se haya creado automáticamente
2. **Error de parsing JSON**: Verifica el formato del archivo de preguntas
3. **Puerto ocupado**: Cambia el puerto con `PORT=3001 npm start`
4. **Problemas de CORS**: Verifica la configuración en `server.js`

## 📦 Dependencias

- **express**: Framework web
- **cors**: Manejo de CORS
- **helmet**: Headers de seguridad
- **express-rate-limit**: Limitación de velocidad
- **uuid**: Generación de IDs únicos
- **nodemon**: Desarrollo (auto-restart)