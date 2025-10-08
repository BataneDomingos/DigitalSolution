const API_BASE_URL = window.location.origin + '/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

if (!getToken()) {
    window.location.href = '/pages/login.html';
}

const user = getUser();
if (user) {
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userType').textContent = user.user_type.toUpperCase();
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
});

async function loadDashboard() {
    const user = getUser();
    const dashboardContent = document.getElementById('dashboardContent');

    try {
        switch (user.user_type) {
            case 'agricultor':
                await loadFarmerDashboard(dashboardContent);
                break;
            case 'comprador':
                await loadBuyerDashboard(dashboardContent);
                break;
            case 'transportador':
                await loadTransporterDashboard(dashboardContent);
                break;
            case 'fornecedor':
                await loadSupplierDashboard(dashboardContent);
                break;
            case 'admin':
                await loadAdminDashboard(dashboardContent);
                break;
            default:
                dashboardContent.innerHTML = '<p>Dashboard não disponível</p>';
        }
    } catch (error) {
        dashboardContent.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

async function loadFarmerDashboard(container) {
    const response = await fetch(`${API_BASE_URL}/products?farmer=me`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Produtos Publicados</h3>
                <div class="stat-value">${data.products?.length || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Produtos Disponíveis</h3>
                <div class="stat-value">${data.products?.filter(p => p.status === 'disponivel').length || 0}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Meus Produtos</h2>
                <a href="/pages/add-product.html" class="btn-primary">Adicionar Produto</a>
            </div>
            <div id="productsGrid" class="product-grid"></div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Diagnóstico de Pragas</h2>
                <a href="/pages/pest-diagnosis.html" class="btn-primary">Nova Análise</a>
            </div>
            <p>Use nosso assistente inteligente para diagnosticar pragas nas suas plantas</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Cooperativas</h2>
                <a href="/pages/cooperatives.html" class="btn-primary">Ver Cooperativas</a>
            </div>
            <p>Junte-se a uma cooperativa e fortaleça suas vendas</p>
        </div>
    `;

    const productsGrid = document.getElementById('productsGrid');
    if (data.products && data.products.length > 0) {
        productsGrid.innerHTML = data.products.map(product => `
            <div class="product-card">
                <img src="${product.photo_url || 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&w=400'}" class="product-image" alt="${product.name}">
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">${product.price} MT/${product.unit}</p>
                    <p class="product-info">Quantidade: ${product.quantity} ${product.unit}</p>
                    <p class="product-info">Status: ${product.status}</p>
                </div>
            </div>
        `).join('');
    } else {
        productsGrid.innerHTML = '<p>Nenhum produto publicado ainda</p>';
    }
}

async function loadBuyerDashboard(container) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Pedidos Realizados</h3>
                <div class="stat-value">${data.orders?.length || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Pedidos Pendentes</h3>
                <div class="stat-value">${data.orders?.filter(o => o.order_status === 'pendente').length || 0}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Meus Pedidos</h2>
                <a href="/pages/products.html" class="btn-primary">Ver Produtos</a>
            </div>
            <div id="ordersContainer"></div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Fornecedores de Insumos</h2>
                <a href="/pages/suppliers.html" class="btn-primary">Ver Fornecedores</a>
            </div>
            <p>Encontre sementes, defensivos e equipamentos agrícolas</p>
        </div>
    `;

    const ordersContainer = document.getElementById('ordersContainer');
    if (data.orders && data.orders.length > 0) {
        ordersContainer.innerHTML = data.orders.map(order => `
            <div style="border-bottom: 1px solid var(--border-color); padding: 16px 0;">
                <h4>Pedido #${order.id.substring(0, 8)}</h4>
                <p>Total: ${order.total_amount} MT</p>
                <p>Status: ${order.order_status}</p>
                <p>Data: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    } else {
        ordersContainer.innerHTML = '<p>Nenhum pedido realizado ainda</p>';
    }
}

async function loadTransporterDashboard(container) {
    const response = await fetch(`${API_BASE_URL}/transport/my-deliveries`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Entregas Realizadas</h3>
                <div class="stat-value">${data.deliveries?.length || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Entregas Ativas</h3>
                <div class="stat-value">${data.deliveries?.filter(d => d.status === 'em_transito').length || 0}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Minhas Entregas</h2>
                <a href="/pages/deliveries.html" class="btn-primary">Ver Todas</a>
            </div>
            <div id="deliveriesContainer"></div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Entregas Disponíveis</h2>
                <a href="/pages/available-deliveries.html" class="btn-primary">Ver Disponíveis</a>
            </div>
            <p>Aceite entregas e comece a ganhar</p>
        </div>
    `;

    const deliveriesContainer = document.getElementById('deliveriesContainer');
    if (data.deliveries && data.deliveries.length > 0) {
        deliveriesContainer.innerHTML = data.deliveries.slice(0, 5).map(delivery => `
            <div style="border-bottom: 1px solid var(--border-color); padding: 16px 0;">
                <h4>Entrega #${delivery.id.substring(0, 8)}</h4>
                <p>Status: ${delivery.status}</p>
                <p>Destino: ${delivery.destination_address}</p>
                <p>Data: ${new Date(delivery.created_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    } else {
        deliveriesContainer.innerHTML = '<p>Nenhuma entrega ainda</p>';
    }
}

async function loadSupplierDashboard(container) {
    const response = await fetch(`${API_BASE_URL}/supplier/my-products`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Produtos Cadastrados</h3>
                <div class="stat-value">${data.products?.length || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Produtos Disponíveis</h3>
                <div class="stat-value">${data.products?.filter(p => p.is_available).length || 0}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Meus Produtos</h2>
                <a href="/pages/add-supplier-product.html" class="btn-primary">Adicionar Produto</a>
            </div>
            <div id="productsGrid" class="product-grid"></div>
        </div>

        <div class="card">
            <h2>Catálogo de Insumos</h2>
            <p>Sementes, defensivos, fertilizantes e equipamentos</p>
        </div>
    `;

    const productsGrid = document.getElementById('productsGrid');
    if (data.products && data.products.length > 0) {
        productsGrid.innerHTML = data.products.map(product => `
            <div class="product-card">
                <img src="${product.photo_url || 'https://images.pexels.com/photos/2132171/pexels-photo-2132171.jpeg?auto=compress&w=400'}" class="product-image" alt="${product.name}">
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">${product.price} MT</p>
                    <p class="product-info">Estoque: ${product.stock_quantity}</p>
                    <p class="product-info">Categoria: ${product.category}</p>
                </div>
            </div>
        `).join('');
    } else {
        productsGrid.innerHTML = '<p>Nenhum produto cadastrado ainda</p>';
    }
}

async function loadAdminDashboard(container) {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Total Usuários</h3>
                <div class="stat-value">${data.stats?.total_users || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Total Produtos</h3>
                <div class="stat-value">${data.stats?.total_products || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Total Pedidos</h3>
                <div class="stat-value">${data.stats?.total_orders || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Receita Total</h3>
                <div class="stat-value">${data.stats?.total_revenue || 0} MT</div>
            </div>
        </div>

        <div class="card">
            <h2>Usuários por Tipo</h2>
            <p>Agricultores: ${data.stats?.users_by_type?.agricultores || 0}</p>
            <p>Compradores: ${data.stats?.users_by_type?.compradores || 0}</p>
            <p>Transportadores: ${data.stats?.users_by_type?.transportadores || 0}</p>
            <p>Fornecedores: ${data.stats?.users_by_type?.fornecedores || 0}</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Gerenciar Sistema</h2>
            </div>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                <a href="/pages/manage-users.html" class="btn-primary">Gerenciar Usuários</a>
                <a href="/pages/manage-products.html" class="btn-primary">Gerenciar Produtos</a>
                <a href="/pages/reports.html" class="btn-primary">Relatórios</a>
            </div>
        </div>
    `;
}

loadDashboard();
