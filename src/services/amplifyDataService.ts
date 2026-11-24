import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';
import { CourseModule, ErrorLogItem, QuestionItem, UserStats } from '../types';

let isAmplifyConfigured = false;
let client: ReturnType<typeof generateClient<Schema>> | null = null;

try {
  if (outputs && typeof outputs === 'object' && Object.keys(outputs).length > 0 && (outputs as any).data) {
    Amplify.configure(outputs);
    client = generateClient<Schema>();
    isAmplifyConfigured = true;
    console.log('✅ AWS Amplify Gen 2 conectado con éxito a DynamoDB.');
  }
} catch (e) {
  console.warn('Amplify outputs no disponibles aún o modo offline:', e);
}

export const amplifyDataService = {
  isConfigured(): boolean {
    return isAmplifyConfigured && client !== null;
  },

  /**
   * Sube todos los temas y preguntas a DynamoDB
   */
  async syncAllToDynamo(
    modules: CourseModule[],
    customQuestions: Record<string, QuestionItem[]>,
    stats: UserStats,
    errorLog: ErrorLogItem[]
  ): Promise<{ success: boolean; message: string }> {
    if (!client || !isAmplifyConfigured) {
      return {
        success: false,
        message: 'AWS Amplify no está configurado aún con un backend activo (falta amplify_outputs.json).',
      };
    }

    try {
      // 1. Guardar módulos en DynamoDB
      for (const mod of modules) {
        await client.models.CourseModule.create({
          moduleId: mod.id,
          title: mod.title,
          subtitle: mod.subtitle,
          description: mod.description,
          icon: mod.icon,
          badge: mod.badge,
          languageQuestion: mod.languageQuestion,
          languageAnswer: mod.languageAnswer,
          totalLessons: mod.totalLessons,
          completedLessons: mod.completedLessons,
          isCustom: Boolean(mod.isCustom),
          customTopicText: mod.customTopicText || '',
        });
      }

      // 2. Guardar preguntas
      for (const [modId, qs] of Object.entries(customQuestions)) {
        for (const q of qs) {
          await client.models.QuestionItem.create({
            questionId: q.id,
            moduleId: modId,
            prompt: q.prompt,
            context: q.context || '',
            languageToListen: q.languageToListen,
            difficulty: q.difficulty,
            expectedConcept: q.expectedConcept,
            optionsJson: JSON.stringify(q.options || []),
          });
        }
      }

      // 3. Guardar perfil de usuario
      await client.models.UserProfile.create({
        userId: 'default_user',
        streak: stats.streak,
        xp: stats.xp,
        lastActiveDate: stats.lastActiveDate,
        totalAnswered: stats.totalAnswered,
        totalCorrect: stats.totalCorrect,
        settingsJson: JSON.stringify({ syncedAt: Date.now() }),
      });

      // 4. Guardar cuaderno de errores
      for (const err of errorLog) {
        await client.models.ErrorLog.create({
          errorId: err.id,
          timestamp: new Date(err.timestamp).toISOString(),
          moduleId: err.moduleId,
          moduleTitle: err.moduleTitle,
          question: err.question,
          userAnswer: err.userAnswer,
          replicaSarcastica: err.replicaSarcastica,
          explicacionPorQue: err.explicacionPorQue,
          respuestaCorrectaModelo: err.respuestaCorrectaModelo,
          categoriaError: err.categoriaError,
          practiced: err.practiced,
        });
      }

      return {
        success: true,
        message: '¡Datos sincronizados exitosamente con AWS DynamoDB!',
      };
    } catch (err: any) {
      console.error('Error sincronizando con DynamoDB:', err);
      return {
        success: false,
        message: `Error al guardar en DynamoDB: ${err.message || 'Fallo de red'}`,
      };
    }
  },

  /**
   * Carga los temas y preguntas desde DynamoDB
   */
  async fetchFromDynamo(): Promise<{
    success: boolean;
    modules?: CourseModule[];
    customQuestions?: Record<string, QuestionItem[]>;
    message?: string;
  }> {
    if (!client || !isAmplifyConfigured) {
      return { success: false, message: 'Amplify no conectado' };
    }

    try {
      const { data: remoteModules } = await client.models.CourseModule.list();
      const { data: remoteQuestions } = await client.models.QuestionItem.list();

      const modules: CourseModule[] = (remoteModules || []).map((m: any) => ({
        id: m.moduleId,
        title: m.title,
        subtitle: m.subtitle || '',
        description: m.description || '',
        icon: m.icon || 'BookOpen',
        badge: m.badge || 'Nube',
        languageQuestion: (m.languageQuestion as any) || 'es-ES',
        languageAnswer: (m.languageAnswer as any) || 'es-ES',
        totalLessons: m.totalLessons || 8,
        completedLessons: m.completedLessons || 0,
        consecutiveErrors: 0,
        isGatekeepingActive: false,
        gatekeepingStreakRequired: 2,
        gatekeepingCurrentStreak: 0,
        isCustom: m.isCustom ?? false,
        customTopicText: m.customTopicText || '',
      }));

      const customQuestions: Record<string, QuestionItem[]> = {};
      (remoteQuestions || []).forEach((q: any) => {
        const modId = q.moduleId;
        if (!customQuestions[modId]) customQuestions[modId] = [];
        let parsedOpts = [];
        try {
          parsedOpts = typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : q.optionsJson;
        } catch {
          parsedOpts = [];
        }
        customQuestions[modId].push({
          id: q.questionId,
          moduleId: modId,
          prompt: q.prompt,
          context: q.context,
          languageToListen: q.languageToListen,
          difficulty: q.difficulty,
          expectedConcept: q.expectedConcept,
          options: parsedOpts,
        });
      });

      return { success: true, modules, customQuestions };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
