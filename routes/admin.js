import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('is_active', true);

    const { data: products } = await supabase
      .from('products')
      .select('id, status');

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, order_status, created_at');

    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('id, status');

    const stats = {
      total_users: users?.length || 0,
      users_by_type: {
        agricultores: users?.filter(u => u.user_type === 'agricultor').length || 0,
        compradores: users?.filter(u => u.user_type === 'comprador').length || 0,
        transportadores: users?.filter(u => u.user_type === 'transportador').length || 0,
        fornecedores: users?.filter(u => u.user_type === 'fornecedor').length || 0
      },
      total_products: products?.length || 0,
      available_products: products?.filter(p => p.status === 'disponivel').length || 0,
      total_orders: orders?.length || 0,
      pending_orders: orders?.filter(o => o.order_status === 'pendente').length || 0,
      completed_orders: orders?.filter(o => o.order_status === 'entregue').length || 0,
      total_revenue: orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0,
      active_deliveries: deliveries?.filter(d => d.status === 'em_transito').length || 0
    };

    const recentOrders = orders
      ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10) || [];

    res.json({ stats, recentOrders });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

router.get('/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { user_type, is_verified } = req.query;

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_type) {
      query = query.eq('user_type', user_type);
    }

    if (is_verified !== undefined) {
      query = query.eq('is_verified', is_verified === 'true');
    }

    const { data: users, error } = await query;

    if (error) throw error;

    res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.put('/users/:id/verify', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { is_verified } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_verified })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Usuário atualizado', user });
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    res.status(500).json({ error: 'Erro ao verificar usuário' });
  }
});

router.put('/users/:id/toggle-active', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { is_active } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Status atualizado', user });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

router.get('/transactions', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users (
          full_name,
          email,
          user_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ transactions });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

router.get('/reports/monthly', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : 0, 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const { data: newUsers } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const report = {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      total_orders: orders?.length || 0,
      total_revenue: orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0,
      new_users: newUsers?.length || 0,
      average_order_value: orders?.length
        ? (orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) / orders.length).toFixed(2)
        : 0
    };

    res.json({ report });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

export default router;
