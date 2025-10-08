import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      user_type,
      phone,
      address,
      city,
      province,
      language
    } = req.body;

    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        full_name,
        user_type,
        phone,
        address,
        city,
        province,
        language: language || 'pt'
      }])
      .select()
      .single();

    if (error) throw error;

    if (user_type === 'agricultor') {
      await supabase.from('farmers').insert([{ user_id: newUser.id }]);
    } else if (user_type === 'transportador') {
      await supabase.from('transporters').insert([{ user_id: newUser.id }]);
    } else if (user_type === 'fornecedor') {
      await supabase.from('suppliers').insert([{ user_id: newUser.id }]);
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, user_type: newUser.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        user_type: newUser.user_type
      },
      token
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta inativa' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        language: user.language
      },
      token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;
