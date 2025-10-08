import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

const pestDatabase = [
  {
    name: 'Lagarta do Cartucho',
    keywords: ['lagarta', 'folha', 'buraco', 'milho'],
    severity: 'alta',
    recommended_product: 'Inseticida biológico Bacillus thuringiensis',
    description: 'Praga comum em milho, causa danos significativos nas folhas'
  },
  {
    name: 'Mosca Branca',
    keywords: ['mosca', 'branca', 'tomate', 'amarelo'],
    severity: 'média',
    recommended_product: 'Óleo de Neem',
    description: 'Inseto sugador que causa amarelecimento das folhas'
  },
  {
    name: 'Pulgão',
    keywords: ['pulgão', 'verde', 'pequeno', 'folha'],
    severity: 'média',
    recommended_product: 'Sabão potássico',
    description: 'Inseto pequeno que suga seiva das plantas'
  },
  {
    name: 'Ferrugem',
    keywords: ['ferrugem', 'mancha', 'laranja', 'café'],
    severity: 'alta',
    recommended_product: 'Fungicida à base de cobre',
    description: 'Doença fúngica que causa manchas alaranjadas'
  },
  {
    name: 'Besouro',
    keywords: ['besouro', 'duro', 'preto', 'raiz'],
    severity: 'média',
    recommended_product: 'Inseticida natural piretróide',
    description: 'Inseto que ataca raízes e folhas'
  }
];

function analyzePestFromImage(imageUrl, description) {
  const descLower = description ? description.toLowerCase() : '';

  for (const pest of pestDatabase) {
    for (const keyword of pest.keywords) {
      if (descLower.includes(keyword)) {
        return pest;
      }
    }
  }

  return {
    name: 'Não identificado',
    severity: 'desconhecida',
    recommended_product: 'Consulte um agrônomo',
    description: 'Não foi possível identificar a praga automaticamente'
  };
}

router.post('/diagnose', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { image_url, description } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Imagem é obrigatória' });
    }

    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!farmer) {
      return res.status(404).json({ error: 'Agricultor não encontrado' });
    }

    const diagnosisResult = analyzePestFromImage(image_url, description);

    const { data: suppliers } = await supabase
      .from('supplier_products')
      .select('id, name, supplier_id, suppliers(company_name)')
      .ilike('name', `%${diagnosisResult.recommended_product.split(' ')[0]}%`)
      .limit(1);

    const supplierId = suppliers && suppliers.length > 0 ? suppliers[0].supplier_id : null;

    const { data: diagnostic, error } = await supabase
      .from('pest_diagnostics')
      .insert([{
        farmer_id: farmer.id,
        image_url,
        pest_type: diagnosisResult.name,
        severity: diagnosisResult.severity,
        recommended_product: diagnosisResult.recommended_product,
        recommended_supplier_id: supplierId,
        diagnosis_result: diagnosisResult
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Diagnóstico realizado',
      diagnostic: {
        ...diagnostic,
        supplier_info: suppliers && suppliers.length > 0 ? suppliers[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao diagnosticar:', error);
    res.status(500).json({ error: 'Erro ao realizar diagnóstico' });
  }
});

router.get('/history', authenticateToken, authorizeRole('agricultor'), async (req, res) => {
  try {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: diagnostics, error } = await supabase
      .from('pest_diagnostics')
      .select(`
        *,
        suppliers (
          id,
          company_name,
          users (
            phone
          )
        )
      `)
      .eq('farmer_id', farmer.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ diagnostics });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

router.get('/common-pests', async (req, res) => {
  try {
    res.json({ pests: pestDatabase });
  } catch (error) {
    console.error('Erro ao buscar pragas:', error);
    res.status(500).json({ error: 'Erro ao buscar pragas' });
  }
});

export default router;
