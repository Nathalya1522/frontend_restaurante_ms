// URL base del microservicio de reservas
const RESERVAS_URL = 'http://127.0.0.1:8002';

// Verificar sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Variable para saber si estamos editando
let mesaEditandoId = null;

// Cargar todas las mesas
async function cargarMesas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await response.json();
        mostrarMesas(mesas);
    } catch (error) {
        document.getElementById('listaMesas').innerHTML = '<p class="mensaje-error">Error al cargar las mesas</p>';
    }
}

// Mostrar mesas en pantalla
function mostrarMesas(mesas) {
    const lista = document.getElementById('listaMesas');

    if (mesas.length === 0) {
        lista.innerHTML = '<p>No hay mesas registradas</p>';
        return;
    }

    lista.innerHTML = mesas.map(mesa => `
        <div class="card">
            <h3>${mesa.numero}</h3>
            <p>Capacidad: ${mesa.capacidad} personas</p>
            <span class="badge badge-${mesa.estado}">${mesa.estado}</span>
            <div class="card-actions">
                <button class="btn-edit" onclick="editarMesa(${mesa.id})">Editar</button>
                <button class="btn-delete" onclick="eliminarMesa(${mesa.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Guardar mesa (crear o editar)
async function guardarMesa() {
    const numero = document.getElementById('numero').value;
    const capacidad = document.getElementById('capacidad').value;
    const estado = document.getElementById('estado').value;
    const mensaje = document.getElementById('mensajeMesa');

    if (!numero || !capacidad) {
        mensaje.innerHTML = '<div class="mensaje-error">Todos los campos son obligatorios</div>';
        return;
    }

    try {
        const url = mesaEditandoId
            ? `${RESERVAS_URL}/mesas/${mesaEditandoId}`
            : `${RESERVAS_URL}/mesas`;

        const method = mesaEditandoId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ numero, capacidad, estado })
        });

        const data = await response.json();

        if (data.success) {
            mensaje.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarMesas();
        } else {
            mensaje.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        mensaje.innerHTML = '<div class="mensaje-error">Error al guardar la mesa</div>';
    }
}

// Editar mesa
async function editarMesa(id) {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        const mesas = await response.json();
        const mesa = mesas.find(m => m.id === id);

        if (mesa) {
            mesaEditandoId = id;
            document.getElementById('numero').value = mesa.numero;
            document.getElementById('capacidad').value = mesa.capacidad;
            document.getElementById('estado').value = mesa.estado;
            document.getElementById('tituloFormulario').textContent = 'Editar Mesa';
            document.getElementById('numero').disabled = true;
        }
    } catch (error) {
        console.error('Error al cargar mesa:', error);
    }
}

// Cancelar edición
function cancelarEdicion() {
    mesaEditandoId = null;
    document.getElementById('numero').value = '';
    document.getElementById('capacidad').value = '';
    document.getElementById('estado').value = 'disponible';
    document.getElementById('tituloFormulario').textContent = 'Crear Nueva Mesa';
    document.getElementById('numero').disabled = false;
    document.getElementById('mensajeMesa').innerHTML = '';
}

// Eliminar mesa
async function eliminarMesa(id) {
    if (!confirm('¿Estás segura de eliminar esta mesa?')) return;

    try {
        const response = await fetch(`${RESERVAS_URL}/mesas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        const data = await response.json();

        if (data.success) {
            cargarMesas();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al eliminar la mesa');
    }
}

// Cargar mesas al iniciar
cargarMesas();