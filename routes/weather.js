import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/alerts', async (req, res) => {
  try {
    const { province } = req.query;

    let query = supabase
      .from('weather_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (province) {
      query = query.eq('province', province);
    }

    const { data: alerts, error } = await query;

    if (error) throw error;

    res.json({ alerts });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas climáticos' });
  }
});

router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const { region, province, alert_type, severity, description, start_date, end_date } = req.body;

    const { data: alert, error } = await supabase
      .from('weather_alerts')
      .insert([{
        region,
        province,
        alert_type,
        severity,
        description,
        start_date,
        end_date
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Alerta criado', alert });
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

router.get('/forecast/:province', async (req, res) => {
  try {
    const { province } = req.params;

    const mockForecast = {
      province,
      temperature: Math.floor(Math.random() * 15) + 20,
      humidity: Math.floor(Math.random() * 40) + 50,
      precipitation_chance: Math.floor(Math.random() * 100),
      wind_speed: Math.floor(Math.random() * 20) + 5,
      condition: ['Ensolarado', 'Parcialmente nublado', 'Nublado', 'Chuvoso'][Math.floor(Math.random() * 4)],
      forecast_date: new Date().toISOString()
    };

    res.json({ forecast: mockForecast });
  } catch (error) {
    console.error('Erro ao buscar previsão:', error);
    res.status(500).json({ error: 'Erro ao buscar previsão' });
  }
});

export default router;
