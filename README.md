# 🎼 Ruta de Conciertos Clásicos en Barcelona 🎻

📍 **Descubre, organiza y asiste a los mejores conciertos de música clásica en Barcelona con nuestra plataforma interactiva.**  
Este proyecto permite visualizar eventos en un mapa, gestionarlos desde un calendario, explorar estadísticas en gráficos y acceder a información detallada sobre cada concierto.

---

## 📌 **🔗 Demo en Producción**

👉 [Ruta de Conciertos - Vercel](https://sprint8backend.vercel.app/)

---

## 📌 **🚀 Características**

✅ **Mapa Interactivo:** Muestra conciertos con marcadores en un mapa de Barcelona.  
✅ **Calendario Dinámico:** Permite agregar y eliminar eventos fácilmente.  
✅ **Gráficos y Estadísticas:** Visualiza tendencias de asistencia en gráficos interactivos.  
✅ **CRUD de Conciertos:** Permite crear, actualizar y eliminar conciertos desde el backend.  
✅ **Filtros por Estaciones:** Filtra conciertos por temporada (primavera, verano, otoño, invierno).  
✅ **Diseño Responsivo:** Adaptado para escritorio y dispositivos móviles.

---

## 📌 **📦 Tecnologías Utilizadas**

### **Frontend 🖥️**

- 🚀 React + TypeScript + Vite
- 🎨 Tailwind CSS
- 📍 Mapbox GL
- 📆 FullCalendar
- 📊 Chart.js
- ⚡ Axios para consumir la API

### **Backend 🛠️**

- 🏗️ Node.js + Express
- 📜 TypeScript
- 🗄️ MongoDB + Mongoose
- 🔄 CORS habilitado para conexión con el frontend
- 🚀 Desplegado en **Vercel**

---

## 📌 **⚙️ Instalación y Uso**

### **1️⃣ Clonar el repositorio**

```bash
git clone https://github.com/liniconde/SPRINT8Backend
cd SPRINT8Backend
```

### **2️⃣ Configuración del Backend**

```bash
cd backend
npm install
```

✏️ **Crear un archivo `.env`** en la carpeta `backend` con lo siguiente:

```env
MONGO_URI=tu_url_de_mongodb
PORT=5001
```

📌 **Ejecutar el servidor backend**:

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:5001`

---

## 📌 **🛠️ Rutas de la API**

📌 **Base URL**: `https://tu-backend.vercel.app/api/concerts`

| Método | Ruta            | Descripción                  |
| ------ | --------------- | ---------------------------- |
| GET    | `/concerts`     | Obtiene todos los conciertos |
| GET    | `/concerts/:id` | Obtiene un concierto por ID  |
| POST   | `/concerts`     | Crea un nuevo concierto      |
| PUT    | `/concerts/:id` | Actualiza un concierto       |
| DELETE | `/concerts/:id` | Elimina un concierto         |

---

## 📌 **🛠️ Contribuir**

¡Las contribuciones son bienvenidas! 🚀  
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

💡 **Desarrollado con ❤️ por Linibeth Conde (https://github.com/liniconde)**
