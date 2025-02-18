import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import concertRoutes from './routes/concertRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de conciertos
app.use("/api/concerts", concertRoutes);


// Conectar con MongoDB
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error(err));

app.use('/concerts', concertRoutes);

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
