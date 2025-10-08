const API_BASE_URL = window.location.origin + '/api';

const urlParams = new URLSearchParams(window.location.search);
const typeParam = urlParams.get('type');
if (typeParam) {
    document.getElementById('user_type').value = typeParam;
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        full_name: document.getElementById('full_name').value,
        user_type: document.getElementById('user_type').value,
        phone: document.getElementById('phone').value,
        city: document.getElementById('city').value,
        province: document.getElementById('province').value,
        address: document.getElementById('address').value,
        language: document.getElementById('language').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao registrar');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.textContent = 'Conta criada com sucesso! Redirecionando...';
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
        }, 1500);

    } catch (error) {
        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.textContent = error.message;
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
    }
});
