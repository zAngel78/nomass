const fileStorage = require('./fileStorage');

class ExamPartsManager {
    constructor() {
        // Configuración específica por materia
        this.SUBJECT_CONFIG = {
            'Matemáticas': {
                questionsPerPart: 12,  // 240 preguntas ÷ 12 = 20 partes
                unlockThreshold: 0.7
            },
            'Historia y Geografía': {
                questionsPerPart: 20,  // Mantener configuración original
                unlockThreshold: 0.7
            },
            'Castellano y Guaraní': {
                questionsPerPart: 20,  // Mantener configuración original
                unlockThreshold: 0.7
            },
            'Legislación': {
                questionsPerPart: 20,  // Mantener configuración original
                unlockThreshold: 0.7
            }
        };
        
        // Configuración por defecto para materias no especificadas
        this.DEFAULT_QUESTIONS_PER_PART = 20;
        this.DEFAULT_UNLOCK_THRESHOLD = 0.7;
    }
    
    // Obtener configuración específica de una materia
    getSubjectConfig(subject) {
        return this.SUBJECT_CONFIG[subject] || {
            questionsPerPart: this.DEFAULT_QUESTIONS_PER_PART,
            unlockThreshold: this.DEFAULT_UNLOCK_THRESHOLD
        };
    }

    // Obtener progreso de un usuario en una materia específica
    async getUserProgress(userId, subject, examType) {
        try {
            const progressData = await fileStorage.readFile('user_progress');
            const userProgress = progressData.find(p => 
                p.userId === userId && 
                p.subject === subject && 
                p.examType === examType
            );
            
            if (!userProgress) {
                // Crear progreso inicial si no existe
                const initialProgress = this.createInitialProgress(userId, subject, examType);
                await this.saveUserProgress(initialProgress);
                return initialProgress;
            }
            
            return userProgress;
        } catch (error) {
            console.error('Error obteniendo progreso del usuario:', error);
            // Crear progreso inicial en caso de error
            return this.createInitialProgress(userId, subject, examType);
        }
    }

