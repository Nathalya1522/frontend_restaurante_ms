const RESERVAS_URL = 'http://127.0.0.1:8002';

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

let reservaEditandoId = null;
let todasLasReservas  = [];

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

document.getElementById('btnGuardarReserva').addEventListener('click', guardarReserva);
document.getElementById('btnCancelarReserva').addEventListener('click', cancelarEdicion);
document.getElementById('filtroEstado').addEventListener('change', filtrarReservas);

async function cargarMesas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await response.json();
        const select = document.getElementById('mesa_id');
        select.innerHTML = '<option value="">Selecciona una mesa</option>';
        mesas.forEach(function(mesa) {
            const option = document.createElement('option');
            option.value = mesa.id;
            option.textContent = `Mesa ${mesa.numero} (Cap: ${mesa.capacidad})`;
            select.appendChild(option);
        });
    } catch (e) { /* sin conexión */ }
}

async function cargarReservas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/reservas`, {
            headers: { 'Authorization': token }
        });
        todasLasReservas = await response.json();
        mostrarReservas(todasLasReservas);
    } catch (error) {
        document.getElementById('listaReservas').innerHTML = '<p class="mensaje-error">Error al cargar las reservas.</p>';
    }
}

function filtrarReservas() {
    const estado = document.getElementById('filtroEstado').value;
    const filtradas = estado
        ? todasLasReservas.filter(function(r) { return r.estado === estado; })
        : todasLasReservas;
    mostrarReservas(filtradas);
}

function mostrarReservas(reservas) {
    const lista = document.getElementById('listaReservas');
    if (reservas.length === 0) {
        lista.innerHTML = '<p>No hay reservas registradas.</p>';
        return;
    }
    lista.innerHTML = reservas.map(function(r) {
        return `
            <div class="card">
                <h3>${r.nombre_cliente}</h3>
                <p>📞 ${r.telefono_cliente}</p>
                <p>👥 ${r.cantidad_personas} personas</p>
                <p>📅 ${r.fecha} — ⏰ ${r.hora}</p>
                <p>🪑 Mesa: ${r.mesa ? r.mesa.numero : 'N/A'}</p>
                ${r.observaciones ? `<p>📝 ${r.observaciones}</p>` : ''}
                <span class="badge badge-${r.estado}">${r.estado}</span>
                <div class="card-actions">
                    <button class="btn-editar" data-id="${r.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${r.id}">Cancelar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#listaReservas .btn-editar').forEach(function(btn) {
        btn.addEventListener('click', function() { editarReserva(Number(btn.dataset.id)); });
    });
    document.querySelectorAll('#listaReservas .btn-eliminar').forEach(function(btn) {
        btn.addEventListener('click', function() { cancelarReserva(Number(btn.dataset.id)); });
    });
}

async function guardarReserva() {
    const nombre_cliente    = document.getElementById('nombre_cliente').value.trim();
    const telefono_cliente  = document.getElementById('telefono_cliente').value.trim();
    const cantidad_personas = document.getElementById('cantidad_personas').value;
    const fecha             = document.getElementById('fecha').value;
    const hora              = document.getElementById('hora').value;
    const mesa_id           = document.getElementById('mesa_id').value;
    const estado            = document.getElementById('estado').value;
    const observaciones     = document.getElementById('observaciones').value;
    const contenedor        = document.getElementById('mensajeReserva');

    if (!nombre_cliente || !telefono_cliente || !cantidad_personas || !fecha || !hora || !mesa_id) {
        contenedor.innerHTML = '<div class="mensaje-error">Completa todos los campos obligatorios.</div>';
        return;
    }

    const url    = reservaEditandoId ? `${RESERVAS_URL}/reservas/${reservaEditandoId}` : `${RESERVAS_URL}/reservas`;
    const method = reservaEditandoId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ nombre_cliente, telefono_cliente, cantidad_personas, fecha, hora, mesa_id, estado, observaciones })
        });
        const data = await response.json();

        if (data.success) {
            contenedor.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarReservas();
        } else {
            contenedor.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="mensaje-error">Error al guardar la reserva.</div>';
    }
}

function editarReserva(id) {
    const r = todasLasReservas.find(function(x) { return x.id === id; });
    if (!r) { return; }

    reservaEditandoId = id;
    document.getElementById('nombre_cliente').value    = r.nombre_cliente;
    document.getElementById('telefono_cliente').value  = r.telefono_cliente;
    document.getElementById('cantidad_personas').value = r.cantidad_personas;
    document.getElementById('fecha').value             = r.fecha;
    document.getElementById('hora').value              = r.hora;
    document.getElementById('mesa_id').value           = r.mesa_id;
    document.getElementById('estado').value            = r.estado;
    document.getElementById('observaciones').value     = r.observaciones || '';
    document.getElementById('tituloFormulario').textContent = 'Editar Reserva';
}

function cancelarEdicion() {
    reservaEditandoId = null;
    ['nombre_cliente', 'telefono_cliente', 'cantidad_personas', 'fecha', 'hora', 'observaciones'].forEach(function(id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('mesa_id').value = '';
    document.getElementById('estado').value  = 'pendiente';
    document.getElementById('tituloFormulario').textContent = 'Nueva Reserva';
    document.getElementById('mensajeReserva').innerHTML = '';
}

async function cancelarReserva(id) {
    if (!confirm('¿Cancelar esta reserva?')) { return; }

    try {
        const response = await fetch(`${RESERVAS_URL}/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ estado: 'cancelada' })
        });
        const data = await response.json();
        if (data.success) {
            cargarReservas();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al cancelar la reserva.');
    }
}

cargarMesas();
cargarReservas();