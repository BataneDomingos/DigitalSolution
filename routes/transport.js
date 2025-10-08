import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-delivery', authenticateToken, async (req, res) => {
  try {
    const {
      order_id,
      origin_address,
      destination_address,
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      delivery_fee
    } = req.body;

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .insert([{
        order_id,
        origin_address,
        destination_address,
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng,
        delivery_fee,
        status: 'pendente'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Entrega criada', delivery });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    res.status(500).json({ error: 'Erro ao criar entrega' });
  }
});

router.get('/available', authenticateToken, authorizeRole('transportador'), async (req, res) => {
  try {
    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        orders (
          id,
          total_amount,
          users (
            full_name,
            phone
          )
        )
      `)
      .eq('status', 'pendente')
      .is('transporter_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ deliveries });
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    res.status(500).json({ error: 'Erro ao buscar entregas' });
  }
});

router.post('/:id/accept', authenticateToken, authorizeRole('transportador'), async (req, res) => {
  try {
    const { data: transporter } = await supabase
      .from('transporters')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!transporter) {
      return res.status(404).json({ error: 'Transportador não encontrado' });
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 2);

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .update({
        transporter_id: transporter.id,
        status: 'aceito',
        estimated_delivery: estimatedDelivery.toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('transporters')
      .update({ is_available: false })
      .eq('id', transporter.id);

    res.json({ message: 'Entrega aceita', delivery });
  } catch (error) {
    console.error('Erro ao aceitar entrega:', error);
    res.status(500).json({ error: 'Erro ao aceitar entrega' });
  }
});

router.get('/my-deliveries', authenticateToken, authorizeRole('transportador'), async (req, res) => {
  try {
    const { data: transporter } = await supabase
      .from('transporters')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        orders (
          id,
          total_amount,
          delivery_address,
          users (
            full_name,
            phone
          )
        )
      `)
      .eq('transporter_id', transporter.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ deliveries });
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    res.status(500).json({ error: 'Erro ao buscar entregas' });
  }
});

router.put('/:id/status', authenticateToken, authorizeRole('transportador'), async (req, res) => {
  try {
    const { status } = req.body;

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'entregue') {
      updateData.actual_delivery = new Date().toISOString();

      const { data: delivery } = await supabase
        .from('deliveries')
        .select('transporter_id, order_id')
        .eq('id', req.params.id)
        .single();

      if (delivery) {
        await supabase
          .from('transporters')
          .update({ is_available: true })
          .eq('id', delivery.transporter_id);

        await supabase
          .from('orders')
          .update({ order_status: 'entregue' })
          .eq('id', delivery.order_id);
      }
    }

    const { data: updatedDelivery, error } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Status atualizado', delivery: updatedDelivery });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

router.get('/track/:orderId', async (req, res) => {
  try {
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        transporters (
          id,
          vehicle_type,
          vehicle_plate,
          users (
            full_name,
            phone
          )
        )
      `)
      .eq('order_id', req.params.orderId)
      .single();

    if (error) throw error;

    res.json({ delivery });
  } catch (error) {
    console.error('Erro ao rastrear entrega:', error);
    res.status(500).json({ error: 'Erro ao rastrear entrega' });
  }
});

export default router;
