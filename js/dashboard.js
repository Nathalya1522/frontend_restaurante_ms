// URLs de los microservicios
const RESERVAS_URL = 'http://127.0.0.1:8002';
const PRODUCTOS_URL = 'http://127.0.0.1:8003';
const PEDIDOS_URL = 'http://127.0.0.1:8004';

// Verificar sesión
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!token) {
    window.location.href = '../index.html';
}

// Mostrar nombre del usuario
document.getElementById('bienvenida').textContent = `Bienvenido, ${usuario.nombre}`;

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        // Total de mesas disponibles
        const resMesas = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await resMesas.json();
        const mesasDisponibles = mesas.filter(m => m.estado === 'disponible').length;
        document.getElementById('totalMesas').textContent = mesasDisponibles;

        // Total de reservas pendientes
        const resReservas = await fetch(`${RESERVAS_URL}/reservas?estado=pendiente`, {
            headers: { 'Authorization': token }
        });
        const reservas = await resReservas.json();
        document.getElementById('totalReservas').textContent = reservas.length;

        // Total de productos
        const resProductos = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        const productos = await resProductos.json();
        document.getElementById('totalProductos').textContent = productos.length;

        // Total de pedidos activos
        const resPedidos = await fetch(`${PEDIDOS_URL}/pedidos?estado=pendiente`, {
            headers: { 'Authorization': token }
        });
        const pedidos = await resPedidos.json();
        document.getElementById('totalPedidos').textContent = pedidos.length;

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

cargarEstadisticas();