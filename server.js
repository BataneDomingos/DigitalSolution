import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import chatRoutes from './routes/chat.js';
import pestRoutes from './routes/pest.js';
import transportRoutes from './routes/transport.js';
import supplierRoutes from './routes/supplier.js';
import cooperativeRoutes from './routes/cooperative.js';
import adminRoutes from './routes/admin.js';
import weatherRoutes from './routes/weather.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/cooperative', cooperativeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌾 Sistema Agrícola Digital rodando em http://localhost:${PORT}`);
});
