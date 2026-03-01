## 🏟️ **Backend - Microservicio de Gestión Deportiva** 🏃⚽

Este es un backend bajo una arquitectura de microserivcios que se encarga de gestionar la aplicación web en React. Sus principales funciones son:
- Gestión de canchas y partidos para deportes como fútbol, pádel y tenis.
- Subida de videos de los partidos.
- Generación de estadísticas de análisis de partidos.

---

## 📌 **📚 Tecnologías Utilizadas**

- 💪 Node.js + Express
- 📜 TypeScript
- 💾 MongoDB + Mongoose
- 🔒 Autenticación con JWT
- 💤 CORS habilitado para conexión con el frontend
- ⚡ Desplegado en **Vercel**

---

## 📌 **⚙️ Instalación y Uso**

### **1️⃣ Clonar el repositorio**

```bash
git clone https://github.com/liniconde/victory-craft-backend
cd victory-craft-backend
```

### **2️⃣ Instalar dependencias**

```bash
npm install
```

### **3️⃣ Configuración del Backend**

🖊️ **Crear un archivo `.env`** en la carpeta `backend` con lo siguiente:

```env
PORT=5001
SECRET_KEY=tu_secret
JWT_SECRET=tu_jwt_secret
AWS_ACCESS_KEY_ID = asddadffd
AWS_SECRET_ACCESS_KEY = saddasasada
AWS_REGION=us-east-1
BUCKET_NAME=tu-bucket
MONGO_URI=mongodb+srv://xxxxxxxxx
MONGO_URI_3=mongodb+srv://xxxxxxxxx
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://victory-craft-backend.vercel.app/users/oauth2/google/callback
OAUTH_ALLOWED_REDIRECT_URIS=https://victory-craft-front.vercel.app/auth/callback,https://victory-craft-front-spa.vercel.app/auth/callback,http://localhost:5173/auth/callback
CORS_ALLOWED_ORIGINS=https://victory-craft-front.vercel.app,https://victory-craft-front-spa.vercel.app,http://localhost:5173
ANALYSIS_JOBS_SQS_URL=https://sqs.us-east-1.amazonaws.com/<account-id>/<queue-name>
```

### **4️⃣ Ejecutar el backend**

```bash
npm run dev
```

El backend se ejecutará en `http://localhost:5001`

### **5️⃣ Ver Swagger visualmente con Docker**

Se agregaron:
- `Dockerfile` para el backend.
- `docker-compose.yml` para levantar backend + Swagger UI.
- `contract/swagger.yaml` como contrato OpenAPI.

Ejecuta:

```bash
docker compose up --build
```

Luego abre:
- Backend: `http://localhost:5001`
- Swagger UI: `http://localhost:8080`

Para detener:

```bash
docker compose down
```

### **6️⃣ Revisar esquema visual de base de datos**

Se agregó el diagrama ER basado en los modelos actuales:

- `contract/database-schema.md`

Si usas VS Code, abre ese archivo y usa "Open Preview" para ver el diagrama Mermaid renderizado.

### **7️⃣ OAuth 2.0 con Google**

#### Endpoints

- Inicio OAuth:
  - `GET /users/oauth2/google?redirect_uri=<FRONT_CALLBACK>&return_to=<PATH>`
- Callback:
  - `GET /users/oauth2/google/callback`

#### Flujo esperado con frontend

1. Front redirige a:
   - `/users/oauth2/google?redirect_uri=https://victory-craft-front.vercel.app/auth/callback&return_to=/fields/videos`
2. Backend redirige a Google.
3. Google retorna al callback del backend.
4. Backend redirige al frontend:
   - Exito: `https://victory-craft-front.vercel.app/auth/callback?token=<JWT_APP>&return_to=/fields/videos`
   - Error: `https://victory-craft-front.vercel.app/auth/callback?error=<CODE>`

#### Google Console (OAuth Client)

- Authorized redirect URI:
  - `https://victory-craft-backend.vercel.app/users/oauth2/google/callback`
- Authorized JavaScript origins:
  - `https://victory-craft-front.vercel.app`
  - `https://victory-craft-front-spa.vercel.app`
  - `http://localhost:5173`

### **8️⃣ Estadísticas de video unificadas (manual + AI)**

#### Endpoints

- Upsert stats:
  - `POST /video-stats`
- Obtener stats:
  - `GET /video-stats/:videoId`
- Actualizar stats:
  - `PUT /video-stats/:videoId`

#### cURL crear/actualizar

```bash
curl -X POST "http://localhost:5001/video-stats" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "67d123abc4567890def12345",
    "sportType": "football",
    "teamAName": "Team A",
    "teamBName": "Team B",
    "events": [
      { "id": "evt-1", "time": 35.2, "type": "pass", "team": "A", "note": "Salida limpia" },
      { "id": "evt-2", "time": 48.7, "type": "shot", "team": "B" },
      { "id": "evt-3", "time": 61.4, "type": "goal", "team": "A" }
    ],
    "manualStats": {
      "passes": { "total": 999, "teamA": 999, "teamB": 999 }
    }
  }'
```

#### cURL consultar

```bash
curl "http://localhost:5001/video-stats/67d123abc4567890def12345"
```

> Nota: payload legacy con `statistics.sportType` sigue soportado.
> Si se envian `events`, backend recalcula `matchStats` y `teams` para consistencia.

### **9️⃣ Jobs de análisis y notificaciones**

#### Crear job de análisis por prompt (encola en SQS)

```bash
curl -X POST "http://localhost:5001/videos/67d123abc4567890def12345/analyzeVideo" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "agent_prompt",
    "prompt": "Resume las jugadas clave del video",
    "input": { "language": "es" }
  }'
```

#### Polling de estado del job

```bash
curl "http://localhost:5001/videos/67d123abc4567890def12345/analyzeVideo/<JOB_ID>/status"
```

#### Listar análisis exitosos por video

```bash
curl "http://localhost:5001/videos/67d123abc4567890def12345/analysis-results?page=1&limit=20"
```

#### Levantar consumidor de jobs de análisis

```bash
npm run worker:analysis-jobs
```

El consumidor:
- escucha `ANALYSIS_JOBS_SQS_URL`
- cambia estado del job a `in_progress` al tomar mensaje
- ejecuta análisis con Gemini usando el prompt del evento
- guarda `output` y estado final (`completed` o `failed`)
- crea notificación de finalización o error

#### Listar notificaciones

```bash
curl "http://localhost:5001/notifications?limit=50"
```

#### Borrar notificación consumida

```bash
curl -X DELETE "http://localhost:5001/notifications/<NOTIFICATION_ID>"
```

---

## 📌 **🛠️ Contribuir**

✨ ¡Las contribuciones son bienvenidas! 🚀  
Si deseas mejorar este proyecto:

1. **Forkea** el repositorio.
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`).
3. Haz tus cambios y **confirma los commits** (`git commit -m "Agregada nueva funcionalidad"`).
4. Haz un **push** a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un **Pull Request** en GitHub.

---

## 📌 **📄 Licencia**

Este proyecto está bajo la **Licencia MIT**. Puedes usarlo y modificarlo libremente.

---

💡 **Desarrollado con ❤️ por [Tu Nombre](https://github.com/liniconde)**
