import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/products', authenticateToken, authorizeRole('fornecedor'), async (req, res) => {
  try {
    const { name, category, description, price, stock_quantity, unit, photo_url } = req.body;

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    const { data: product, error } = await supabase
      .from('supplier_products')
      .insert([{
        supplier_id: supplier.id,
        name,
        category,
        description,
        price,
        stock_quantity,
        unit,
        photo_url
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Produto criado', product });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('supplier_products')
      .select(`
        *,
        suppliers (
          id,
          company_name,
          users (
            phone,
            city,
            province
          )
        )
      `)
      .eq('is_available', true)
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

router.get('/products/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        suppliers (
          id,
          company_name,
          business_type,
          description,
          users (
            phone,
            email,
            city,
            province,
            address
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

router.put('/products/:id', authenticateToken, authorizeRole('fornecedor'), async (req, res) => {
  try {
    const { name, category, description, price, stock_quantity, unit, photo_url, is_available } = req.body;

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: product, error } = await supabase
      .from('supplier_products')
      .update({
        name,
        category,
        description,
        price,
        stock_quantity,
        unit,
        photo_url,
        is_available,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('supplier_id', supplier.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Produto atualizado', product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.get('/my-products', authenticateToken, authorizeRole('fornecedor'), async (req, res) => {
  try {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: products, error } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'sementes', label: 'Sementes' },
      { value: 'defensivos', label: 'Defensivos Agrícolas' },
      { value: 'fertilizantes', label: 'Fertilizantes' },
      { value: 'equipamentos', label: 'Equipamentos' },
      { value: 'outros', label: 'Outros' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

export default router;
