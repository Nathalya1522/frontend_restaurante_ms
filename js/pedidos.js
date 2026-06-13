// URLs de los microservicios
const RESERVAS_URL  = 'http://127.0.0.1:8002';
const PRODUCTOS_URL = 'http://127.0.0.1:8003';
const PEDIDOS_URL   = 'http://127.0.0.1:8004';

// Verificar sesión activa
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Carrito en memoria
let carrito = [];

// Lista completa de pedidos para filtrar sin volver a llamar al servidor
let todosPedidos = [];

// ===== EVENTOS =====
document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

document.getElementById('btnAgregarAlCarrito').addEventListener('click', agregarAlCarrito);
document.getElementById('btnGuardarPedido').addEventListener('click', guardarPedido);
document.getElementById('btnLimpiarPedido').addEventListener('click', limpiarFormulario);
document.getElementById('filtroEstado').addEventListener('change', filtrarPedidos);

// ===== CARGAR MESAS =====
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
    } catch (e) { /* sin conexión al microservicio */ }
}

// ===== CARGAR PRODUCTOS =====
async function cargarProductos() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        const productos = await response.json();
        const select = document.getElementById('producto_id');
        select.innerHTML = '<option value="">Selecciona un producto</option>';
        // Solo mostrar productos disponibles
        productos.filter(function(p) { return p.disponible; }).forEach(function(p) {
            const option = document.createElement('option');
            option.value = p.id;
            // Guardamos precio y nombre en data-attributes para leerlos fácilmente
            option.dataset.precio = p.precio;
            option.dataset.nombre = p.nombre;
            option.textContent = `${p.nombre} — $${Number(p.precio).toLocaleString()}`;
            select.appendChild(option);
        });
    } catch (e) { /* sin conexión al microservicio */ }
}

// ===== AGREGAR PRODUCTO AL CARRITO =====
function agregarAlCarrito() {
    const selectProducto = document.getElementById('producto_id');
    const cantidad       = parseInt(document.getElementById('cantidad').value);
    const opcion         = selectProducto.options[selectProducto.selectedIndex];

    if (!selectProducto.value) {
        mostrarMensaje('Selecciona un producto primero.', 'error');
        return;
    }
    if (!cantidad || cantidad < 1) {
        mostrarMensaje('La cantidad debe ser mayor a cero.', 'error');
        return;
    }

    const productoId     = parseInt(selectProducto.value);
    const nombreProducto = opcion.dataset.nombre;
    const precioUnitario = parseFloat(opcion.dataset.precio);

    // Si el producto ya está en el carrito, solo sumar cantidad
    const existente = carrito.find(function(item) { return item.producto_id === productoId; });
    if (existente) {
        existente.cantidad += cantidad;
    } else {
        carrito.push({
            producto_id:     productoId,
            nombre_producto: nombreProducto,
            precio_unitario: precioUnitario,
            cantidad:        cantidad
        });
    }

    // Resetear selectores
    selectProducto.value = '';
    document.getElementById('cantidad').value = '1';

    renderizarCarrito();
    document.getElementById('mensajePedido').innerHTML = '';
}

