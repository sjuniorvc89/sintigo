# 🦉 MigoLab - Tutor Sarcástico por Voz ($0 Cost)

**MigoLab** es una aplicación web interactiva de aprendizaje conversacional por voz (inspirada en apps como *Conmigo* y *Educato*), donde interactúas **únicamente mediante tu voz** con un tutor/mascota de personalidad sarcástica, exigente y burlona que evalúa tus respuestas en tiempo real, te dice con sarcasmo si fallaste y te explica con claridad el *porqué* y la regla pedagógica para llegar a la respuesta correcta.

---

## ⚡ Características Principales

1. **Entrada de voz 100 % Gratuita (STT):**
   - Utiliza exclusivamente la Web Speech API nativa del navegador (`window.SpeechRecognition` / `window.webkitSpeechRecognition`).
   - Soporte dinámico de idiomas: `en-US` para respuestas en inglés y `es-ES` para materias en español.
   - Atajo de teclado: pulsa la **Barra Espaciadora** para activar el micrófono o iniciar un reto sin manos.

2. **Salida de voz con Emoción Dinámica (TTS):**
   - Utiliza `window.speechSynthesis` del navegador, seleccionando automáticamente las mejores voces naturales locales y modulando el tono (`pitch`) y velocidad (`rate`) según el resultado: sarcástico/burlón en errores y satisfecho/exigente en aciertos.

3. **Mascota con 4 Estados Emocionales Animados (SVG):**
   - **Neutral / Esperando:** Flotando con actitud atenta.
   - **Escuchando:** Ojos atentos y ondas de audio animadas activas.
   - **Burlón / Decepcionado:** Cejas arqueadas con incredulidad, mirada de lado y gotas de sarcasmo.
   - **Impresionado / Exigente:** Ojos brillantes, birrete levantado y felicitación exigente.

4. **Motor de Evaluación IA con Google Gemini:**
   - Conexión directa a Google Gemini (`gemini-2.5-flash` por defecto, o configurable a `gemini-1.5-flash`/`gemini-1.5-pro`).
   - Modo de respuesta estructurado estricto con `responseMimeType: "application/json"`.
   - **Modo Demo Inteligente sin API Key:** Permite probar y jugar de inmediato sin necesidad de ingresar una clave previa.

5. **Sistema de Bloqueo por Errores (Gatekeeping):**
   - Si cometes **2 errores consecutivos** en cualquier módulo, el avance se bloquea de inmediato.
   - El tutor activa el **"Modo Repaso Obligatorio"**, generando preguntas enfocadas en el error cometido hasta que consigas **2 aciertos consecutivos**.

6. **Selector de Intensidad de Personalidad:**
   - **Modo Irónico Suave:** Humor sutil, fino y educado.
   - **Modo Sarcástico Brutal:** Burlas ingeniosas y mordaces ante errores evidentes.
   - **Modo Sargento Estricto:** Disciplina implacable y exigencia militar.

7. **Cuaderno de Meteduras de Pata ("Mis Errores"):**
   - Registro de todas las respuestas falladas con su explicación detallada y respuesta modelo.
   - Botón interactivo **"Practicar este error ahora"** para reevaluarte inmediatamente sobre ese punto débil.

8. **4 Rutas Incluidas:**
   - *Inglés Conversacional: Tiempos Verbales y Vida Real*
   - *Inglés de Supervivencia: Entrevistas y Trabajo (100% EN)*
   - *Fundamentos de Matemáticas y Lógica*
   - *Tema Libre / Personalizado* (pega tus apuntes o temario de examen para generar retos orales a medida).

---

## 🔑 Cómo Obtener tu API Key Gratuita de Google AI Studio

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en el botón azul **"Create API Key"** (o "Crear clave de API").
4. Copia la clave generada (empieza por `AIzaSy...`).
5. En **MigoLab**, haz clic en el icono de engranaje (⚙️ **Configuración**) o en el banner superior y pega tu API Key.
6. Se guardará localmente en el `localStorage` de tu navegador de manera privada y segura.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior)
- Navegador recomendado: **Google Chrome** o **Microsoft Edge** (para soporte óptimo de la Web Speech API nativa).

### Pasos:
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

### Compilación para Producción:
```bash
npm run build
```

---

## 📂 Arquitectura del Proyecto

```
sintigo/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts                 # Esquemas de TypeScript (EvaluationResult, etc.)
│   ├── services/
│   │   ├── speechService.ts         # Wrapper STT (SpeechRecognition) y TTS (SpeechSynthesis)
│   │   ├── geminiService.ts         # Integración Gemini REST API con JSON Schema
│   │   └── storageService.ts        # Persistencia en localStorage
│   └── components/
│       ├── MascotAvatar.tsx         # SVG animado con 4 estados emocionales y ondas
│       ├── HeaderStats.tsx          # Racha, XP, precisión y accesos rápidos
│       ├── LessonMap.tsx            # Selector de rutas y Gatekeeping
│       ├── VoiceEvaluator.tsx       # Bucle interactivo por voz y tarjeta de diagnóstico
│       ├── ErrorLogDrawer.tsx       # Cuaderno de meteduras de pata y práctica
│       ├── SettingsModal.tsx        # Configuración de API Key, personalidad y voz
│       └── CustomTopicModal.tsx     # Generador de temas libres con apuntes
```