    // Crear progreso inicial para un usuario
    createInitialProgress(userId, subject, examType) {
        return {
            userId,
            subject,
            examType,
            progress: {
                parte1: { completed: false, unlocked: true, score: 0, attempts: 0, bestScore: 0 }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    // Calcular total de partes disponibles para una materia
    calculateTotalParts(totalQuestions, subject) {
        const config = this.getSubjectConfig(subject);
        return Math.ceil(totalQuestions / config.questionsPerPart);
    }

    // Obtener preguntas para una parte específica
    getQuestionsForPart(allQuestions, partNumber, subject) {
        const config = this.getSubjectConfig(subject);
        const startIndex = (partNumber - 1) * config.questionsPerPart;
        const endIndex = startIndex + config.questionsPerPart;
        return allQuestions.slice(startIndex, endIndex);
    }

    // Obtener información de todas las partes disponibles
    async getPartsInfo(userId, subject, examType, totalQuestions) {
        const userProgress = await this.getUserProgress(userId, subject, examType);
        const config = this.getSubjectConfig(subject);
        const totalParts = this.calculateTotalParts(totalQuestions, subject);
        
        const partsInfo = [];
        
        for (let i = 1; i <= totalParts; i++) {
            const partKey = `parte${i}`;
            const partProgress = userProgress.progress[partKey] || {
                completed: false,
                unlocked: false,
                score: 0,
                attempts: 0,
                bestScore: 0
            };
            
            partsInfo.push({
                partNumber: i,
                partKey,
                title: `Parte ${i}`,
                questionsRange: `${((i-1) * config.questionsPerPart) + 1}-${Math.min(i * config.questionsPerPart, totalQuestions)}`,
                totalQuestions: Math.min(config.questionsPerPart, totalQuestions - ((i-1) * config.questionsPerPart)),
                ...partProgress
            });
        }
        
        return partsInfo;
    }

    // Completar una parte y actualizar progreso
    async completePart(userId, subject, examType, partNumber, score, totalQuestions) {
        try {
            console.log('🔍 examPartsManager.completePart iniciado');
            console.log('🔍 Parámetros recibidos:');
            console.log('   userId:', typeof userId, `"${userId}"`);
            console.log('   subject:', typeof subject, `"${subject}"`);
            console.log('   examType:', typeof examType, `"${examType}"`);
            console.log('   partNumber:', typeof partNumber, partNumber);
            console.log('   score:', typeof score, score);
            console.log('   totalQuestions:', typeof totalQuestions, totalQuestions);
            
            // Validar que el userId no sea undefined o null
            if (!userId) {
                console.error('❌ Error: userId es requerido pero está vacío');
                throw new Error('Usuario no autenticado: userId es requerido');
            }
            
            console.log('✅ Validación de userId pasada');

            let progressData;
            try {
                console.log('🔍 Intentando leer archivo user_progress...');
                progressData = await fileStorage.readFile('user_progress');
                console.log('✅ Archivo user_progress leído correctamente, contiene:', progressData.length, 'registros');
            } catch (error) {
                console.log('⚠️ Archivo user_progress no existe, creando nuevo...');
                progressData = [];
            }
            
            let userProgressIndex = progressData.findIndex(p => 
                p.userId === userId && 
                p.subject === subject && 
                p.examType === examType
            );
            
            let userProgress;
            if (userProgressIndex === -1) {
                // Crear nuevo progreso si no existe
                userProgress = this.createInitialProgress(userId, subject, examType);
                progressData.push(userProgress);
                userProgressIndex = progressData.length - 1;
            } else {
                userProgress = progressData[userProgressIndex];
            }
            
            const partKey = `parte${partNumber}`;
            const config = this.getSubjectConfig(subject);
            const accuracy = score / totalQuestions;
            
            // Actualizar progreso de la parte actual
            if (!userProgress.progress[partKey]) {
                userProgress.progress[partKey] = {
                    completed: false,
                    unlocked: true,
                    score: 0,
                    attempts: 0,
                    bestScore: 0
                };
            }
            
            const currentPart = userProgress.progress[partKey];
            currentPart.attempts += 1;
            currentPart.score = score;
            currentPart.bestScore = Math.max(currentPart.bestScore, score);
            currentPart.completed = accuracy >= config.unlockThreshold;
            
            // Si completó con éxito, desbloquear siguiente parte
            if (currentPart.completed) {
                const nextPartKey = `parte${partNumber + 1}`;
                const totalParts = this.calculateTotalParts(totalQuestions, subject);
                
                if (partNumber < totalParts) {
                    if (!userProgress.progress[nextPartKey]) {
                        userProgress.progress[nextPartKey] = {
                            completed: false,
                            unlocked: true,
                            score: 0,
                            attempts: 0,
                            bestScore: 0
                        };
                    } else {
                        userProgress.progress[nextPartKey].unlocked = true;
                    }
                }
            }
            
            // Calcular puntos ganados
            console.log('🔍 Calculando puntos:');
            console.log('   totalQuestions (del parámetro):', totalQuestions);
            console.log('   subject:', subject);
            
            const totalParts = this.calculateTotalParts(totalQuestions, subject);
            console.log('   totalParts calculadas:', totalParts);
            
            const pointsPerPart = 20 / totalParts; // 20 puntos total dividido entre todas las partes
            console.log('   pointsPerPart:', pointsPerPart);
            let pointsEarned = 0;
            let allPartsCompleted = false;
            
            if (currentPart.completed) {
                pointsEarned = Math.round(pointsPerPart * 100) / 100; // Redondear a 2 decimales
                
                // Verificar si completó todas las partes de la materia
                const completedPartsCount = Object.values(userProgress.progress).filter(p => p.completed).length;
                allPartsCompleted = completedPartsCount === totalParts;
            }
            
            userProgress.updated_at = new Date().toISOString();
            progressData[userProgressIndex] = userProgress;
            
            await fileStorage.writeFile('user_progress', progressData);
            
            return {
                partCompleted: currentPart.completed,
                nextPartUnlocked: partNumber < totalParts && currentPart.completed,
                accuracy: Math.round(accuracy * 100),
                attempts: currentPart.attempts,
                bestScore: currentPart.bestScore,
                pointsEarned: pointsEarned,
                allPartsCompleted: allPartsCompleted,
                totalParts: totalParts,
                completedParts: Object.values(userProgress.progress).filter(p => p.completed).length
            };
            
        } catch (error) {
            console.error('Error completando parte:', error);
            throw error;
        }
    }

    // Guardar progreso del usuario
    async saveUserProgress(userProgress) {
        try {
            let progressData = await fileStorage.readFile('user_progress');
            const existingIndex = progressData.findIndex(p => 
                p.userId === userProgress.userId && 
                p.subject === userProgress.subject && 
                p.examType === userProgress.examType
            );
            
            if (existingIndex !== -1) {
                progressData[existingIndex] = userProgress;
            } else {
                progressData.push(userProgress);
            }
            
            await fileStorage.writeFile('user_progress', progressData);
        } catch (error) {
            console.error('Error guardando progreso:', error);
            // Si el archivo no existe, crear uno nuevo
            if (error.message.includes('no such file')) {
                await fileStorage.writeFile('user_progress', [userProgress]);
            } else {
                throw error;
            }
        }
    }

    // Obtener estadísticas generales de progreso
    async getProgressStats(userId) {
        try {
            const progressData = await fileStorage.readFile('user_progress');
            const userProgressList = progressData.filter(p => p.userId === userId);
            
            const stats = {
                totalSubjects: userProgressList.length,
                completedParts: 0,
                totalParts: 0,
                averageScore: 0,
                subjects: {}
            };
            
            let totalScore = 0;
            let totalAttempts = 0;
            
            for (const progress of userProgressList) {
                const subjectKey = `${progress.subject}_${progress.examType}`;
                const parts = Object.values(progress.progress);
                const completedParts = parts.filter(p => p.completed).length;
                
                stats.completedParts += completedParts;
                stats.totalParts += parts.length;
                
                const subjectAvgScore = parts.reduce((sum, p) => sum + p.bestScore, 0) / parts.length;
                totalScore += subjectAvgScore;
                totalAttempts += parts.reduce((sum, p) => sum + p.attempts, 0);
                
                stats.subjects[subjectKey] = {
                    subject: progress.subject,
                    examType: progress.examType,
                    completedParts,
                    totalParts: parts.length,
                    averageScore: Math.round(subjectAvgScore),
                    totalAttempts
                };
            }
            
            stats.averageScore = userProgressList.length > 0 ? Math.round(totalScore / userProgressList.length) : 0;
            
            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas de progreso:', error);
            return {
                totalSubjects: 0,
                completedParts: 0,
                totalParts: 0,
                averageScore: 0,
                subjects: {}
            };
        }
    }

    // Resetear progreso de un usuario en una materia específica
    async resetProgress(userId, subject, examType) {
        try {
            let progressData = await fileStorage.readFile('user_progress');
            const filteredData = progressData.filter(p => 
                !(p.userId === userId && p.subject === subject && p.examType === examType)
            );
            
            await fileStorage.writeFile('user_progress', filteredData);
            return true;
        } catch (error) {
            console.error('Error reseteando progreso:', error);
            return false;
        }
    }
}

module.exports = new ExamPartsManager();