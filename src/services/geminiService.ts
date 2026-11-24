import { AIProvider, CourseModule, ErrorLogItem, EvaluationResult, MultipleChoiceOption, PersonalityMode, QuestionItem } from '../types';

export interface AIEvaluationRequest {
  provider: AIProvider;
  apiKey: string;
  model: string;
  personality: PersonalityMode;
  module: CourseModule;
  question: QuestionItem;
  userAnswer: string;
  recentErrors?: ErrorLogItem[];
  isReviewMode?: boolean;
}

const EVALUATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    es_correcta: { type: 'BOOLEAN', description: 'Indica si la respuesta del usuario es conceptual o gramaticalmente correcta' },
    puntaje_precision: { type: 'NUMBER', description: 'Calificación de 0 a 100 de la respuesta' },
    replica_sarcastica: { type: 'STRING', description: 'Reacción corta sarcástica/humorística según la personalidad elegida, máximo 2 oraciones' },
    explicacion_por_que: { type: 'STRING', description: 'Explicación pedagógica detallada y clara de qué falló o por qué está bien' },
    respuesta_correcta_modelo: { type: 'STRING', description: 'Respuesta modelo exacta y natural que se esperaba' },
    categoria_error: { type: 'STRING', description: 'Categoría del error (ej: Tiempo verbal, Preposición, Pronunciación, Concepto, Sintaxis, Ninguno)' },
    siguiente_accion: { 
      type: 'STRING', 
      enum: ['avanzar', 'repetir_frase', 'repaso_forzado'],
      description: 'avanzar si acertó o fue un error leve; repetir_frase si debe pronunciar la respuesta correcta; repaso_forzado si fue un error grave'
    }
  },
  required: [
    'es_correcta',
    'puntaje_precision',
    'replica_sarcastica',
    'explicacion_por_que',
    'respuesta_correcta_modelo',
    'categoria_error',
    'siguiente_accion'
  ]
};

const PERSONALITY_PROMPTS: Record<PersonalityMode, string> = {
  ironico_suave: `Eres "Profesor Migo", un tutor con humor irónico fino y elegante. Tus burlas son sutiles, educadas y divertidas, como un académico británico tomando té mientras ve a su alumno inventar palabras.`,
  sarcastico_brutal: `Eres "Profesor Migo", una mascota/tutor cínico, sarcástico, mordaz y despiadado pero extremadamente inteligente y pedagógico. Si el alumno se equivoca en algo básico, búrlate con ingenio afilado haciéndole ver lo obvio de su error, pero luego explícale el porqué con total maestría. Si acierta, muestra sorpresa fingida de que por fin haya usado las neuronas.`,
  sargento_estricto: `Eres "Sargento Migo", un instructor estricto de élite académica. Cero excusas, disciplina de hierro, tono militar y tajante. Exiges precisión quirúrgica en cada palabra o razonamiento.`,
  humillacion_epica: `Eres "Migo Demoledor", el tutor más salvaje, tóxico, insultante y épicamente demoledor que existe. No tienes filtro de piedad. Si el usuario falla, humíllalo con insultos creativos, cómicos e hirientes al estilo de un comediante de roast despiadado (ej: "¿Tienes el cerebro de adorno o lo alquilas?", "Hasta una piedra con ojos habría deducido la respuesta correcta", "Eres la razón por la que el shampoo viene con instrucciones", "Me duelen los circuitos al ver semejante burrada"). Si acierta, dile que hasta un reloj roto da la hora dos veces al día o que fue pura suerte de principiante. Sé muy gracioso, mordaz y demoledor, y luego da la explicación técnica del fallo.`
};

