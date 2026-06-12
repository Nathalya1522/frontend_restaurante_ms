const RESERVAS_URL = 'http://127.0.0.1:8002';

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

let mesaEditandoId = null;
let todasLasMesas  = [];

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

document.getElementById('btnGuardarMesa').addEventListener('click', guardarMesa);
document.getElementById('btnCancelarMesa').addEventListener('click', cancelarEdicion);
document.getElementById('filtroEstado').addEventListener('change', filtrarMesas);

async function cargarMesas() {
    try {
        const response = await fetch(`${RESERVAS_URL}/mesas`, {
            headers: { 'Authorization': token }
        });
        todasLasMesas = await response.json();
        mostrarMesas(todasLasMesas);
    } catch (error) {
        document.getElementById('listaMesas').innerHTML = '<p class="mensaje-error">Error al cargar las mesas.</p>';
    }
}

function filtrarMesas() {
    const estado = document.getElementById('filtroEstado').value;
    const filtradas = estado
        ? todasLasMesas.filter(function(m) { return m.estado === estado; })
        : todasLasMesas;
    mostrarMesas(filtradas);
}

function mostrarMesas(mesas) {
    const lista = document.getElementById('listaMesas');
    if (mesas.length === 0) {
        lista.innerHTML = '<p>No hay mesas registradas.</p>';
        return;
    }
    lista.innerHTML = mesas.map(function(mesa) {
        return `
            <div class="card">
                <h3>Mesa ${mesa.numero}</h3>
                <p>👥 Capacidad: ${mesa.capacidad} personas</p>
                <span class="badge badge-${mesa.estado}">${mesa.estado}</span>
                <div class="card-actions">
                    <button class="btn-editar" data-id="${mesa.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${mesa.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-editar').forEach(function(btn) {
        btn.addEventListener('click', function() { editarMesa(Number(btn.dataset.id)); });
    });
    document.querySelectorAll('.btn-eliminar').forEach(function(btn) {
        btn.addEventListener('click', function() { eliminarMesa(Number(btn.dataset.id)); });
    });
}

async function guardarMesa() {
    const numero    = document.getElementById('numero').value.trim();
    const capacidad = document.getElementById('capacidad').value;
    const estado    = document.getElementById('estado').value;
    const contenedor = document.getElementById('mensajeMesa');

    if (!numero || !capacidad) {
        contenedor.innerHTML = '<div class="mensaje-error">Número y capacidad son obligatorios.</div>';
        return;
    }

    const url    = mesaEditandoId ? `${RESERVAS_URL}/mesas/${mesaEditandoId}` : `${RESERVAS_URL}/mesas`;
    const method = mesaEditandoId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ numero, capacidad, estado })
        });
        const data = await response.json();

        if (data.success) {
            contenedor.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarMesas();
        } else {
            contenedor.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="mensaje-error">Error al guardar la mesa.</div>';
    }
}

function editarMesa(id) {
    const mesa = todasLasMesas.find(function(m) { return m.id === id; });
    if (!mesa) { return; }

    mesaEditandoId = id;
    document.getElementById('numero').value    = mesa.numero;
    document.getElementById('capacidad').value = mesa.capacidad;
    document.getElementById('estado').value    = mesa.estado;
    document.getElementById('numero').disabled = true;
    document.getElementById('tituloFormulario').textContent = 'Editar Mesa';
}

function cancelarEdicion() {
    mesaEditandoId = null;
    document.getElementById('numero').value    = '';
    document.getElementById('capacidad').value = '';
    document.getElementById('estado').value    = 'disponible';
    document.getElementById('numero').disabled  = false;
    document.getElementById('tituloFormulario').textContent = 'Nueva Mesa';
    document.getElementById('mensajeMesa').innerHTML = '';
}

async function eliminarMesa(id) {
    if (!confirm('¿Seguro que deseas eliminar esta mesa?')) { return; }

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
        alert('Error al eliminar la mesa.');
    }
}

cargarMesas();