// ===== RENDERIZAR CARRITO =====
function renderizarCarrito() {
    const contenedor = document.getElementById('carritoContenido');

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div class="carrito-vacio">El carrito está vacío</div>';
        return;
    }

    // Calcular total general
    const total = carrito.reduce(function(suma, item) {
        return suma + (item.precio_unitario * item.cantidad);
    }, 0);

    const itemsHTML = carrito.map(function(item, indice) {
        const subtotalItem = item.precio_unitario * item.cantidad;
        return `
            <div class="carrito-item">
                <div class="carrito-item-nombre">${item.nombre_producto}</div>
                <div class="carrito-item-precio">$${Number(subtotalItem).toLocaleString()}</div>
                <div class="carrito-item-cantidad">
                    <button class="btn-cantidad" data-accion="restar" data-indice="${indice}">−</button>
                    <span class="cantidad-numero">${item.cantidad}</span>
                    <button class="btn-cantidad" data-accion="sumar" data-indice="${indice}">+</button>
                </div>
                <button class="btn-quitar-item" data-indice="${indice}" title="Eliminar">🗑️</button>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = `
        <div class="carrito-lista">${itemsHTML}</div>
        <div class="carrito-total">
            <span>Total estimado</span>
            <span>$${Number(total).toLocaleString()}</span>
        </div>
    `;

    // Botones + y -
    contenedor.querySelectorAll('.btn-cantidad').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const indice = parseInt(btn.dataset.indice);
            if (btn.dataset.accion === 'sumar') {
                carrito[indice].cantidad += 1;
            } else {
                carrito[indice].cantidad -= 1;
                // Si llega a 0, eliminar el item del carrito
                if (carrito[indice].cantidad <= 0) {
                    carrito.splice(indice, 1);
                }
            }
            renderizarCarrito();
        });
    });

    // Botón eliminar item
    contenedor.querySelectorAll('.btn-quitar-item').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const indice = parseInt(btn.dataset.indice);
            carrito.splice(indice, 1);
            renderizarCarrito();
        });
    });
}

// ===== GUARDAR PEDIDO =====
async function guardarPedido() {
    const mesa_id = document.getElementById('mesa_id').value;

    if (!mesa_id) {
        mostrarMensaje('Selecciona una mesa.', 'error');
        return;
    }
    if (carrito.length === 0) {
        mostrarMensaje('Agrega al menos un producto al carrito.', 'error');
        return;
    }

    const body = {
        mesa_id:   parseInt(mesa_id),
        productos: carrito.map(function(item) {
            return {
                producto_id:     item.producto_id,
                nombre_producto: item.nombre_producto,
                cantidad:        item.cantidad,
                precio_unitario: item.precio_unitario
            };
        })
    };

    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body:    JSON.stringify(body)
        });
        const data = await response.json();

        if (data.success) {
            mostrarMensaje(data.message, 'exito');
            limpiarFormulario();
            cargarPedidos();
        } else {
            mostrarMensaje(data.message, 'error');
        }
    } catch (error) {
        mostrarMensaje('Error al crear el pedido.', 'error');
    }
}

// ===== LIMPIAR FORMULARIO Y CARRITO =====
function limpiarFormulario() {
    document.getElementById('mesa_id').value       = '';
    document.getElementById('producto_id').value   = '';
    document.getElementById('cantidad').value      = '1';
    document.getElementById('observaciones').value = '';
    carrito = [];
    renderizarCarrito();
    document.getElementById('mensajePedido').innerHTML = '';
}

// ===== CARGAR LISTA DE PEDIDOS =====
async function cargarPedidos() {
    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos`, {
            headers: { 'Authorization': token }
        });
        todosPedidos = await response.json();
        mostrarPedidos(todosPedidos);
    } catch (error) {
        document.getElementById('listaPedidos').innerHTML =
            '<p class="mensaje-error">Error al cargar los pedidos.</p>';
    }
}

// ===== FILTRAR PEDIDOS =====
function filtrarPedidos() {
    const estado    = document.getElementById('filtroEstado').value;
    const filtrados = estado
        ? todosPedidos.filter(function(p) { return p.estado === estado; })
        : todosPedidos;
    mostrarPedidos(filtrados);
}

// ===== MOSTRAR PEDIDOS EN TARJETAS =====
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
        const detallesTexto = (p.detalles && p.detalles.length > 0)
            ? p.detalles.map(function(d) {
                return `${d.nombre_producto} x${d.cantidad}`;
              }).join(', ')
            : 'Sin detalles';

        return `
            <div class="card">
                <h3>Pedido #${p.id}</h3>
                <p>🪑 Mesa ID: ${p.mesa_id}</p>
                <p>🍽️ ${detallesTexto}</p>
                <p>💰 Total: $${Number(p.total).toLocaleString()}</p>
                <p>📅 ${p.fecha} ${p.hora}</p>
                <span class="badge ${obtenerClaseBadge(p.estado)}">${p.estado}</span>
                <div class="card-actions">
                    <button class="btn-editar" data-id="${p.id}" data-estado="${p.estado}">Avanzar estado</button>
                    <button class="btn-eliminar" data-id="${p.id}">Cancelar</button>
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
        btn.addEventListener('click', function() {
            eliminarPedido(Number(btn.dataset.id));
        });
    });
}

// ===== CAMBIAR ESTADO DEL PEDIDO =====
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
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body:    JSON.stringify({ estado: nuevo })
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

// ===== CANCELAR PEDIDO =====
async function eliminarPedido(id) {
    if (!confirm('¿Cancelar este pedido?')) { return; }
    try {
        const response = await fetch(`${PEDIDOS_URL}/pedidos/${id}`, {
            method:  'DELETE',
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        if (data.success) {
            cargarPedidos();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al cancelar el pedido.');
    }
}

// ===== MOSTRAR MENSAJE EN EL FORMULARIO =====
function mostrarMensaje(texto, tipo) {
    const clase = tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error';
    document.getElementById('mensajePedido').innerHTML =
        `<div class="${clase}">${texto}</div>`;
}

// ===== INICIALIZAR =====
cargarMesas();
cargarProductos();
cargarPedidos();