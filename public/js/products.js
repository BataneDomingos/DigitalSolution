const API_BASE_URL = window.location.origin + '/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

const user = getUser();
if (user) {
    document.getElementById('loginLink').style.display = 'none';
} else {
    document.getElementById('dashboardLink').style.display = 'none';
}

let allProducts = [];

async function loadProducts(search = '', category = '') {
    try {
        let url = `${API_BASE_URL}/products?`;
        if (search) url += `search=${search}&`;
        if (category) url += `category=${category}&`;

        const response = await fetch(url);
        const data = await response.json();

        allProducts = data.products || [];
        displayProducts(allProducts);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('productsContainer').innerHTML = `
            <div class="alert alert-error">Erro ao carregar produtos</div>
        `;
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Nenhum produto encontrado</p>';
        return;
    }

    container.innerHTML = `
        <div class="product-grid">
            ${products.map(product => `
                <div class="product-card">
                    <img src="${product.photo_url || 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&w=400'}"
                         class="product-image"
                         alt="${product.name}">
                    <div class="product-content">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">${product.price} MT/${product.unit}</p>
                        <p class="product-info">Quantidade: ${product.quantity} ${product.unit}</p>
                        <p class="product-info">Categoria: ${product.category || 'Não especificada'}</p>
                        ${product.farmers?.users ? `
                            <p class="product-info">Vendedor: ${product.farmers.users.full_name}</p>
                            <p class="product-info">Local: ${product.farmers.users.city || 'N/A'}, ${product.farmers.users.province || 'N/A'}</p>
                        ` : ''}
                        <div class="product-actions">
                            <button class="btn-primary btn-small" onclick="viewProduct('${product.id}')">Ver Detalhes</button>
                            ${user?.user_type === 'comprador' ? `
                                <button class="btn-success btn-small" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <img src="${product.photo_url || 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&w=400'}"
             style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
        <h3>${product.name}</h3>
        <p style="font-size: 24px; font-weight: 700; color: var(--success-color); margin: 16px 0;">
            ${product.price} MT/${product.unit}
        </p>
        <p><strong>Quantidade Disponível:</strong> ${product.quantity} ${product.unit}</p>
        <p><strong>Categoria:</strong> ${product.category || 'Não especificada'}</p>
        ${product.description ? `<p><strong>Descrição:</strong> ${product.description}</p>` : ''}
        ${product.harvest_date ? `<p><strong>Data de Colheita:</strong> ${new Date(product.harvest_date).toLocaleDateString()}</p>` : ''}

        ${product.farmers?.users ? `
            <hr style="margin: 24px 0;">
            <h4>Informações do Vendedor</h4>
            <p><strong>Nome:</strong> ${product.farmers.users.full_name}</p>
            <p><strong>Localização:</strong> ${product.farmers.users.city || 'N/A'}, ${product.farmers.users.province || 'N/A'}</p>
            ${product.farmers.users.phone ? `<p><strong>Telefone:</strong> ${product.farmers.users.phone}</p>` : ''}
        ` : ''}

        ${user?.user_type === 'comprador' ? `
            <button class="btn-success" style="width: 100%; margin-top: 24px;" onclick="addToCart('${product.id}')">
                Adicionar ao Carrinho
            </button>
        ` : ''}
    `;

    document.getElementById('productModal').classList.add('active');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

function addToCart(productId) {
    if (!user || user.user_type !== 'comprador') {
        alert('Apenas compradores podem adicionar produtos ao carrinho');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const product = allProducts.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            name: product.name,
            unit_price: product.price,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Produto adicionado ao carrinho!');
    closeModal();
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const search = e.target.value;
    const category = document.getElementById('categoryFilter').value;
    loadProducts(search, category);
});

document.getElementById('categoryFilter').addEventListener('change', (e) => {
    const search = document.getElementById('searchInput').value;
    const category = e.target.value;
    loadProducts(search, category);
});

document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target.id === 'productModal') {
        closeModal();
    }
});

loadProducts();
