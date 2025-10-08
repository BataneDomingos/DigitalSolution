import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole('comprador'), async (req, res) => {
  try {
    const { items, payment_method, delivery_address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    let total_amount = 0;
    items.forEach(item => {
      total_amount += item.quantity * item.unit_price;
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        buyer_id: req.user.id,
        total_amount,
        payment_method,
        delivery_address
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({
            quantity: product.quantity - item.quantity,
            status: (product.quantity - item.quantity) <= 0 ? 'vendido' : 'disponivel'
          })
          .eq('id', item.product_id);
      }
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        users (
          id,
          full_name,
          phone
        ),
        order_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products (
            id,
            name,
            photo_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (req.user.user_type === 'comprador') {
      query = query.eq('buyer_id', req.user.id);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    res.json({ orders });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (
          id,
          full_name,
          phone,
          address
        ),
        order_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products (
            id,
            name,
            photo_url,
            farmers (
              users (
                full_name,
                phone
              )
            )
          )
        ),
        deliveries (
          id,
          status,
          estimated_delivery,
          actual_delivery,
          transporters (
            users (
              full_name,
              phone
            ),
            vehicle_type,
            vehicle_plate
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ order });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { payment_status, order_status } = req.body;

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status,
        order_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Status atualizado', order });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

export default router;
