Actúa como un Ingeniero de Software Senior Full-Stack y Diseñador de Producto especializado en EdTech e interfaces conversacionales por voz.

### OBJETIVO DEL PROYECTO
Construye desde cero una aplicación web interactiva de aprendizaje por voz llamada **"MigoLab"** (inspirada en apps como *Conmigo* y *Educato*), donde el usuario aprende idiomas o materias de estudio interactuando **únicamente mediante su voz** con una mascota/tutor de personalidad sarcástica, exigente y burlona que evalúa sus respuestas en tiempo real, le dice con sarcasmo si falló y le explica con claridad el *porqué* y cómo llegar a la respuesta correcta.

### RESTRICCIÓN CRÍTICA DE COSTO ($0)
Todo el sistema debe funcionar de forma **100 % gratuita** sin requerir tarjetas de crédito ni servicios de pago:
1. **Entrada de voz (STT):** Usa exclusivamente la Web Speech API nativa del navegador (`window.SpeechRecognition || window.webkitSpeechRecognition`) con soporte dinámico de idioma (`en-US` para respuestas en inglés, `es-ES` para materias en español).
2. **Salida de voz (TTS):** Usa exclusivamente `window.speechSynthesis` del navegador, seleccionando automáticamente la mejor voz disponible y ajustando `pitch` y `rate` según si la evaluación fue correcta o incorrecta.
3. **Motor de Evaluación IA:** Conecta con la API REST de Google Gemini (`gemini-2.5-flash` por defecto, configurable en UI) usando `responseMimeType: "application/json"` y `responseSchema` estricto. Permite ingresar la API Key gratuita de Google AI Studio desde la interfaz y guardarla localmente en `localStorage`.

### STACK TECNOLÓGICO
- **Framework:** React + TypeScript + Vite (o Next.js App Router limpio en modo cliente).
- **Estilos:** Tailwind CSS con diseño moderno tipo EdTech gamificado (tema oscuro elegante, tarjetas con bordes definidos, animaciones suaves para la mascota y estados de grabación).
- **Persistencia:** `localStorage` para progreso, racha, puntos de dominio, API Key, configuración de nivel de sarcasmo e historial de errores ("Cuaderno de meteduras de pata").

### ARQUITECTURA FUNCIONAL Y EXPERIENCIA DE USUARIO (UX)

#### 1. Mascota con Personalidad y Estados Visuales
- Crea un componente SVG animado de una mascota tutora (ej. un ajolote con lentes y birrete de graduación o un búho cínico) con **4 estados emocionales visuales**:
  1. `neutral / esperando`: esperando que el usuario hable.
  2. `escuchando`: ondas de audio activas mientras el micrófono graba.
  3. `burlón / decepcionado`: cuando el usuario se equivoca (cejas fruncidas / expresión sarcástica).
  4. `impresionado / exigente`: cuando el usuario acierta.
- Selector de intensidad de personalidad:
  - **Modo Irónico Suave**
  - **Modo Sarcástico Brutal** (burlas ingeniosas y directas por errores obvios, sin cruzar hacia insultos extremos ni discurso de odio).
  - **Modo Sargento Estricto**

#### 2. Selector de Ruta / Curso (Estilo Mapa de Lecciones)
Implementa un mapa visual de módulos desbloqueables con barra de progreso y **sistema de bloqueo por errores (Gatekeeping)**:
- **Rutas incluidas por defecto:**
  1. *Inglés Conversacional: Tiempos Verbales y Situaciones Reales* (el tutor pregunta en español y exige respuesta hablada en inglés).
  2. *Inglés de Supervivencia: Entrevistas y Trabajo* (pregunta y respuesta en inglés).
  3. *Fundamentos de Matemáticas y Lógica* (preguntas conceptuales y resolución hablada en español).
  4. *Tema Libre / Personalizado* (el usuario escribe cualquier tema o pega apuntes y la IA genera el camino de preguntas).
- **Regla de Gatekeeping:** Si el usuario comete **2 errores seguidos** en un módulo, el avance se bloquea automáticamente y el tutor entra en **"Modo Repaso Obligatorio"**, generando preguntas enfocadas específicamente en el error cometido hasta que logre 2 aciertos consecutivos.

#### 3. Flujo Interactivo por Voz (Turn-Based Voice Loop)
1. El usuario pulsa **"Iniciar Reto"** (o usa atajo de teclado `Barra Espaciadora`).
2. Gemini genera una pregunta/escenario corto según el módulo actual y el historial de fallos previos.
3. La mascota lee la pregunta en voz alta (`speechSynthesis`) y, al terminar de hablar, **activa automáticamente el micrófono** (`SpeechRecognition`) con indicador visual de onda sonora (incluyendo botón manual para volver a grabar o cancelar, y fallback de texto opcional solo si el navegador no soporta micrófono).
4. Al detectar el fin de la frase hablada, envía la transcripción a Gemini para evaluación estructurada en JSON con este esquema exacto:
   ```json
   {
     "es_correcta": "boolean",
     "puntaje_precision": "number (0 a 100)",
     "replica_sarcastica": "string (reacción corta con la personalidad elegida, máx 2 oraciones)",
     "explicacion_por_que": "string (explicación pedagógica clara de por qué está bien o qué falló exactamente)",
     "respuesta_correcta_modelo": "string (cómo debió responderse de forma natural/exacta)",
     "categoria_error": "string (ej. 'Tiempo verbal', 'Preposición', 'Concepto', 'Ninguno')",
     "siguiente_accion": "string ('avanzar' | 'repetir_frase' | 'repaso_forzado')"
   }
   ```
5. **Reacción Multimodal:**
   - La mascota cambia su expresión facial según `es_correcta`.
   - En pantalla se despliega la tarjeta de diagnóstico: lo que escuchó el micrófono, la burla/réplica del tutor, el **porqué** detallado y la respuesta modelo.
   - El sistema lee en voz alta `replica_sarcastica` + `explicacion_por_que`.
   - Si `siguiente_accion === "repetir_frase"`, el tutor exige al usuario que pronuncie en voz alta la `respuesta_correcta_modelo` antes de pasar a la siguiente pregunta.

#### 4. Panel de Historial de Errores y Estadísticas
- Barra superior con: Racha actual, Puntos XP, Precisión (%) y estado de bloqueo del módulo.
- Pestaña o drawer **"Mis Errores"** donde se guardan todas las respuestas falladas con su explicación, permitiéndole al usuario pulsar "Practicar este error ahora" para que el tutor lo vuelva a evaluar sobre ese punto específico.

### ENTREGABLES ESPERADOS
1. Estructura completa del proyecto lista para ejecutar (`npm install && npm run dev`).
2. Código limpio, modularizado en componentes (`MascotAvatar.tsx`, `LessonMap.tsx`, `VoiceEvaluator.tsx`, `ErrorLogDrawer.tsx`, `geminiService.ts`, `speechService.ts`).
3. Manejo robusto de errores: avisos claros si el navegador no soporta `SpeechRecognition` (recomendando Chrome/Edge), si la API Key falta o alcanzó límite de cuota gratuita (`429`), o si el micrófono no tiene permisos.
4. Incluye un archivo `README.md` breve explicando cómo obtener la API Key gratuita en Google AI Studio y cómo iniciar el proyecto.

Comienza creando el proyecto, implementa todos los componentes con calidad de producción y verifica que compile sin errores de TypeScript.