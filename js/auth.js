// URL base del microservicio de autenticación
const AUTH_URL = 'http://127.0.0.1:8001';

// Verificar si ya hay sesión activa
if (localStorage.getItem('token')) {
    window.location.href = 'pages/dashboard.html';
}

// Manejar el formulario de login
document.getElementById('formLogin').addEventListener('submit', async function(e) {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const mensaje = document.getElementById('mensaje');

    // Mostrar loading
    mensaje.innerHTML = '<div class="mensaje-exito">Iniciando sesión...</div>';

    try {
        // Enviar petición al microservicio ms-auth
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await response.json();

        if (data.success) {
            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // Mostrar mensaje de éxito
            mensaje.innerHTML = '<div class="mensaje-exito">Login exitoso. Redirigiendo...</div>';

            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1000);
        } else {
            mensaje.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        mensaje.innerHTML = '<div class="mensaje-error">Error al conectar con el servidor</div>';
    }
});