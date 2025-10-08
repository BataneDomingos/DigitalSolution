import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { name, description, category, price, quantity, unit, harvest_date, photo_url } = req.body;

    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!farmer) {
      return res.status(404).json({ error: 'Agricultor não encontrado' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        farmer_id: farmer.id,
        name,
        description,
        category,
        price,
        quantity,
        unit: unit || 'kg',
        harvest_date,
        photo_url
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Produto criado com sucesso', product });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, province, search, status } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        farmers (
          id,
          user_id,
          farm_area,
          production_type,
          users (
            id,
            full_name,
            city,
            province,
            phone
          )
        )
      `)
      .eq('status', status || 'disponivel')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        farmers (
          id,
          user_id,
          farm_area,
          production_type,
          users (
            id,
            full_name,
            city,
            province,
            phone
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ product });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

router.put('/:id', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { name, description, category, price, quantity, unit, harvest_date, photo_url, status } = req.body;

    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: product, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        category,
        price,
        quantity,
        unit,
        harvest_date,
        photo_url,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('farmer_id', farmer.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Produto atualizado', product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.delete('/:id', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('farmer_id', farmer.id);

    if (error) throw error;

    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
