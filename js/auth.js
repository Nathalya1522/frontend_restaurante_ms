const AUTH_URL = 'http://127.0.0.1:8001';

if (localStorage.getItem('token')) {
    window.location.href = 'pages/dashboard.html';
}

document.getElementById('formLogin').addEventListener('submit', async function(e) {
    e.preventDefault();

    const usuario    = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const contenedor = document.getElementById('mensaje');

    contenedor.innerHTML = '<div class="mensaje-exito">Iniciando sesión...</div>';

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            contenedor.innerHTML = '<div class="mensaje-exito">Login exitoso. Redirigiendo...</div>';
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 800);
        } else {
            contenedor.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="mensaje-error">Error al conectar con el servidor.</div>';
    }
});