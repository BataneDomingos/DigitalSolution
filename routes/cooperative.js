import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { name, description, location } = req.body;

    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!farmer) {
      return res.status(404).json({ error: 'Agricultor não encontrado' });
    }

    const { data: cooperative, error } = await supabase
      .from('cooperatives')
      .insert([{
        name,
        description,
        location,
        leader_id: farmer.id
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('cooperative_members')
      .insert([{
        cooperative_id: cooperative.id,
        farmer_id: farmer.id
      }]);

    res.status(201).json({ message: 'Cooperativa criada', cooperative });
  } catch (error) {
    console.error('Erro ao criar cooperativa:', error);
    res.status(500).json({ error: 'Erro ao criar cooperativa' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { data: cooperatives, error } = await supabase
      .from('cooperatives')
      .select(`
        *,
        leader:farmers!cooperatives_leader_id_fkey(
          id,
          users(
            full_name,
            phone
          )
        ),
        cooperative_members(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ cooperatives });
  } catch (error) {
    console.error('Erro ao buscar cooperativas:', error);
    res.status(500).json({ error: 'Erro ao buscar cooperativas' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: cooperative, error } = await supabase
      .from('cooperatives')
      .select(`
        *,
        leader:farmers!cooperatives_leader_id_fkey(
          id,
          users(
            full_name,
            phone
          )
        ),
        cooperative_members(
          id,
          joined_at,
          farmers(
            id,
            farm_area,
            production_type,
            users(
              full_name,
              phone,
              city
            )
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ cooperative });
  } catch (error) {
    console.error('Erro ao buscar cooperativa:', error);
    res.status(500).json({ error: 'Erro ao buscar cooperativa' });
  }
});

router.post('/:id/join', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!farmer) {
      return res.status(404).json({ error: 'Agricultor não encontrado' });
    }

    const { data: existing } = await supabase
      .from('cooperative_members')
      .select('id')
      .eq('cooperative_id', req.params.id)
      .eq('farmer_id', farmer.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Já é membro desta cooperativa' });
    }

    const { data: membership, error } = await supabase
      .from('cooperative_members')
      .insert([{
        cooperative_id: req.params.id,
        farmer_id: farmer.id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Entrou na cooperativa', membership });
  } catch (error) {
    console.error('Erro ao entrar na cooperativa:', error);
    res.status(500).json({ error: 'Erro ao entrar na cooperativa' });
  }
});

router.delete('/:cooperativeId/leave', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { error } = await supabase
      .from('cooperative_members')
      .delete()
      .eq('cooperative_id', req.params.cooperativeId)
      .eq('farmer_id', farmer.id);

    if (error) throw error;

    res.json({ message: 'Saiu da cooperativa' });
  } catch (error) {
    console.error('Erro ao sair da cooperativa:', error);
    res.status(500).json({ error: 'Erro ao sair da cooperativa' });
  }
});

router.get('/my/memberships', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: memberships, error } = await supabase
      .from('cooperative_members')
      .select(`
        *,
        cooperatives(
          id,
          name,
          description,
          location
        )
      `)
      .eq('farmer_id', farmer.id);

    if (error) throw error;

    res.json({ memberships });
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({ error: 'Erro ao buscar membros' });
  }
});

export default router;