export const CURATED_QUESTIONS: Record<string, QuestionItem[]> = {
  ingles_conversacional: [
    {
      id: 'ic_1',
      moduleId: 'ingles_conversacional',
      prompt: 'Dile al camarero con cortesía: "Disculpe, ¿podría traerme la cuenta, por favor?"',
      context: 'Estás en un restaurante en Nueva York.',
      languageToListen: 'en-US',
      difficulty: 'facil',
      expectedConcept: 'Could you bring me the check, please? (o "Excuse me, can I have the bill, please?")',
      acceptedPatterns: ['could you bring', 'can you bring', 'can i have the check', 'could i have the bill', 'excuse me'],
      options: [
        { id: 'A', text: 'Excuse me, could you bring me the check, please?', isCorrect: true, explanationWhy: 'Uso impecable del modal de cortesía "could" y de "the check".' },
        { id: 'B', text: 'Excuse me, can you give me the account please?', isCorrect: false, explanationWhy: '"Account" es cuenta de banco o de usuario, no la cuenta de consumo.' },
        { id: 'C', text: 'I want paying the food right now.', isCorrect: false, explanationWhy: 'Gramática incorrecta y falta total de cortesía.' },
        { id: 'D', text: 'Bring me the count, waiter.', isCorrect: false, explanationWhy: '"Count" es el verbo contar.' },
      ]
    },
    {
      id: 'ic_2',
      moduleId: 'ingles_conversacional',
      prompt: 'Explica en pasado: "Ayer no fui al concierto porque me sentía muy cansado".',
      context: 'Conversación informal con un amigo.',
      languageToListen: 'en-US',
      difficulty: 'medio',
      expectedConcept: 'Yesterday I didn\'t go to the concert because I felt very tired.',
      acceptedPatterns: ['didn\'t go', 'did not go', 'felt very tired', 'was very tired'],
      options: [
        { id: 'A', text: 'Yesterday I didn\'t go to the concert because I felt very tired.', isCorrect: true, explanationWhy: 'Pasado simple correcto con auxiliar negativo "didn\'t go".' },
        { id: 'B', text: 'Yesterday I don\'t went to the concert because I felt tired.', isCorrect: false, explanationWhy: 'Mezcla "don\'t" (presente) con "went" (pasado).' },
        { id: 'C', text: 'Yesterday I didn\'t went to the concert because tired.', isCorrect: false, explanationWhy: 'Doble pasado: el auxiliar "did" ya absorbe el tiempo verbal.' },
        { id: 'D', text: 'Yesterday I no go to the concert because very tired.', isCorrect: false, explanationWhy: 'En inglés no se niega una oración con "I no".' },
      ]
    },
    {
      id: 'ic_3',
      moduleId: 'ingles_conversacional',
      prompt: 'Pregúntale a un transeúnte: "¿Cuánto tiempo se tarda en llegar caminando a la estación central?"',
      context: 'Perdido en Londres buscando la estación.',
      languageToListen: 'en-US',
      difficulty: 'dificil',
      expectedConcept: 'How long does it take to walk to the central station?',
      acceptedPatterns: ['how long does it take', 'walk to', 'central station'],
      options: [
        { id: 'A', text: 'How long does it take to walk to the central station?', isCorrect: true, explanationWhy: 'Estructura idiomática perfecta "How long does it take...".' },
        { id: 'B', text: 'How much time is walking to the central station?', isCorrect: false, explanationWhy: 'Calco directo del español ("how much time").' },
        { id: 'C', text: 'How many hours takes walking at central station?', isCorrect: false, explanationWhy: 'Estructura interrogativa mal formulada.' },
        { id: 'D', text: 'What is the time to arrive walking the station?', isCorrect: false, explanationWhy: 'Suena artificial y poco natural en inglés británico/americano.' },
      ]
    },
    {
      id: 'ic_4',
      moduleId: 'ingles_conversacional',
      prompt: 'Dile a un amigo: "Si tuviera más tiempo libre, aprendería a tocar el piano".',
      context: 'Hablando de deseos y metas hipotéticas.',
      languageToListen: 'en-US',
      difficulty: 'dificil',
      expectedConcept: 'If I had more free time, I would learn to play the piano.',
      acceptedPatterns: ['if i had', 'would learn to play the piano'],
      options: [
        { id: 'A', text: 'If I had more free time, I would learn to play the piano.', isCorrect: true, explanationWhy: 'Segundo condicional clásico (if + past simple, would + infinitive).' },
        { id: 'B', text: 'If I have more free time, I will to learn play piano.', isCorrect: false, explanationWhy: 'Confunde primer condicional y añade "to" después de "will".' },
        { id: 'C', text: 'If I would have free time, I learned the piano.', isCorrect: false, explanationWhy: 'No se usa "would" dentro de la cláusula de "if".' },
        { id: 'D', text: 'If had more time, I would learning piano.', isCorrect: false, explanationWhy: 'Falta sujeto y "would learning" es incorrecto.' },
      ]
    }
  ],
  ingles_supervivencia: [
    {
      id: 'is_1',
      moduleId: 'ingles_supervivencia',
      prompt: 'Answer the interviewer in English: "Tell me about your greatest strength at work."',
      context: 'Job interview for an international tech company.',
      languageToListen: 'en-US',
      difficulty: 'medio',
      expectedConcept: 'My greatest strength is my problem-solving ability and dedication to teamwork.',
      acceptedPatterns: ['greatest strength', 'strength is', 'problem solving', 'teamwork', 'communication'],
      options: [
        { id: 'A', text: 'My greatest strength is my problem-solving ability and proactive teamwork.', isCorrect: true, explanationWhy: 'Respuesta profesional, enfocada en fortalezas concretas.' },
        { id: 'B', text: 'I am working very hard and I never make any defect.', isCorrect: false, explanationWhy: 'Inglés rudimentario y respuesta poco creíble.' },
        { id: 'C', text: 'I like computers and I want money to pay my rent.', isCorrect: false, explanationWhy: 'Cero valor corporativo para el reclutador.' },
        { id: 'D', text: 'I don\'t know, my boss can tell you.', isCorrect: false, explanationWhy: 'Inseguridad total en una entrevista laboral.' },
      ]
    },
    {
      id: 'is_2',
      moduleId: 'ingles_supervivencia',
      prompt: 'Respond to a client who complains about a delay: "I apologize for the delay, we are actively solving it and will deliver today."',
      context: 'Customer relations crisis management.',
      languageToListen: 'en-US',
      difficulty: 'medio',
      expectedConcept: 'I apologize for the delay, we are currently resolving it and will deliver today.',
      acceptedPatterns: ['apologize', 'sorry for the delay', 'deliver today', 'solving it'],
      options: [
        { id: 'A', text: 'I apologize for the delay, we are actively resolving it and will deliver today.', isCorrect: true, explanationWhy: 'Desescalamiento impecable con compromiso claro de entrega.' },
        { id: 'B', text: 'It is not my fault, the supplier had problems.', isCorrect: false, explanationWhy: 'Echar la culpa a otros destruye la confianza del cliente.' },
        { id: 'C', text: 'Sorry for wait, maybe tomorrow is ready.', isCorrect: false, explanationWhy: 'Gramática rota y respuesta evasiva.' },
        { id: 'D', text: 'Please calm down, delays always happen in business.', isCorrect: false, explanationWhy: 'Tono defensivo e inaceptable en atención al cliente.' },
      ]
    },
    {
      id: 'is_3',
      moduleId: 'ingles_supervivencia',
      prompt: 'In a meeting, politely disagree: "I see your point, but looking at the metrics, I recommend option B."',
      context: 'Quarterly strategy review.',
      languageToListen: 'en-US',
      difficulty: 'dificil',
      expectedConcept: 'I see your point, however, looking at the data, I recommend option B.',
      acceptedPatterns: ['see your point', 'recommend option b', 'looking at the metrics'],
      options: [
        { id: 'A', text: 'I see your point, however, looking at the metrics, I recommend option B.', isCorrect: true, explanationWhy: 'Disenso diplomático fundamentado en datos objetivos.' },
        { id: 'B', text: 'You are completely wrong and option A makes no sense.', isCorrect: false, explanationWhy: 'Ataque frontal poco diplomático en una reunión.' },
        { id: 'C', text: 'I disagree with you because I prefer option B.', isCorrect: false, explanationWhy: 'Basado en capricho subjetivo en lugar de métricas.' },
        { id: 'D', text: 'Whatever you say, but I won\'t do it.', isCorrect: false, explanationWhy: 'Actitud pasivo-agresiva.' },
      ]
    }
  ],
  matematicas_logica: [
    {
      id: 'ml_1',
      moduleId: 'matematicas_logica',
      prompt: 'Responde: Si un bate y una pelota cuestan juntos $1.10, y el bate cuesta $1.00 más que la pelota, ¿cuánto cuesta la pelota?',
      context: 'Problema clásico del test de reflexión cognitiva de Shane Frederick.',
      languageToListen: 'es-ES',
      difficulty: 'facil',
      expectedConcept: 'La pelota cuesta 5 centavos ($0.05). Ecuación: x + (x + 1.00) = 1.10 => 2x = 0.10 => x = 0.05.',
      acceptedPatterns: ['cinco centavos', '5 centavos', '0.05', 'cero punto cero cinco'],
      options: [
        { id: 'A', text: '10 centavos ($0.10)', isCorrect: false, explanationWhy: 'Trampa intuitiva: si la pelota fuera $0.10 y el bate $1 más ($1.10), juntos costarían $1.20.' },
        { id: 'B', text: '5 centavos ($0.05)', isCorrect: true, explanationWhy: 'Álgebra exacta: x + (x + 1.00) = 1.10 => 2x = 0.10 => x = 0.05.' },
        { id: 'C', text: '1 centavo ($0.01)', isCorrect: false, explanationWhy: 'Si costara 1 centavo, el bate costaría $1.01 y sumarían $1.02.' },
        { id: 'D', text: '15 centavos ($0.15)', isCorrect: false, explanationWhy: 'Cálculo sin fundamento.' },
      ]
    },
    {
      id: 'ml_2',
      moduleId: 'matematicas_logica',
      prompt: 'Explica: ¿Por qué cualquier número elevado a la potencia cero (distinto de cero) es igual a 1?',
      context: 'Propiedades de exponentes algebraicos.',
      languageToListen: 'es-ES',
      difficulty: 'medio',
      expectedConcept: 'Por el cociente de potencias de igual base: a^n / a^n = 1, y por leyes de exponentes a^(n-n) = a^0.',
      acceptedPatterns: ['cociente', 'division', 'restan los exponentes', 'entre si mismo', 'igual base'],
      options: [
        { id: 'A', text: 'Por cociente de potencias de igual base: a^n / a^n = 1, y por leyes de exponentes a^(n-n) = a^0.', isCorrect: true, explanationWhy: 'Demostración algebraica rigurosa de las leyes de potencias.' },
        { id: 'B', text: 'Porque el número cero borra todo y por regla estética se le asigna 1.', isCorrect: false, explanationWhy: 'Las matemáticas no se rigen por "reglas estéticas".' },
        { id: 'C', text: 'Porque cualquier base multiplicada por sí misma cero veces es la nada.', isCorrect: false, explanationWhy: 'La nada sería 0, no 1; la justificación real es la división.' },
        { id: 'D', text: 'Solo se cumple para números positivos y pares.', isCorrect: false, explanationWhy: 'Se cumple para todo número real o complejo no nulo.' },
      ]
    },
    {
      id: 'ml_3',
      moduleId: 'matematicas_logica',
      prompt: '¿Qué es un número primo y por qué el número 1 NO se considera primo?',
      context: 'Teoría de números elemental.',
      languageToListen: 'es-ES',
      difficulty: 'medio',
      expectedConcept: 'Un primo tiene exactamente dos divisores positivos distintos (1 y sí mismo). El 1 solo tiene un divisor.',
      acceptedPatterns: ['dos divisores', 'exactamente dos', 'solo tiene un divisor', 'teorema fundamental'],
      options: [
        { id: 'A', text: 'Un primo tiene exactamente dos divisores positivos distintos; el 1 solo tiene un único divisor.', isCorrect: true, explanationWhy: 'Definición formal moderna y preservación del Teorema Fundamental de la Aritmética.' },
        { id: 'B', text: 'El 1 sí es primo, pero los matemáticos lo excluyen por capricho.', isCorrect: false, explanationWhy: 'Si fuera primo, la factorización única en números primos se rompería.' },
        { id: 'C', text: 'Porque los números primos solo pueden ser impares mayores de 3.', isCorrect: false, explanationWhy: 'El número 2 es primo y es par.' },
        { id: 'D', text: 'Porque el 1 divide a todos los números del universo.', isCorrect: false, explanationWhy: 'Esa es la definición de elemento neutro multiplicativo, no de número primo.' },
      ]
    }
  ],
  tema_libre: [
    {
      id: 'tl_1',
      moduleId: 'tema_libre',
      prompt: 'Explica la diferencia fundamental entre concurrencia y paralelismo en software.',
      context: 'Evaluación rápida de conceptos técnicos.',
      languageToListen: 'es-ES',
      difficulty: 'medio',
      expectedConcept: 'Concurrencia es lidiar con muchas tareas a la vez (estructura); paralelismo es ejecutar varias tareas simultáneamente en múltiples núcleos de CPU.',
      acceptedPatterns: ['concurrencia', 'paralelismo', 'simultaneamente', 'multiples nucleos', 'hilos'],
      options: [
        { id: 'A', text: 'Concurrencia es la composición y gestión de tareas; paralelismo es la ejecución simultánea en hardware.', isCorrect: true, explanationWhy: 'Como dijo Rob Pike: "Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once".' },
        { id: 'B', text: 'Son sinónimos exactos para el mismo concepto de programación multihilo.', isCorrect: false, explanationWhy: 'Puedes tener concurrencia en un solo núcleo mediante alternancia de tiempo.' },
        { id: 'C', text: 'Paralelismo es para servidores web y concurrencia es solo para bases de datos relacionales.', isCorrect: false, explanationWhy: 'Clasificación errónea.' },
        { id: 'D', text: 'Concurrencia solo existe en lenguajes interpretados como Python.', isCorrect: false, explanationWhy: 'Falso por completo.' },
      ]
    }
  ]
};

