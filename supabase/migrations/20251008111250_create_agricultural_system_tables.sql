/*
  # Sistema Agrícola Digital - Database Schema
  
  ## Descrição
  Sistema completo para conectar agricultores, compradores, transportadores e fornecedores
  
  ## Tabelas Criadas
  
  ### 1. users
  - Armazena todos os usuários do sistema
  - Campos: id, email, senha, nome, tipo de usuário, telefone, endereço, idioma preferido
  - Tipos: agricultor, comprador, transportador, fornecedor, admin
  
  ### 2. farmers (agricultores)
  - Informações específicas de agricultores
  - Campos: área da machamba, tipo de produção, localização GPS, documentos
  
  ### 3. products (produtos agrícolas)
  - Produtos publicados pelos agricultores
  - Campos: nome, descrição, preço, quantidade, foto, data colheita, status
  
  ### 4. orders (pedidos)
  - Pedidos de compra
  - Campos: comprador, produtos, total, status, forma de pagamento
  
  ### 5. transporters (transportadores)
  - Dados de transportadores e veículos
  - Campos: tipo de veículo, capacidade, documentos, licença
  
  ### 6. deliveries (entregas)
  - Gerenciamento de entregas
  - Campos: pedido, transportador, origem, destino, status, rota
  
  ### 7. suppliers (fornecedores)
  - Fornecedores de insumos agrícolas
  - Campos: empresa, tipo de produtos fornecidos, catálogo
  
  ### 8. supplier_products (produtos de fornecedores)
  - Catálogo de insumos (sementes, defensivos, fertilizantes)
  - Campos: nome, categoria, preço, estoque, descrição
  
  ### 9. cooperatives (cooperativas)
  - Grupos de agricultores
  - Campos: nome, membros, descrição, localização
  
  ### 10. pest_diagnostics (diagnóstico de pragas)
  - Histórico de diagnósticos via IA
  - Campos: agricultor, imagem, tipo de praga, produto recomendado, data
  
  ### 11. chats (conversas)
  - Sistema de mensagens entre usuários
  - Campos: remetente, destinatário, mensagem, timestamp, idioma
  
  ### 12. transactions (transações financeiras)
  - Histórico de pagamentos e transferências
  - Campos: usuário, tipo, valor, método de pagamento, status
  
  ### 13. weather_alerts (alertas climáticos)
  - Alertas meteorológicos para agricultores
  - Campos: região, tipo de alerta, descrição, data
  
  ## Observações
  - Sistema sem RLS conforme solicitado
  - Todas as tabelas com timestamps automáticos
  - IDs gerados automaticamente com UUID
*/

-- Tabela de usuários principal
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('agricultor', 'comprador', 'transportador', 'fornecedor', 'admin')),
  phone text,
  address text,
  city text,
  province text,
  language text DEFAULT 'pt' CHECK (language IN ('pt', 'sena', 'en')),
  photo_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela específica de agricultores
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  farm_area numeric,
  production_type text,
  latitude numeric,
  longitude numeric,
  documents jsonb,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de produtos agrícolas
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  unit text DEFAULT 'kg',
  harvest_date date,
  photo_url text,
  status text DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'cancelado')),
  order_status text DEFAULT 'pendente' CHECK (order_status IN ('pendente', 'confirmado', 'em_transporte', 'entregue', 'cancelado')),
  delivery_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de transportadores
CREATE TABLE IF NOT EXISTS transporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type text,
  vehicle_plate text,
  capacity numeric,
  license_number text,
  documents jsonb,
  is_available boolean DEFAULT true,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de entregas
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  transporter_id uuid REFERENCES transporters(id),
  origin_address text,
  destination_address text,
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'em_transito', 'entregue', 'cancelado')),
  estimated_delivery timestamptz,
  actual_delivery timestamptz,
  delivery_fee numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_type text,
  description text,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de produtos de fornecedores
CREATE TABLE IF NOT EXISTS supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text CHECK (category IN ('sementes', 'defensivos', 'fertilizantes', 'equipamentos', 'outros')),
  description text,
  price numeric NOT NULL,
  stock_quantity numeric DEFAULT 0,
  unit text,
  photo_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de cooperativas
CREATE TABLE IF NOT EXISTS cooperatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location text,
  leader_id uuid REFERENCES farmers(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela de membros de cooperativas
CREATE TABLE IF NOT EXISTS cooperative_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id uuid REFERENCES cooperatives(id) ON DELETE CASCADE,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(cooperative_id, farmer_id)
);

-- Tabela de diagnóstico de pragas
CREATE TABLE IF NOT EXISTS pest_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  pest_type text,
  severity text,
  recommended_product text,
  recommended_supplier_id uuid REFERENCES suppliers(id),
  diagnosis_result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela de chat
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  language text DEFAULT 'pt',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  transaction_type text CHECK (transaction_type IN ('pagamento', 'recebimento', 'transferencia', 'credito', 'saque')),
  amount numeric NOT NULL,
  payment_method text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'falhou', 'cancelado')),
  reference_id uuid,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de alertas climáticos
CREATE TABLE IF NOT EXISTS weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  province text,
  alert_type text,
  severity text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_products_farmer ON products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver ON chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_transporter ON deliveries(transporter_id);
