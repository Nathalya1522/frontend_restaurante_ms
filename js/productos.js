// URL base del microservicio de productos
const PRODUCTOS_URL = 'http://127.0.0.1:8003';

// Verificar sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Variable para saber si estamos editando
let productoEditandoId = null;

// Cargar categorias en los selects
async function cargarCategorias() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/categorias`, {
            headers: { 'Authorization': token }
        });
        const categorias = await response.json();
        const select = document.getElementById('categoria_id');
        const filtro = document.getElementById('filtroCategoria');

        categorias.forEach(categoria => {
            select.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
            filtro.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar categorias:', error);
    }
}

// Cargar todos los productos
async function cargarProductos() {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        const productos = await response.json();
        mostrarProductos(productos);
    } catch (error) {
        document.getElementById('listaProductos').innerHTML = '<p class="mensaje-error">Error al cargar los productos</p>';
    }
}

// Mostrar productos en pantalla
function mostrarProductos(productos) {
    const lista = document.getElementById('listaProductos');

    if (productos.length === 0) {
        lista.innerHTML = '<p>No hay productos registrados</p>';
        return;
    }

    lista.innerHTML = productos.map(producto => `
        <div class="card">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion || ''}</p>
            <p>Precio: $${Number(producto.precio).toLocaleString()}</p>
            <p>Categoría: ${producto.categoria ? producto.categoria.nombre : 'N/A'}</p>
            <span class="badge ${producto.disponible ? 'badge-confirmada' : 'badge-cancelada'}">
                ${producto.disponible ? 'Disponible' : 'No disponible'}
            </span>
            <div class="card-actions">
                <button class="btn-edit" onclick="editarProducto(${producto.id})">Editar</button>
                <button class="btn-delete" onclick="eliminarProducto(${producto.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Guardar producto (crear o editar)
async function guardarProducto() {
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const categoria_id = document.getElementById('categoria_id').value;
    const descripcion = document.getElementById('descripcion').value;
    const disponible = document.getElementById('disponible').value;
    const mensaje = document.getElementById('mensajeProducto');

    if (!nombre || !precio || !categoria_id) {
        mensaje.innerHTML = '<div class="mensaje-error">Nombre, precio y categoría son obligatorios</div>';
        return;
    }

    try {
        const url = productoEditandoId
            ? `${PRODUCTOS_URL}/productos/${productoEditandoId}`
            : `${PRODUCTOS_URL}/productos`;

        const method = productoEditandoId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ nombre, precio, categoria_id, descripcion, disponible })
        });

        const data = await response.json();

        if (data.success) {
            mensaje.innerHTML = `<div class="mensaje-exito">${data.message}</div>`;
            cancelarEdicion();
            cargarProductos();
        } else {
            mensaje.innerHTML = `<div class="mensaje-error">${data.message}</div>`;
        }
    } catch (error) {
        mensaje.innerHTML = '<div class="mensaje-error">Error al guardar el producto</div>';
    }
}

// Editar producto
async function editarProducto(id) {
    try {
        const response = await fetch(`${PRODUCTOS_URL}/productos`, {
            headers: { 'Authorization': token }
        });
        const productos = await response.json();
        const producto = productos.find(p => p.id === id);

        if (producto) {
            productoEditandoId = id;
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('precio').value = producto.precio;
            document.getElementById('categoria_id').value = producto.categoria_id;
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('disponible').value = producto.disponible ? '1' : '0';
            document.getElementById('tituloFormulario').textContent = 'Editar Producto';
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
    }
}

// Eliminar producto
async function eliminarProducto(id) {
    if (!confirm('¿Estás segura de eliminar este producto?')) return;

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
        alert('Error al eliminar el producto');
    }
}

// Cancelar edición
function cancelarEdicion() {
    productoEditandoId = null;
    document.getElementById('nombre').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('categoria_id').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('disponible').value = '1';
    document.getElementById('tituloFormulario').textContent = 'Crear Nuevo Producto';
    document.getElementById('mensajeProducto').innerHTML = '';
}

// Filtrar productos por categoria
async function filtrarProductos() {
    const categoria_id = document.getElementById('filtroCategoria').value;
    let url = `${PRODUCTOS_URL}/productos`;
    if (categoria_id) url += `?categoria_id=${categoria_id}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': token }
        });
        const productos = await response.json();
        mostrarProductos(productos);
    } catch (error) {
        console.error('Error al filtrar:', error);
    }
}

// Iniciar
cargarCategorias();
cargarProductos();