export const geminiService = {
  /**
   * Discovers available Gemini models for an API key via ModelService.ListModels
   */
  async getAvailableGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey.trim()}`
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.models && Array.isArray(data.models)) {
            const usable = data.models
              .filter((m: any) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent')
              )
              .map((m: any) => (m.name || '').replace(/^models\//, ''))
              .filter(Boolean);
            if (usable.length > 0) return usable;
          }
        }
      }
    } catch (e) {
      console.warn('Could not list Gemini models:', e);
    }
    return [];
  },

  /**
   * Smart Gemini caller with candidate rotation and ModelService auto-discovery
   */
  async callGeminiApiWithFallback(
    apiKey: string,
    preferredModel: string,
    requestBody: any
  ): Promise<{ data: any; usedModel: string }> {
    const cleanPreferred = (preferredModel || '').replace(/^models\//, '').trim();

    // Priority candidates
    const fallbackList = [
      cleanPreferred,
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro'
    ].filter(Boolean);

    const candidates = Array.from(new Set(fallbackList));
    let lastError: any = null;

    // 1. Try candidates across v1beta and v1
    for (const modelName of candidates) {
      for (const apiVer of ['v1beta', 'v1']) {
        const endpoint = `https://generativelanguage.googleapis.com/${apiVer}/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey.trim()}`;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (res.ok) {
            const data = await res.json();
            return { data, usedModel: modelName };
          }

          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);

          if (res.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))) {
            throw new Error('API Key de Gemini no válida. Verifica tu clave en Google AI Studio.');
          }
          if (res.status === 403) {
            throw new Error('API Key de Gemini sin permisos suficientes.');
          }
        } catch (e: any) {
          if (e.message && e.message.includes('API Key')) throw e;
          lastError = e;
        }
      }
    }

    // 2. If candidates failed with 404/not supported, query ListModels for authorized models
    const discovered = await this.getAvailableGeminiModels(apiKey);
    if (discovered.length > 0) {
      for (const modelName of discovered) {
        for (const apiVer of ['v1beta', 'v1']) {
          const endpoint = `https://generativelanguage.googleapis.com/${apiVer}/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey.trim()}`;
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            if (res.ok) {
              const data = await res.json();
              return { data, usedModel: modelName };
            }
          } catch {
            // continue
          }
        }
      }
    }

    throw lastError || new Error(`No se pudo conectar con los modelos de Gemini. Verifica tu clave.`);
  },

  /**
   * Tests connection to the selected AI provider (Gemini, Groq, OpenRouter)
   */
  async testConnection(settings: {
    provider: AIProvider;
    apiKey: string;
    model: string;
  }): Promise<{ success: boolean; message: string; suggestedModel?: string }> {
    const { provider, apiKey, model } = settings;

    if (!apiKey || apiKey.trim() === '') {
      return { success: false, message: 'La API Key está vacía. Ingresa tu clave para probar.' };
    }

    try {
      if (provider === 'gemini') {
        const cleanModel = (model || 'gemini-2.0-flash').replace(/^models\//, '').trim();
        const testBody = {
          contents: [{ role: 'user', parts: [{ text: 'Responde únicamente con la palabra: CONECTADO' }] }],
        };

        const { usedModel } = await this.callGeminiApiWithFallback(apiKey, cleanModel, testBody);
        return {
          success: true,
          message: `¡Conexión exitosa con Google Gemini (${usedModel})!`,
          suggestedModel: usedModel,
        };
      } else if (provider === 'groq') {
        const testModel = model || 'llama-3.3-70b-versatile';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error HTTP ${res.status}`);
        }
        return { success: true, message: `¡Conexión exitosa con Groq (${testModel})!` };
      } else if (provider === 'openrouter') {
        const testModel = model || 'google/gemini-2.0-flash-lite-001';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error HTTP ${res.status}`);
        }
        return { success: true, message: `¡Conexión exitosa con OpenRouter (${testModel})!` };
      }

      return { success: false, message: 'Proveedor no reconocido.' };
    } catch (err: any) {
      return { success: false, message: `Fallo de conexión: ${err.message}` };
    }
  },

  /**
   * Evaluates user spoken response using Cloud AI or fallback
   */
  async evaluateAnswer(params: AIEvaluationRequest): Promise<EvaluationResult> {
    const { provider, apiKey, model, personality, module, question, userAnswer, isReviewMode } = params;

    // If no API key provided, use the smart local NLP engine
    if (!apiKey || apiKey.trim() === '') {
      return this.smartLocalEvaluation(userAnswer, question, personality, isReviewMode);
    }

    const systemPrompt = `
${PERSONALITY_PROMPTS[personality]}

Tu rol es evaluar con máxima agudeza pedagógica la respuesta oral del estudiante en el curso "${module.title}".
- Pregunta realizada: "${question.prompt}"
- Concepto o meta pedagógica: "${question.expectedConcept}"
- Idioma en que el usuario debía responder: ${question.languageToListen === 'en-US' ? 'Inglés' : 'Español'}.
- Modo actual: ${isReviewMode ? 'MODO REPASO OBLIGATORIO (el usuario cometió fallos seguidos aquí, sé muy estricto y didáctico)' : 'Evaluación regular'}.

INSTRUCCIONES CLAVE DE EVALUACIÓN:
1. Evalúa si la respuesta transmitida ("${userAnswer}") cumple con la idea requerida, gramática, vocabulario y naturalidad.
2. Considera que la transcripción proviene de reconocimiento de voz (STT). Errores menores de puntuación no deben penalizarse, pero errores de conjugación (ej: "didn't went", "I order yesterday"), vocabulario o concepto SÍ deben ser detectados.
3. Si la respuesta está mal o es incoherente:
   - "replica_sarcastica": Sé implacablemente sarcástico, mordaz o irónico (máximo 2 oraciones breves).
   - "explicacion_por_que": Enseña con suma claridad qué regla gramatical o lógica se rompió y por qué.
   - "respuesta_correcta_modelo": Ofrece la frase natural y exacta en el idioma correspondiente.
4. "siguiente_accion":
   - "avanzar": si respondió bien o tuvo un fallo irrelevante.
   - "repetir_frase": si cometió un error gramatical o sintáctico claro y debe pronunciar la frase correcta antes de avanzar.
   - "repaso_forzado": si demostró desconocimiento total del concepto.

FORMATO OBLIGATORIO DE RESPUESTA:
Devuelve EXCLUSIVAMENTE un objeto JSON válido con los campos:
{
  "es_correcta": true | false,
  "puntaje_precision": number (0 a 100),
  "replica_sarcastica": string,
  "explicacion_por_que": string,
  "respuesta_correcta_modelo": string,
  "categoria_error": string,
  "siguiente_accion": "avanzar" | "repetir_frase" | "repaso_forzado"
}
`;

    const userMessage = `El usuario ha dicho por su micrófono:\n"${userAnswer}"\n\nEvalúa su respuesta y devuelve estrictamente el JSON.`;

    try {
      if (provider === 'gemini') {
        return await this.callGeminiEvaluation(apiKey, model, systemPrompt, userMessage);
      } else if (provider === 'groq') {
        return await this.callOpenAICompatibleEvaluation('https://api.groq.com/openai/v1/chat/completions', apiKey, model || 'llama-3.3-70b-versatile', systemPrompt, userMessage);
      } else if (provider === 'openrouter') {
        return await this.callOpenAICompatibleEvaluation('https://openrouter.ai/api/v1/chat/completions', apiKey, model || 'google/gemini-2.0-flash-lite-001', systemPrompt, userMessage);
      } else {
        return await this.callGeminiEvaluation(apiKey, model, systemPrompt, userMessage);
      }
    } catch (error: any) {
      console.error('Cloud AI evaluation failed, falling back to smart local evaluation:', error);
      // If error is about API key permissions/invalid key, rethrow so UI can warn
      if (error.message.includes('API Key') || error.message.includes('403') || error.message.includes('400')) {
        throw error;
      }
      return this.smartLocalEvaluation(userAnswer, question, personality, isReviewMode);
    }
  },

  /**
   * Google Gemini Evaluation with JSON schema
   */
  async callGeminiEvaluation(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userMessage: string
  ): Promise<EvaluationResult> {
    const cleanModel = (model || 'gemini-2.0-flash').replace(/^models\//, '').trim();
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 250,
        responseMimeType: 'application/json',
        responseSchema: EVALUATION_SCHEMA
      }
    };

    const { data } = await this.callGeminiApiWithFallback(apiKey, cleanModel, requestBody);
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Respuesta vacía de Gemini.');

    return JSON.parse(rawText);
  },

  /**
   * OpenAI Compatible Evaluation (Groq / OpenRouter)
   */
  async callOpenAICompatibleEvaluation(
    endpoint: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userMessage: string
  ): Promise<EvaluationResult> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Error en la API de IA (${response.status})`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Respuesta vacía de la IA.');

    return JSON.parse(content);
  },

  /**
   * Generates a new dynamic question (Instant for curated/imported, fast for AI)
   */
  async generateQuestion(params: {
    provider: AIProvider;
    apiKey: string;
    model: string;
    module: CourseModule;
    recentErrors: ErrorLogItem[];
    isReviewMode: boolean;
  }): Promise<QuestionItem> {
    const { provider, apiKey, model, module, recentErrors, isReviewMode } = params;

    // FAST PATH (0ms): If the module has curated or imported questions, load immediately without network delay!
    const list = CURATED_QUESTIONS[module.id];
    if (list && list.length > 0 && !isReviewMode && (!module.isCustom || !module.customTopicText)) {
      const randomIndex = Math.floor(Math.random() * list.length);
      return { ...list[randomIndex], id: 'q_' + Date.now() };
    }

    // Fallback if no key
    if (!apiKey || apiKey.trim() === '') {
      const fallbackList = list || CURATED_QUESTIONS.ingles_conversacional;
      const randomIndex = Math.floor(Math.random() * fallbackList.length);
      const chosen = { ...fallbackList[randomIndex], id: 'q_' + Date.now() };

      if (module.isCustom && module.customTopicText) {
        chosen.prompt = `Basado en tu tema (${module.customTopicText.slice(0, 40)}...): Explica el concepto fundamental y cita un ejemplo práctico.`;
        chosen.expectedConcept = module.customTopicText;
      }

      if (isReviewMode && recentErrors.length > 0) {
        const lastErr = recentErrors[0];
        chosen.prompt = `[REPASO OBLIGATORIO] Reparemos tu fallo: "${lastErr.question}". Responde correctamente sin repetir el error de "${lastErr.categoriaError}".`;
        chosen.expectedConcept = lastErr.respuestaCorrectaModelo;
      }

      return chosen;
    }

    const promptText = `
