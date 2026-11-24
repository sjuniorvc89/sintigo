# 🚀 AWS Amplify Backend para MigoLab

Este directorio contiene la arquitectura completa de Base de Datos y Backend para **AWS Amplify Gen 2**, basada en **AWS DynamoDB**, **AWS AppSync (GraphQL)** y **AWS Cognito**.

---

## 📦 Modelos de Base de Datos Incluidos

1. **`CourseModule`**: Guarda los temas y rutas de estudio (título, subtítulo, descripción, idiomas, lecciones).
2. **`QuestionItem`**: Almacena las preguntas y sus opciones múltiples (A, B, C, D) para cada tema.
3. **`UserProfile`**: Sincroniza configuraciones del usuario, claves de API y estadísticas de racha/XP.
4. **`ErrorLog`**: Registro persistente del Cuaderno de Meteduras de Pata para repaso inteligente.

---

## 🛠️ Cómo Activar la Base de Datos en AWS Amplify

### Opción 1: Despliegue automático desde AWS Amplify Hosting (Recomendado)
1. Si ya conectaste tu repositorio Git en la consola de **AWS Amplify**:
   - Amplify detectará la carpeta `amplify/` automáticamente.
   - En el siguiente despliegue (*git push*), aprovisionará las tablas DynamoDB y el endpoint AppSync en tu cuenta de AWS.

### Opción 2: Probar en local con Sandbox en tiempo real
Para probar tu base de datos en una cuenta de AWS:
```bash
npx ampx sandbox
```
Esto creará una base de datos DynamoDB en la nube en tiempo real conectada a tu entorno de desarrollo.

### Opción 3: Modo Híbrido / Endpoint REST
En el menú de **⚙️ Configuración → 🗄️ Base de Datos & Nube**, puedes ingresar la URL de tu endpoint de AWS API Gateway o Lambda para sincronizar automáticamente todos tus temas, preguntas y claves con un solo clic.

---

## 🔒 Seguridad de Claves de API
- Las claves de API (Gemini, Groq, ElevenLabs, OpenAI) se almacenan cifradas en tu navegador (`localStorage`) por defecto, garantizando privacidad total.
- Al sincronizar con la nube, los datos quedan protegidos por autenticación de AWS (Cognito / API Key).
