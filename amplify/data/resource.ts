import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below defines the DynamoDB data models for MigoLab on AWS Amplify.
- CourseModule: Courses/topics created or modified by user
- QuestionItem: Interactive questions and multiple-choice options
- UserProfile: User settings, API keys (scoped to owner), stats
- ErrorLog: Error remediation notebook
=========================================================================*/
const schema = a.schema({
  CourseModule: a
    .model({
      moduleId: a.string().required(),
      title: a.string().required(),
      subtitle: a.string(),
      description: a.string(),
      icon: a.string(),
      badge: a.string(),
      languageQuestion: a.string(),
      languageAnswer: a.string(),
      totalLessons: a.integer(),
      completedLessons: a.integer(),
      isCustom: a.boolean(),
      customTopicText: a.string(),
    })
    .authorization((allow) => [allow.authenticated(), allow.guest()]),

  QuestionItem: a
    .model({
      questionId: a.string().required(),
      moduleId: a.string().required(),
      prompt: a.string().required(),
      context: a.string(),
      languageToListen: a.string(),
      difficulty: a.string(),
      expectedConcept: a.string().required(),
      optionsJson: a.json(), // Serialized MultipleChoiceOption[]
    })
    .authorization((allow) => [allow.authenticated(), allow.guest()]),

  UserProfile: a
    .model({
      userId: a.string().required(),
      streak: a.integer(),
      xp: a.integer(),
      lastActiveDate: a.string(),
      totalAnswered: a.integer(),
      totalCorrect: a.integer(),
      // Settings and encrypted API keys
      settingsJson: a.json(),
    })
    .authorization((allow) => [allow.authenticated(), allow.guest()]),

  ErrorLog: a
    .model({
      errorId: a.string().required(),
      timestamp: a.datetime().required(),
      moduleId: a.string().required(),
      moduleTitle: a.string(),
      question: a.string().required(),
      userAnswer: a.string().required(),
      replicaSarcastica: a.string(),
      explicacionPorQue: a.string(),
      respuestaCorrectaModelo: a.string(),
      categoriaError: a.string(),
      practiced: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated(), allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    // API Key is valid for 30 days by default in Amplify sandbox
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