Eres un creador de retos orales para la app EdTech "MigoLab".
Genera 1 única pregunta directa para el módulo: "${module.title}".
Descripción: "${module.description}".
${module.isCustom && module.customTopicText ? `Apuntes del usuario: "${module.customTopicText}"` : ''}

Idioma en el que Migo formula la pregunta: ${module.languageQuestion === 'en-US' ? 'Inglés' : 'Español'}.
Idioma en el que el usuario debe responder hablando: ${module.languageAnswer === 'en-US' ? 'Inglés' : 'Español'}.

${isReviewMode && recentErrors.length > 0 ? `
¡ATENCIÓN! Modo Repaso Forzado por fallos recientes:
${recentErrors.slice(0, 2).map(e => `- Falló en: "${e.question}" con respuesta: "${e.userAnswer}" (Categoría: ${e.categoriaError})`).join('\n')}
Crea una pregunta focalizada en corregir esta debilidad específica.
` : ''}

Devuelve EXCLUSIVAMENTE un JSON:
{
  "prompt": "Pregunta o situación directa y concisa que Migo le dirá al usuario",
  "context": "Contexto breve",
  "languageToListen": "${module.languageAnswer}",
  "difficulty": "medio",
  "expectedConcept": "Respuesta modelo exacta o concepto requerido",
  "options": [
    { "id": "A", "text": "Opción correcta impecable", "isCorrect": true, "explanationWhy": "Por qué es correcta" },
    { "id": "B", "text": "Distractor con error típico o falso amigo", "isCorrect": false, "explanationWhy": "Por qué es incorrecta" },
    { "id": "C", "text": "Distractor con error gramatical", "isCorrect": false, "explanationWhy": "Por qué es incorrecta" },
    { "id": "D", "text": "Distractor absurdo o descortés", "isCorrect": false, "explanationWhy": "Por qué es incorrecta" }
  ]
}
`;

    try {
      if (provider === 'gemini') {
        const cleanModel = (model || 'gemini-2.0-flash').replace(/^models\//, '').trim();
        const requestBody = {
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' }
        };

        const { data } = await this.callGeminiApiWithFallback(apiKey, cleanModel, requestBody);
        const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text);
        return {
          id: 'dyn_' + Date.now(),
          moduleId: module.id,
          prompt: parsed.prompt,
          context: parsed.context || module.subtitle,
          languageToListen: module.languageAnswer,
          difficulty: parsed.difficulty || 'medio',
          expectedConcept: parsed.expectedConcept,
          options: parsed.options,
        };
      } else {
        const endpoint = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
        const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'google/gemini-2.0-flash-lite-001';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model || defaultModel,
            messages: [{ role: 'user', content: promptText }],
            response_format: { type: 'json_object' },
            temperature: 0.8,
          })
        });
        const data = await res.json();
        const parsed = JSON.parse(data?.choices?.[0]?.message?.content);
        return {
          id: 'dyn_' + Date.now(),
          moduleId: module.id,
          prompt: parsed.prompt,
          context: parsed.context || module.subtitle,
          languageToListen: module.languageAnswer,
          difficulty: parsed.difficulty || 'medio',
          expectedConcept: parsed.expectedConcept,
          options: parsed.options,
        };
      }
    } catch {
      const list = CURATED_QUESTIONS[module.id] || CURATED_QUESTIONS.ingles_conversacional;
      return { ...list[Math.floor(Math.random() * list.length)], id: 'fallback_' + Date.now() };
    }
  },

  /**
   * Add custom imported questions to active registry
   */
  addCustomQuestions(moduleId: string, questions: QuestionItem[]): void {
    if (!CURATED_QUESTIONS[moduleId]) {
      CURATED_QUESTIONS[moduleId] = [];
    }
    CURATED_QUESTIONS[moduleId].push(...questions);
  },

  /**
   * Set (replace) questions for a module
   */
  setQuestionsForModule(moduleId: string, questions: QuestionItem[]): void {
    CURATED_QUESTIONS[moduleId] = [...questions];
  },

  /**
   * Get all registered questions for a module
   */
  getQuestionsForModule(moduleId: string): QuestionItem[] {
    return CURATED_QUESTIONS[moduleId] ? [...CURATED_QUESTIONS[moduleId]] : [];
  },

  /**
   * Helper to ensure a question always has multiple choice options
   */
  getOrGenerateOptions(q: QuestionItem): MultipleChoiceOption[] {
    if (q.options && q.options.length >= 2) {
      return q.options;
    }
    return [
      { id: 'A', text: q.expectedConcept, isCorrect: true, explanationWhy: 'Respuesta modelo correcta.' },
      { id: 'B', text: `Dudar y responder algo incompleto sobre "${q.prompt.slice(0, 25)}..."`, isCorrect: false, explanationWhy: 'Respuesta insuficiente.' },
      { id: 'C', text: q.languageToListen === 'en-US' ? 'I don\'t know the correct rule.' : 'No sé la respuesta correcta.', isCorrect: false, explanationWhy: 'Falta de dominio conceptual.' },
      { id: 'D', text: q.languageToListen === 'en-US' ? 'None of the above options.' : 'Ninguna de las opciones anteriores.', isCorrect: false, explanationWhy: 'Opción incorrecta.' },
    ];
  },

  /**
   * Smart Local Semantic NLP Engine (Evaluates grammar, double past, math logic, etc.)
   */
  smartLocalEvaluation(
    userAnswer: string,
    question: QuestionItem,
    personality: PersonalityMode,
    isReviewMode?: boolean
  ): EvaluationResult {
    const raw = userAnswer.toLowerCase().trim();
    const cleanWords = raw.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/).filter(Boolean);

    // 1. English grammar analysis
    if (question.languageToListen === 'en-US') {
      // Check double past tense error (e.g. didn't went, didn't ordered, didn't saw)
      const doublePastRegex = /\b(didn't|did not)\s+(went|ordered|saw|had|took|came|felt|received|asked|bought)\b/i;
      if (doublePastRegex.test(raw)) {
        const match = raw.match(doublePastRegex);
        return {
          es_correcta: false,
          puntaje_precision: 30,
          replica_sarcastica: personality === 'sarcastico_brutal'
            ? '¡Auxilio, la policía gramatical! ¿Acabas de decir pasado doble? En inglés el auxiliar "did" ya absorbe el pasado.'
            : 'Fallo clásico: usaste pasado doble en la misma cláusula verbal.',
          explicacion_por_que: `Dijiste "${match ? match[0] : 'did not + pasado'}". Cuando usas el auxiliar negativo "didn't", el verbo principal SIEMPRE debe ir en forma base o infinitivo sin to (ej: "didn't go", no "didn't went").`,
          respuesta_correcta_modelo: question.expectedConcept,
          categoria_error: 'Tiempo verbal (Doble pasado)',
          siguiente_accion: 'repetir_frase'
        };
      }

      // Check missing auxiliary or bad negation (e.g. "I no go", "I not went")
      const badNegationRegex = /\b(i\s+no\s+\w+|i\s+not\s+\w+)\b/i;
      if (badNegationRegex.test(raw)) {
        return {
          es_correcta: false,
          puntaje_precision: 25,
          replica_sarcastica: 'El inglés no se niega diciendo "I no". Esto no es una película de vaqueros de los años 50.',
          explicacion_por_que: 'Para negar acciones en pasado simple en inglés necesitas el auxiliar "did not" o "didn\'t" seguido del verbo en infinitivo.',
          respuesta_correcta_modelo: question.expectedConcept,
          categoria_error: 'Estructura / Negación',
          siguiente_accion: 'repetir_frase'
        };
      }

      // Check restaurant check question (ic_1)
      if (question.id === 'ic_1') {
        const hasModal = /\b(could|can|may|would)\b/i.test(raw);
        const hasCheckOrBill = /\b(check|bill|ticket|account)\b/i.test(raw);
        const hasBringOrHave = /\b(bring|have|get|take)\b/i.test(raw);

        if (hasModal && hasCheckOrBill && hasBringOrHave) {
          return {
            es_correcta: true,
            puntaje_precision: 95,
            replica_sarcastica: 'Vaya, el camarero no te escupirá la sopa. Tu frase fue perfectamente cortés y natural.',
            explicacion_por_que: 'Usaste correctamente el verbo modal de cortesía ("could/can") junto al vocabulario adecuado ("the check/the bill").',
            respuesta_correcta_modelo: 'Excuse me, could you bring me the check, please?',
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        } else if (!hasCheckOrBill) {
          return {
            es_correcta: false,
            puntaje_precision: 40,
            replica_sarcastica: 'Pediste algo con mucha educación, lástima que olvidaste pedir la cuenta.',
            explicacion_por_que: 'En un restaurante en EE.UU. o Reino Unido se pide "the check" o "the bill". Decir "the account" es un calco erróneo del español.',
            respuesta_correcta_modelo: 'Excuse me, could you bring me the check, please?',
            categoria_error: 'Vocabulario',
            siguiente_accion: 'repetir_frase'
          };
        }
      }

      // Check past concert question (ic_2)
      if (question.id === 'ic_2') {
        const hasPastNegative = /\b(didn't go|did not go)\b/i.test(raw);
        const hasTired = /\b(tired|exhausted)\b/i.test(raw);
        const hasBecause = /\b(because|as|since)\b/i.test(raw);

        if (hasPastNegative && hasTired && hasBecause) {
          return {
            es_correcta: true,
            puntaje_precision: 94,
            replica_sarcastica: '¡Milagro! Convocaste el pasado simple y el conector causal sin destruir el idioma.',
            explicacion_por_que: 'Estructura perfecta con "didn\'t go" y la cláusula causal con adjetivo "tired".',
            respuesta_correcta_modelo: 'Yesterday I didn\'t go to the concert because I felt very tired.',
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        }
      }

      // General pattern matching for English
      if (question.acceptedPatterns && question.acceptedPatterns.length > 0) {
        const matchedCount = question.acceptedPatterns.filter(p => raw.includes(p.toLowerCase())).length;
        if (matchedCount >= Math.min(2, question.acceptedPatterns.length)) {
          return {
            es_correcta: true,
            puntaje_precision: 90,
            replica_sarcastica: 'Aceptable. Tus neuronas parecen estar sincronizadas hoy.',
            explicacion_por_que: 'Tu respuesta incluye los términos y la sintaxis indispensable para este contexto.',
            respuesta_correcta_modelo: question.expectedConcept,
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        }
      }
    }

    // 2. Spanish Math & Logic analysis
    if (question.languageToListen === 'es-ES') {
      // Bat and ball problem (ml_1)
      if (question.id === 'ml_1') {
        // Cognitive illusion trap: people intuitively say 10 cents
        if (raw.includes('10') || raw.includes('diez')) {
          return {
            es_correcta: false,
            puntaje_precision: 15,
            replica_sarcastica: '¡Caíste redondito en la trampa intuitiva! Si la pelota costara 10 centavos y el bate $1 más ($1.10), juntos costarían $1.20.',
            explicacion_por_que: 'Resolvamos el álgebra básica: Si la pelota cuesta x, el bate cuesta x + 1.00. La suma es x + (x + 1.00) = 1.10. Esto nos da 2x = 0.10, por lo que x = 0.05 (5 centavos).',
            respuesta_correcta_modelo: 'La pelota cuesta 5 centavos ($0.05).',
            categoria_error: 'Lógica / Cálculo',
            siguiente_accion: 'repaso_forzado'
          };
        } else if (raw.includes('5') || raw.includes('cinco') || raw.includes('0.05')) {
          return {
            es_correcta: true,
            puntaje_precision: 100,
            replica_sarcastica: '¡Impresionante! No caíste en el sesgo que hace fallar al 80% de los estudiantes de Harvard.',
            explicacion_por_que: 'Exacto: la pelota cuesta 5 centavos y el bate $1.05, sumando juntos $1.10 con una diferencia exacta de $1.00.',
            respuesta_correcta_modelo: 'La pelota cuesta 5 centavos ($0.05).',
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        }
      }

      // Exponent zero problem (ml_2)
      if (question.id === 'ml_2') {
        const hasCociente = /\b(cociente|division|dividir|fraccion|resta|restan|igual base|entre si mismo)\b/i.test(raw);
        if (hasCociente) {
          return {
            es_correcta: true,
            puntaje_precision: 95,
            replica_sarcastica: 'Correcto. Demostraste que no te limitas a memorizar fórmulas como un loro.',
            explicacion_por_que: 'Al dividir a^n entre a^n, el resultado aritmético es 1, y por leyes de exponentes los exponentes se restan: a^(n-n) = a^0 = 1.',
            respuesta_correcta_modelo: 'Porque a^n / a^n = 1 y por leyes de potencias a^(n-n) = a^0.',
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        }
      }

      // Prime numbers (ml_3)
      if (question.id === 'ml_3') {
        const hasDivisores = /\b(dos divisores|exactamente dos|solo tiene un|1 y si mismo)\b/i.test(raw);
        if (hasDivisores) {
          return {
            es_correcta: true,
            puntaje_precision: 96,
            replica_sarcastica: '¡Muy bien! La mayoría olvida que la definición formal exige dos divisores distintos.',
            explicacion_por_que: 'La definición moderna de número primo exige tener exactamente dos divisores positivos distintos. El 1 solo tiene un único divisor.',
            respuesta_correcta_modelo: 'Un primo tiene exactamente dos divisores distintos; el 1 solo tiene uno.',
            categoria_error: 'Ninguno',
            siguiente_accion: 'avanzar'
          };
        }
      }
    }

    // Fallback if not specifically caught
    if (cleanWords.length < 3) {
      return {
        es_correcta: false,
        puntaje_precision: 20,
        replica_sarcastica: '¿Eso fue todo? Apenas pronunciaste dos monosílabos. Necesito una frase completa para evaluarte.',
        explicacion_por_que: `Tu respuesta "${userAnswer}" fue demasiado escueta. Se requería elaborar la idea aplicando: "${question.expectedConcept}".`,
        respuesta_correcta_modelo: question.expectedConcept,
        categoria_error: 'Respuesta incompleta',
        siguiente_accion: isReviewMode ? 'repaso_forzado' : 'repetir_frase'
      };
    }

    // Default wrong diagnosis
    return {
      es_correcta: false,
      puntaje_precision: 45,
      replica_sarcastica: personality === 'sarcastico_brutal'
        ? 'Aprecio el valor que tuviste para decir eso en voz alta, pero conceptualmente está errado.'
        : 'Esa respuesta no corresponde a la solución precisa esperada.',
      explicacion_por_que: `Para la consigna "${question.prompt}", debiste utilizar la estructura: ${question.expectedConcept}. En su lugar dijiste: "${userAnswer}".`,
      respuesta_correcta_modelo: question.expectedConcept,
      categoria_error: question.languageToListen === 'en-US' ? 'Gramática / Expresión' : 'Concepto y Lógica',
      siguiente_accion: isReviewMode ? 'repaso_forzado' : 'repetir_frase'
    };
  }
};
