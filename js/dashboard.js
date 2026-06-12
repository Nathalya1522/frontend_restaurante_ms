const RESERVAS_URL  = 'http://127.0.0.1:8002';
const PRODUCTOS_URL = 'http://127.0.0.1:8003';
const PEDIDOS_URL   = 'http://127.0.0.1:8004';

const token   = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!token) {
    window.location.href = '../index.html';
}

if (usuario) {
    document.getElementById('bienvenida').textContent = `Bienvenido, ${usuario.nombre} 👋`;
}

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

async function cargarEstadisticas() {
    try {
        const resMesas = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        if (resMesas.ok) {
            const mesas = await resMesas.json();
            const disponibles = mesas.filter(function(m) { return m.estado === 'disponible'; }).length;
            document.getElementById('totalMesas').textContent = disponibles;
        }
    } catch (e) { /* microservicio no disponible */ }

    try {
        const resReservas = await fetch(`${RESERVAS_URL}/reservas?estado=pendiente`, {
            headers: { 'Authorization': token }
        });
        if (resReservas.ok) {
            const reservas = await resReservas.json();
            document.getElementById('totalReservas').textContent = reservas.length;
        }
    } catch (e) { /* microservicio no disponible */ }

    try {
        const resProductos = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        if (resProductos.ok) {
            const productos = await resProductos.json();
            document.getElementById('totalProductos').textContent = productos.length;
        }
    } catch (e) { /* microservicio no disponible */ }

    try {
        const resPedidos = await fetch(`${PEDIDOS_URL}/pedidos?estado=pendiente`, {
            headers: { 'Authorization': token }
        });
        if (resPedidos.ok) {
            const pedidos = await resPedidos.json();
            document.getElementById('totalPedidos').textContent = pedidos.length;
        }
    } catch (e) { /* microservicio no disponible */ }
}

cargarEstadisticas();