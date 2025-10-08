const API_BASE_URL = window.location.origin + '/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
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
