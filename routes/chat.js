import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const translations = {
  pt: {
    greeting: 'Olá! Como posso ajudá-lo hoje?',
    products_help: 'Para ver produtos disponíveis, visite a página de produtos.',
    weather_help: 'Você pode consultar alertas climáticos na sua região.',
    pest_help: 'Para diagnóstico de pragas, envie uma foto na seção de diagnóstico.'
  },
  en: {
    greeting: 'Hello! How can I help you today?',
    products_help: 'To see available products, visit the products page.',
    weather_help: 'You can check weather alerts in your region.',
    pest_help: 'For pest diagnosis, upload a photo in the diagnosis section.'
  },
  sena: {
    greeting: 'Moni! Ndingakuthandizeni lero?',
    products_help: 'Kuti muone zinthu zomwe zilipo, pitani kutsamba lazinthu.',
    weather_help: 'Mukhoza kuona makani anyengo kudera lanu.',
    pest_help: 'Kuti muzindikire tizilombo, tumizani chithunzi patsamba yodziwitsira.'
  }
};

router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, message, language } = req.body;

    if (!receiver_id || !message) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        message,
        language: language || 'pt'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Mensagem enviada', chat });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { data: sentMessages } = await supabase
      .from('chats')
      .select('receiver_id, users!chats_receiver_id_fkey(id, full_name, photo_url)')
      .eq('sender_id', req.user.id);

    const { data: receivedMessages } = await supabase
      .from('chats')
      .select('sender_id, users!chats_sender_id_fkey(id, full_name, photo_url)')
      .eq('receiver_id', req.user.id);

    const conversationsMap = new Map();

    sentMessages?.forEach(msg => {
      if (msg.users) {
        conversationsMap.set(msg.receiver_id, msg.users);
      }
    });

    receivedMessages?.forEach(msg => {
      if (msg.users && !conversationsMap.has(msg.sender_id)) {
        conversationsMap.set(msg.sender_id, msg.users);
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const { data: messages, error } = await supabase
      .from('chats')
      .select(`
        *,
        sender:users!chats_sender_id_fkey(id, full_name, photo_url),
        receiver:users!chats_receiver_id_fkey(id, full_name, photo_url)
      `)
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    await supabase
      .from('chats')
      .update({ is_read: true })
      .eq('receiver_id', req.user.id)
      .eq('sender_id', otherUserId);

    res.json({ messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

router.post('/chatbot', async (req, res) => {
  try {
    const { message, language } = req.body;
    const lang = language || 'pt';
    const msgs = translations[lang];

    let response = msgs.greeting;

    const msgLower = message.toLowerCase();

    if (msgLower.includes('produto') || msgLower.includes('product') || msgLower.includes('zinthu')) {
      response = msgs.products_help;
    } else if (msgLower.includes('clima') || msgLower.includes('weather') || msgLower.includes('nyengo')) {
      response = msgs.weather_help;
    } else if (msgLower.includes('praga') || msgLower.includes('pest') || msgLower.includes('tizilombo')) {
      response = msgs.pest_help;
    }

    res.json({ response });
  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ error: 'Erro no chatbot' });
  }
});

router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('id', { count: 'exact' })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ unread_count: data.length });
  } catch (error) {
    console.error('Erro ao contar mensagens:', error);
    res.status(500).json({ error: 'Erro ao contar mensagens' });
  }
});

export default router;
