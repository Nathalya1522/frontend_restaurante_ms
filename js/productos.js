const PRODUCTOS_URL = 'http://127.0.0.1:8003';

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

let productoEditandoId = null;
let todosLosProductos  = [];

document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
});

document.getElementById('btnGuardarProducto').addEventListener('click', guardarProducto);
document.getElementById('btnCancelarProducto').addEventListener('click', cancelarEdicion);
document.getElementById('filtroCategoria').addEventListener('change', filtrarProductos);

async function cargarCategorias() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/categorias`, {
            headers: { 'Authorization': token }
        });
        const categorias = await response.json();
        const selectForm   = document.getElementById('categoria_id');
        const selectFiltro = document.getElementById('filtroCategoria');

        selectForm.innerHTML   = '<option value="">Selecciona categoría</option>';
        selectFiltro.innerHTML = '<option value="">Todas las categorías</option>';

        categorias.forEach(function(cat) {
            const optForm = document.createElement('option');
            optForm.value = cat.id;
            optForm.textContent = cat.nombre;
            selectForm.appendChild(optForm);

            const optFiltro = document.createElement('option');
            optFiltro.value = cat.id;
            optFiltro.textContent = cat.nombre;
            selectFiltro.appendChild(optFiltro);
        });
    } catch (e) { /* sin conexión */ }
}

async function cargarProductos() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        todosLosProductos = await response.json();
        mostrarProductos(todosLosProductos);
    } catch (error) {
        document.getElementById('listaProductos').innerHTML = '<p class="mensaje-error">Error al cargar los productos.</p>';
    }
}

function filtrarProductos() {
    const catId = document.getElementById('filtroCategoria').value;
    const filtrados = catId
        ? todosLosProductos.filter(function(p) { return String(p.categoria_id) === catId; })
        : todosLosProductos;
    mostrarProductos(filtrados);
}

function mostrarProductos(productos) {
    const lista = document.getElementById('listaProductos');
    if (productos.length === 0) {
        lista.innerHTML = '<p>No hay productos registrados.</p>';
        return;
    }
    lista.innerHTML = productos.map(function(p) {
        const claseBadge = p.disponible ? 'badge-disponible' : 'badge-cancelada';
        const textoDisp  = p.disponible ? 'Disponible' : 'No disponible';
        return `
            <div class="card">
                <h3>${p.nombre}</h3>
                ${p.descripcion ? `<p>${p.descripcion}</p>` : ''}
                <p>💰 $${Number(p.precio).toLocaleString()}</p>
                <p>📁 ${p.categoria ? p.categoria.nombre : 'Sin categoría'}</p>
                <span class="badge ${claseBadge}">${textoDisp}</span>
                <div class="card-actions">
                    <button class="btn-editar" data-id="${p.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${p.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#listaProductos .btn-editar').forEach(function(btn) {
        btn.addEventListener('click', function() { editarProducto(Number(btn.dataset.id)); });
    });
    document.querySelectorAll('#listaProductos .btn-eliminar').forEach(function(btn) {
        btn.addEventListener('click', function() { eliminarProducto(Number(btn.dataset.id)); });
    });
}

async function guardarProducto() {
    const nombre       = document.getElementById('nombre').value.trim();
    const precio       = document.getElementById('precio').value;
    const categoria_id = document.getElementById('categoria_id').value;
    const descripcion  = document.getElementById('descripcion').value;
    const disponible   = document.getElementById('disponible').value;
    const contenedor   = document.getElementById('mensajeProducto');

    if (!nombre || !precio || !categoria_id) {
        contenedor.innerHTML = '<div class="mensaje-error">Nombre, precio y categoría son obligatorios.</div>';
        return;
    }

    const url    = productoEditandoId ? `${PRODUCTOS_URL}/productos/${productoEditandoId}` : `${PRODUCTOS_URL}/productos`;
    const method = productoEditandoId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ nombre, precio, categoria_id, descripcion, disponible })
        });
        const data = await response.json();

        if (data.success) {
            contenedor.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarProductos();
        } else {
            contenedor.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="mensaje-error">Error al guardar el producto.</div>';
    }
}

function editarProducto(id) {
    const p = todosLosProductos.find(function(x) { return x.id === id; });
    if (!p) { return; }

    productoEditandoId = id;
    document.getElementById('nombre').value       = p.nombre;
    document.getElementById('precio').value       = p.precio;
    document.getElementById('categoria_id').value = p.categoria_id;
    document.getElementById('descripcion').value  = p.descripcion || '';
    document.getElementById('disponible').value   = p.disponible ? '1' : '0';
    document.getElementById('tituloFormulario').textContent = 'Editar Producto';
}

function cancelarEdicion() {
    productoEditandoId = null;
    ['nombre', 'precio', 'descripcion'].forEach(function(id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('categoria_id').value = '';
    document.getElementById('disponible').value   = '1';
    document.getElementById('tituloFormulario').textContent = 'Nuevo Producto';
    document.getElementById('mensajeProducto').innerHTML = '';
}

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto del menú?')) { return; }

    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        if (data.success) {
            cargarProductos();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al eliminar el producto.');
    }
}

cargarCategorias();
cargarProductos();