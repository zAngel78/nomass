const fileStorage = require('./fileStorage');

class ExamPartsManager {
    constructor() {
        this.QUESTIONS_PER_PART = 20;
        this.UNLOCK_THRESHOLD = 0.7; // 70% para desbloquear siguiente parte
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
    calculateTotalParts(totalQuestions) {
        return Math.ceil(totalQuestions / this.QUESTIONS_PER_PART);
    }

    // Obtener preguntas para una parte específica
    getQuestionsForPart(allQuestions, partNumber) {
        const startIndex = (partNumber - 1) * this.QUESTIONS_PER_PART;
        const endIndex = startIndex + this.QUESTIONS_PER_PART;
        return allQuestions.slice(startIndex, endIndex);
    }

    // Obtener información de todas las partes disponibles
    async getPartsInfo(userId, subject, examType, totalQuestions) {
        const userProgress = await this.getUserProgress(userId, subject, examType);
        const totalParts = this.calculateTotalParts(totalQuestions);
        
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
                questionsRange: `${((i-1) * this.QUESTIONS_PER_PART) + 1}-${Math.min(i * this.QUESTIONS_PER_PART, totalQuestions)}`,
                totalQuestions: Math.min(this.QUESTIONS_PER_PART, totalQuestions - ((i-1) * this.QUESTIONS_PER_PART)),
                ...partProgress
            });
        }
        
        return partsInfo;
    }

    // Completar una parte y actualizar progreso
    async completePart(userId, subject, examType, partNumber, score, totalQuestions) {
        try {
            let progressData = await fileStorage.readFile('user_progress');
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
            currentPart.completed = accuracy >= this.UNLOCK_THRESHOLD;
            
            // Si completó con éxito, desbloquear siguiente parte
            if (currentPart.completed) {
                const nextPartKey = `parte${partNumber + 1}`;
                const totalParts = this.calculateTotalParts(totalQuestions);
                
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
            
            userProgress.updated_at = new Date().toISOString();
            progressData[userProgressIndex] = userProgress;
            
            await fileStorage.writeFile('user_progress', progressData);
            
            return {
                partCompleted: currentPart.completed,
                nextPartUnlocked: partNumber < this.calculateTotalParts(totalQuestions) && currentPart.completed,
                accuracy: Math.round(accuracy * 100),
                attempts: currentPart.attempts,
                bestScore: currentPart.bestScore
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