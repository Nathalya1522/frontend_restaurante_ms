const RESERVAS_URL  = 'http://127.0.0.1:8002';
const PRODUCTOS_URL = 'http://127.0.0.1:8003';
const PEDIDOS_URL   = 'http://127.0.0.1:8004';

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

let todosPedidos = [];

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

document.getElementById('btnGuardarPedido').addEventListener('click', guardarPedido);
document.getElementById('btnLimpiarPedido').addEventListener('click', limpiarFormulario);
document.getElementById('filtroEstado').addEventListener('change', filtrarPedidos);

async function cargarMesas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await response.json();
        const select = document.getElementById('mesa_id');
        select.innerHTML = '<option value="">Selecciona una mesa</option>';
        mesas.forEach(function(m) {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = `Mesa ${m.numero}`;
            select.appendChild(option);
        });
    } catch (e) { /* sin conexión */ }
}

async function cargarProductos() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        const productos = await response.json();
        const select = document.getElementById('producto_id');
        select.innerHTML = '<option value="">Selecciona un producto</option>';
        productos.filter(function(p) { return p.disponible; }).forEach(function(p) {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.nombre} — $${Number(p.precio).toLocaleString()}`;
            select.appendChild(option);
        });
    } catch (e) { /* sin conexión */ }
}

async function cargarPedidos() {
    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos`, {
            headers: { 'Authorization': token }
        });
        todosPedidos = await response.json();
        mostrarPedidos(todosPedidos);
    } catch (error) {
        document.getElementById('listaPedidos').innerHTML = '<p class="mensaje-error">Error al cargar los pedidos.</p>';
    }
}

function filtrarPedidos() {
    const estado = document.getElementById('filtroEstado').value;
    const filtrados = estado
        ? todosPedidos.filter(function(p) { return p.estado === estado; })
        : todosPedidos;
    mostrarPedidos(filtrados);
}

function obtenerClaseBadge(estado) {
    var clases = {
        pendiente:      'badge-pendiente',
        en_preparacion: 'badge-preparacion',
        entregado:      'badge-entregado',
        pagado:         'badge-disponible',
        cancelado:      'badge-cancelada'
    };
    return clases[estado] || 'badge-pendiente';
}

function mostrarPedidos(pedidos) {
    const lista = document.getElementById('listaPedidos');
    if (pedidos.length === 0) {
        lista.innerHTML = '<p>No hay pedidos que mostrar.</p>';
        return;
    }
    lista.innerHTML = pedidos.map(function(p) {
        return `
            <div class="card">
                <h3>Pedido #${p.id}</h3>
                <p>🪑 Mesa: ${p.mesa ? p.mesa.numero : 'N/A'}</p>
                <p>🍽️ ${p.producto ? p.producto.nombre : 'N/A'}</p>
                <p>🔢 Cantidad: ${p.cantidad}</p>
                ${p.observaciones ? `<p>📝 ${p.observaciones}</p>` : ''}
                <span class="badge ${obtenerClaseBadge(p.estado)}">${p.estado}</span>
                <div class="card-actions">
                    <button class="btn-editar" data-id="${p.id}" data-estado="${p.estado}">Avanzar estado</button>
                    <button class="btn-eliminar" data-id="${p.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#listaPedidos .btn-editar').forEach(function(btn) {
        btn.addEventListener('click', function() {
            cambiarEstado(Number(btn.dataset.id), btn.dataset.estado);
        });
    });
    document.querySelectorAll('#listaPedidos .btn-eliminar').forEach(function(btn) {
        btn.addEventListener('click', function() { eliminarPedido(Number(btn.dataset.id)); });
    });
}

async function guardarPedido() {
    const mesa_id      = document.getElementById('mesa_id').value;
    const producto_id  = document.getElementById('producto_id').value;
    const cantidad     = document.getElementById('cantidad').value;
    const observaciones = document.getElementById('observaciones').value;
    const contenedor   = document.getElementById('mensajePedido');

    if (!mesa_id || !producto_id || !cantidad) {
        contenedor.innerHTML = '<div class="mensaje-error">Mesa, producto y cantidad son obligatorios.</div>';
        return;
    }

    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ mesa_id, producto_id, cantidad, observaciones })
        });
        const data = await response.json();

        if (data.success) {
            contenedor.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            limpiarFormulario();
            cargarPedidos();
        } else {
            contenedor.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="mensaje-error">Error al crear el pedido.</div>';
    }
}

var estadoSiguiente = {
    pendiente:      'en_preparacion',
    en_preparacion: 'entregado',
    entregado:      'pagado',
    pagado:         'pagado',
    cancelado:      'cancelado'
};

async function cambiarEstado(id, estadoActual) {
    var nuevo = estadoSiguiente[estadoActual];
    if (!nuevo || nuevo === estadoActual) {
        alert('Este pedido ya está en estado final.');
        return;
    }

    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ estado: nuevo })
        });
        const data = await response.json();
        if (data.success) {
            cargarPedidos();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al actualizar el pedido.');
    }
}

async function eliminarPedido(id) {
    if (!confirm('¿Eliminar este pedido?')) { return; }

    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        if (data.success) {
            cargarPedidos();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al eliminar el pedido.');
    }
}

function limpiarFormulario() {
    document.getElementById('mesa_id').value      = '';
    document.getElementById('producto_id').value  = '';
    document.getElementById('cantidad').value     = '1';
    document.getElementById('observaciones').value = '';
    document.getElementById('mensajePedido').innerHTML = '';
}

cargarMesas();
cargarProductos();
cargarPedidos();