// URL base del microservicio de reservas
const RESERVAS_URL = 'http://127.0.0.1:8002';

// Verificar sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Variable para saber si estamos editando
let reservaEditandoId = null;

// Cargar mesas en el select
async function cargarMesas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await response.json();
        const select = document.getElementById('mesa_id');
        mesas.forEach(mesa => {
            select.innerHTML += `<option value="${mesa.id}">${mesa.numero} (Cap: ${mesa.capacidad})</option>`;
        });
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

// Cargar todas las reservas
async function cargarReservas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/reservas`, {
            headers: { 'Authorization': token }
        });
        const reservas = await response.json();
        mostrarReservas(reservas);
    } catch (error) {
        document.getElementById('listaReservas').innerHTML = '<p class="mensaje-error">Error al cargar las reservas</p>';
    }
}

// Mostrar reservas en pantalla
function mostrarReservas(reservas) {
    const lista = document.getElementById('listaReservas');

    if (reservas.length === 0) {
        lista.innerHTML = '<p>No hay reservas registradas</p>';
        return;
    }

    lista.innerHTML = reservas.map(reserva => `
        <div class="card">
            <h3>${reserva.nombre_cliente}</h3>
            <p>Teléfono: ${reserva.telefono_cliente}</p>
            <p>Personas: ${reserva.cantidad_personas}</p>
            <p>Fecha: ${reserva.fecha}</p>
            <p>Hora: ${reserva.hora}</p>
            <p>Mesa: ${reserva.mesa ? reserva.mesa.numero : 'N/A'}</p>
            ${reserva.observaciones ? `<p>Obs: ${reserva.observaciones}</p>` : ''}
            <span class="badge badge-${reserva.estado}">${reserva.estado}</span>
            <div class="card-actions">
                <button class="btn-edit" onclick="editarReserva(${reserva.id})">Editar</button>
                <button class="btn-delete" onclick="cancelarReserva(${reserva.id})">Cancelar</button>
            </div>
        </div>
    `).join('');
}

// Guardar reserva (crear o editar)
async function guardarReserva() {
    const nombre_cliente = document.getElementById('nombre_cliente').value;
    const telefono_cliente = document.getElementById('telefono_cliente').value;
    const cantidad_personas = document.getElementById('cantidad_personas').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const mesa_id = document.getElementById('mesa_id').value;
    const estado = document.getElementById('estado').value;
    const observaciones = document.getElementById('observaciones').value;
    const mensaje = document.getElementById('mensajeReserva');

    if (!nombre_cliente || !telefono_cliente || !cantidad_personas || !fecha || !hora || !mesa_id) {
        mensaje.innerHTML = '<div class="mensaje-error">Todos los campos son obligatorios</div>';
        return;
    }

    try {
        const url = reservaEditandoId
            ? `${RESERVAS_URL}/reservas/${reservaEditandoId}`
            : `${RESERVAS_URL}/reservas`;

        const method = reservaEditandoId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ nombre_cliente, telefono_cliente, cantidad_personas, fecha, hora: hora + ':00', mesa_id, estado, observaciones })
        });

        const data = await response.json();

        if (data.success) {
            mensaje.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarReservas();
        } else {
            mensaje.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        mensaje.innerHTML = '<div class="mensaje-error">Error al guardar la reserva</div>';
    }
}

// Editar reserva
async function editarReserva(id) {
    try {
        const response = await fetch(`${RESERVAS_URL}/reservas`, {
            headers: { 'Authorization': token }
        });
        const reservas = await response.json();
        const reserva = reservas.find(r => r.id === id);

        if (reserva) {
            reservaEditandoId = id;
            document.getElementById('nombre_cliente').value = reserva.nombre_cliente;
            document.getElementById('telefono_cliente').value = reserva.telefono_cliente;
            document.getElementById('cantidad_personas').value = reserva.cantidad_personas;
            document.getElementById('fecha').value = reserva.fecha;
            document.getElementById('hora').value = reserva.hora.substring(0, 5);
            document.getElementById('mesa_id').value = reserva.mesa_id;
            document.getElementById('estado').value = reserva.estado;
            document.getElementById('observaciones').value = reserva.observaciones || '';
            document.getElementById('tituloFormulario').textContent = 'Editar Reserva';
        }
    } catch (error) {
        console.error('Error al cargar reserva:', error);
    }
}

// Cancelar reserva
async function cancelarReserva(id) {
    if (!confirm('¿Estás segura de cancelar esta reserva?')) return;

    try {
        const response = await fetch(`${RESERVAS_URL}/reservas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        const data = await response.json();

        if (data.success) {
            cargarReservas();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al cancelar la reserva');
    }
}

// Cancelar edición
function cancelarEdicion() {
    reservaEditandoId = null;
    document.getElementById('nombre_cliente').value = '';
    document.getElementById('telefono_cliente').value = '';
    document.getElementById('cantidad_personas').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('hora').value = '';
    document.getElementById('mesa_id').value = '';
    document.getElementById('estado').value = 'pendiente';
    document.getElementById('observaciones').value = '';
    document.getElementById('tituloFormulario').textContent = 'Crear Nueva Reserva';
    document.getElementById('mensajeReserva').innerHTML = '';
}

// Filtrar reservas
async function filtrarReservas() {
    const fecha = document.getElementById('filtroFecha').value;
    const estado = document.getElementById('filtroEstado').value;
    const cliente = document.getElementById('filtroCliente').value;

    let url = `${RESERVAS_URL}/reservas?`;
    if (fecha) url += `fecha=${fecha}&`;
    if (estado) url += `estado=${estado}&`;
    if (cliente) url += `cliente=${cliente}&`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': token }
        });
        const reservas = await response.json();
        mostrarReservas(reservas);
    } catch (error) {
        console.error('Error al filtrar:', error);
    }
}

// Iniciar
cargarMesas();
cargarReservas();