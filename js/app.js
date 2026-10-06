const vistas = {
    inicio: document.getElementById('vista-inicio'),
    catalogo: document.getElementById('vista-catalogo'),
    producto: document.getElementById('vista-producto'),
    carrito: document.getElementById('vista-carrito'),
    retiro: document.getElementById('vista-retiro'),
    pago: document.getElementById('vista-pago'),
    confirmacion: document.getElementById('vista-confirmacion'),
    pedidos: document.getElementById('vista-pedidos'),
    login: document.getElementById('vista-login')
};

const logoBtn = document.getElementById('logo-btn');
const btnAtrasGlobal = document.getElementById('btn-atras-global');
const carritoContador = document.getElementById('carrito-contador');
const searchInput = document.getElementById('buscador-input');
const searchSuggestions = document.getElementById('search-suggestions');

let filtroCat = 'todas';
let filtroPrec = 'todos';
let filtroBusqueda = '';

let carrito = [];
let pedidos = [];
let productoSeleccionado = null;

let usuarioAutenticado = false;
let vistaPostLogin = null;

// Lógica de Galería
let galeriaActualIndex = 0;
let galeriaImagenes = [];

function mostrarVista(nombreVista) {
    Object.values(vistas).forEach(v => v.classList.replace('activa', 'oculta'));
    vistas[nombreVista].classList.replace('oculta', 'activa');

    if (nombreVista === 'inicio') {
        btnAtrasGlobal.style.display = 'none';
        limpiarFiltrosNav();
    } else {
        btnAtrasGlobal.style.display = 'inline-flex';
    }
    window.scrollTo(0, 0);
}

// BUSCADOR INTELIGENTE
searchInput.addEventListener('focus', () => searchSuggestions.style.display = 'block');
document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search')) searchSuggestions.style.display = 'none';
});

document.querySelectorAll('.sug-item').forEach(item => {
    item.addEventListener('click', (e) => {
        searchInput.value = e.target.textContent;
        filtroBusqueda = searchInput.value;
        searchSuggestions.style.display = 'none';
        
        sincronizarBotonesActivos();
        mostrarVista('catalogo');
        actualizarCatalogo();
    });
});

searchInput.addEventListener('input', (e) => {
    filtroBusqueda = e.target.value;
    mostrarVista('catalogo');
    actualizarCatalogo();
});

// CLICS EN INICIO (HERO Y CATEGORIAS)
document.getElementById('btn-hero-camaras').addEventListener('click', () => {
    filtroCat = 'camaras'; filtroBusqueda = ''; searchInput.value = '';
    sincronizarBotonesActivos(); mostrarVista('catalogo'); actualizarCatalogo();
});

document.getElementById('btn-hero-ofertas').addEventListener('click', () => {
    filtroCat = 'ofertas'; filtroBusqueda = ''; searchInput.value = '';
    sincronizarBotonesActivos(); mostrarVista('catalogo'); actualizarCatalogo();
});

document.querySelectorAll('.card-cat-click').forEach(card => {
    card.addEventListener('click', (e) => {
        const el = e.currentTarget;
        filtroCat = el.dataset.filtro || 'todas';
        filtroBusqueda = el.dataset.search || '';
        
        if (filtroBusqueda) searchInput.value = filtroBusqueda.charAt(0).toUpperCase() + filtroBusqueda.slice(1);
        else searchInput.value = '';

        sincronizarBotonesActivos();
        mostrarVista('catalogo');
        actualizarCatalogo();
    });
});


// RENDERIZADOS (INICIO Y CATÁLOGO)
function renderizarInicio() {
    const idsDestacados = ["sony-a7iii", "canon-eos-r8", "sony-zv-e10-ii", "sigma-24-70"];
    const destacados = inventario.filter(p => idsDestacados.includes(p.id));
    renderizarGrid(destacados, 'grid-destacados');
}

function actualizarCatalogo() {
    let filtrados = inventario;

    // Normalizador inteligente de busqueda
    if (filtroBusqueda !== '') {
        let busquedaOriginal = filtroBusqueda.toLowerCase().trim();
        // Corrección de plurales (casuales -> casual, profesionales -> profesional)
        if (busquedaOriginal === 'casuales') busquedaOriginal = 'casual';
        if (busquedaOriginal === 'profesionales') busquedaOriginal = 'profesional';

        filtrados = filtrados.filter(p => 
            p.nombre.toLowerCase().includes(busquedaOriginal) || 
            p.marca.toLowerCase().includes(busquedaOriginal) || 
            p.categoria.toLowerCase().includes(busquedaOriginal)
        );
    }

    if (filtroCat === 'camaras') filtrados = filtrados.filter(p => p.tipo === 'camaras');
    else if (filtroCat === 'lentes') filtrados = filtrados.filter(p => p.tipo === 'lentes');
    else if (filtroCat === 'ofertas') filtrados = filtrados.filter(p => p.descuento > 0);

    if (filtroPrec === 'hasta-500') filtrados = filtrados.filter(p => p.precio !== null && p.precio <= 500);
    else if (filtroPrec === '500-1000') filtrados = filtrados.filter(p => p.precio !== null && p.precio > 500 && p.precio <= 1000);
    else if (filtroPrec === 'mas-1000') filtrados = filtrados.filter(p => p.precio !== null && p.precio > 1000);

    document.getElementById('catalogo-titulo').textContent = (filtroCat === 'ofertas') ? 'Ofertas' : (filtroCat === 'camaras' ? 'Cámaras' : (filtroCat === 'lentes' ? 'Lentes' : 'Catálogo'));
    document.getElementById('catalogo-aviso').style.display = (filtroCat === 'ofertas') ? 'block' : 'none';
    document.getElementById('catalogo-subtitulo').textContent = `${filtrados.length} productos · Todos los productos`;

    const sinResultados = document.getElementById('sin-resultados');
    const grid = document.getElementById('grid-catalogo');
    
    if (filtrados.length === 0) {
        sinResultados.style.display = 'block';
        grid.style.display = 'none';
    } else {
        sinResultados.style.display = 'none';
        grid.style.display = 'grid';
        renderizarGrid(filtrados, 'grid-catalogo');
    }
}

function renderizarGrid(productos, contenedorId) {
    const grid = document.getElementById(contenedorId);
    if (!grid) return;
    grid.innerHTML = ''; 
    
    productos.forEach(producto => {
        let precioFormat = producto.precio ? `$${producto.precio.toLocaleString('es-EC', { minimumFractionDigits: 2 })}` : '';
        let etiquetaHtml = '', precioAnteriorHtml = '', colorPrecio = 'var(--color-text)'; 
        let btnDisabled = '', colorStock = 'var(--color-success)', textStock = '● Disponible';

        if (producto.descuento && producto.precio) {
            etiquetaHtml = `<span class="etiqueta-descuento">-${producto.descuento}%</span>`;
            precioAnteriorHtml = `<span class="precio-anterior">$${producto.precioAnterior.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>`;
            colorPrecio = 'var(--color-sale)'; 
        }

        if (!producto.stock) {
            colorStock = 'var(--color-sale)';
            textStock = '● Agotado';
            btnDisabled = 'disabled';
        }

        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-producto';
        tarjeta.innerHTML = `
            ${etiquetaHtml}
            <img src="img/productos/${producto.imagenes[0]}" alt="${producto.nombre}" class="imagen-producto">
            <h3 class="nombre-producto">${producto.nombre}</h3>
            <p class="categoria-producto">${producto.categoria}</p>
            <div class="precio-contenedor">
                <span class="precio-actual" style="color: ${colorPrecio}">${precioFormat}</span>
                ${precioAnteriorHtml}
            </div>
            <div class="disponibilidad" style="color: ${colorStock}">${textStock}</div>
            <div class="tarjeta-acciones">
                <span class="link-detalle">Ver detalle ›</span>
                <button class="btn-add-carrito" ${btnDisabled}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </button>
            </div>
        `;

        const btnAdd = tarjeta.querySelector('.btn-add-carrito');
        btnAdd.addEventListener('click', (e) => {
            e.stopPropagation();
            if (producto.stock) agregarAlCarrito(producto.id, 1);
        });

        tarjeta.addEventListener('click', () => abrirDetalleProducto(producto));
        grid.appendChild(tarjeta);
    });
}

function abrirDetalleProducto(producto) {
    productoSeleccionado = producto;
    document.getElementById('detalle-nombre').textContent = producto.nombre;
    document.getElementById('detalle-categoria').textContent = producto.categoria;
    document.getElementById('detalle-desc').textContent = producto.descripcion;
    document.getElementById('detalle-precio').textContent = producto.precio ? `$${producto.precio.toLocaleString('es-EC', {minimumFractionDigits:2})}` : '';
    
    const precAnt = document.getElementById('detalle-precio-anterior');
    if (producto.descuento && producto.precio) {
        document.getElementById('detalle-precio').classList.add('text-sale');
        precAnt.textContent = `$${producto.precioAnterior.toLocaleString('es-EC', {minimumFractionDigits:2})}`;
    } else {
        document.getElementById('detalle-precio').classList.remove('text-sale');
        precAnt.textContent = '';
    }

    const disp = document.getElementById('detalle-disponibilidad');
    disp.textContent = producto.stock ? '● Disponible' : '● Agotado';
    disp.style.color = producto.stock ? 'var(--color-success)' : 'var(--color-sale)';

    const tb = document.getElementById('detalle-specs');
    tb.innerHTML = '';
    for (const [key, val] of Object.entries(producto.especificaciones)) {
        tb.innerHTML += `<tr><td>${key}</td><td>${val}</td></tr>`;
    }

    // Lógica Galería con Flechas
    galeriaImagenes = producto.imagenes;
    galeriaActualIndex = 0;
    actualizarImagenPrincipal();

    const minContainer = document.getElementById('detalle-miniaturas');
    minContainer.innerHTML = '';
    producto.imagenes.forEach((img, i) => {
        const thumb = document.createElement('img');
        thumb.src = `img/productos/${img}`;
        thumb.className = i === 0 ? 'mini-img activa' : 'mini-img';
        thumb.addEventListener('click', () => {
            galeriaActualIndex = i;
            actualizarImagenPrincipal();
        });
        minContainer.appendChild(thumb);
    });

    if (galeriaImagenes.length > 1) {
        document.getElementById('btn-galeria-prev').style.display = 'flex';
        document.getElementById('btn-galeria-next').style.display = 'flex';
    } else {
        document.getElementById('btn-galeria-prev').style.display = 'none';
        document.getElementById('btn-galeria-next').style.display = 'none';
    }

    document.getElementById('detalle-cantidad').textContent = '1';
    mostrarVista('producto');
}

function actualizarImagenPrincipal() {
    document.getElementById('detalle-img-principal').src = `img/productos/${galeriaImagenes[galeriaActualIndex]}`;
    document.querySelectorAll('.mini-img').forEach((m, i) => {
        if (i === galeriaActualIndex) m.classList.add('activa');
        else m.classList.remove('activa');
    });
}

document.getElementById('btn-galeria-prev').addEventListener('click', () => {
    galeriaActualIndex = (galeriaActualIndex > 0) ? galeriaActualIndex - 1 : galeriaImagenes.length - 1;
    actualizarImagenPrincipal();
});

document.getElementById('btn-galeria-next').addEventListener('click', () => {
    galeriaActualIndex = (galeriaActualIndex < galeriaImagenes.length - 1) ? galeriaActualIndex + 1 : 0;
    actualizarImagenPrincipal();
});

document.getElementById('detalle-btn-mas').addEventListener('click', () => {
    let c = parseInt(document.getElementById('detalle-cantidad').textContent);
    document.getElementById('detalle-cantidad').textContent = c + 1;
});
document.getElementById('detalle-btn-menos').addEventListener('click', () => {
    let c = parseInt(document.getElementById('detalle-cantidad').textContent);
    if(c > 1) document.getElementById('detalle-cantidad').textContent = c - 1;
});
document.getElementById('btn-add-detail').addEventListener('click', () => {
    if(!productoSeleccionado.stock) return abrirModal('modal-stock');
    let c = parseInt(document.getElementById('detalle-cantidad').textContent);
    agregarAlCarrito(productoSeleccionado.id, c);
});


// CARRITO
function agregarAlCarrito(id, cantidad) {
    const prod = inventario.find(p => p.id === id);
    const item = carrito.find(i => i.id === id);
    if (item) item.cantidad += cantidad;
    else carrito.push({ ...prod, cantidad });
    actualizarBadgeCarrito();
    
    document.getElementById('txt-modal-agregado').textContent = `${prod.nombre} se agregó al carrito.`;
    abrirModal('modal-agregado');
}

function actualizarBadgeCarrito() {
    carritoContador.textContent = carrito.reduce((acc, i) => acc + i.cantidad, 0);
}

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const vacio = document.getElementById('carrito-vacio');
    const lleno = document.getElementById('carrito-lleno');

    if (carrito.length === 0) {
        vacio.style.display = 'flex';
        lleno.style.display = 'none';
        return;
    }
    vacio.style.display = 'none';
    lleno.style.display = 'flex';
    lista.innerHTML = '';
    
    let subtotal = 0;
    carrito.forEach(item => {
        subtotal += item.precio * item.cantidad;
        lista.innerHTML += `
            <div class="carrito-item">
                <div class="carrito-item-info">
                    <img src="img/productos/${item.imagenes[0]}" alt="${item.nombre}">
                    <div>
                        <div class="nombre-producto">${item.nombre}</div>
                        <div class="text-secondary">$${item.precio.toLocaleString('es-EC', {minimumFractionDigits:2})} c/u</div>
                    </div>
                </div>
                <div class="cantidad-selector">
                    <button onclick="cambiarCantidad('${item.id}', -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="cambiarCantidad('${item.id}', 1)">+</button>
                </div>
                <div class="carrito-item-precio">$${(item.precio * item.cantidad).toLocaleString('es-EC', {minimumFractionDigits:2})}</div>
                <button class="btn-eliminar" onclick="confirmarEliminar('${item.id}', '${item.nombre}')">🗑 Eliminar</button>
            </div>
        `;
    });
    const fSub = `$${subtotal.toLocaleString('es-EC', {minimumFractionDigits:2})}`;
    document.getElementById('resumen-subtotal').textContent = fSub;
    document.getElementById('resumen-total').textContent = fSub;
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (item.cantidad + delta > 0) {
        item.cantidad += delta;
        actualizarBadgeCarrito();
        renderizarCarrito();
    }
}

let itemAEliminar = null;
function confirmarEliminar(id, nombre) {
    itemAEliminar = id;
    document.getElementById('txt-modal-eliminar').textContent = `¿Deseas quitar ${nombre} de tu carrito?`;
    abrirModal('modal-eliminar');
}

document.getElementById('btn-confirmar-eliminar').addEventListener('click', () => {
    carrito = carrito.filter(i => i.id !== itemAEliminar);
    actualizarBadgeCarrito();
    renderizarCarrito();
    cerrarModal('modal-eliminar');
});
document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => cerrarModal('modal-eliminar'));
document.getElementById('btn-cerrar-stock').addEventListener('click', () => cerrarModal('modal-stock'));
document.getElementById('btn-error-cambiar').addEventListener('click', () => cerrarModal('modal-error'));

document.getElementById('btn-modal-seguir').addEventListener('click', () => cerrarModal('modal-agregado'));
document.getElementById('btn-modal-ir-carrito').addEventListener('click', () => {
    cerrarModal('modal-agregado');
    renderizarCarrito();
    mostrarVista('carrito');
});

function abrirModal(id) { document.getElementById('overlay').style.display = 'block'; document.getElementById(id).style.display = 'block'; }
function cerrarModal(id) { document.getElementById('overlay').style.display = 'none'; document.getElementById(id).style.display = 'none'; }


// AUTENTICACIÓN Y CHECKOUT
document.getElementById('btn-submit-login').addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    // Validar Datos Quemados
    if (email === 'carlos@ejemplo.com' && pass === '123456') {
        usuarioAutenticado = true;
        document.getElementById('user-name-display').textContent = 'Carlos'; 
        document.getElementById('btn-nav-logout').style.display = 'inline-flex';
        document.getElementById('login-error').style.display = 'none';
        
        // Limpiar inputs
        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';

        if (vistaPostLogin) {
            const vistaAnterior = vistaPostLogin;
            vistaPostLogin = null;
            if(vistaAnterior === 'retiro') document.getElementById('btn-continuar-retiro').click();
            else if(vistaAnterior === 'pedidos') document.getElementById('btn-nav-pedidos').click();
        } else {
            mostrarVista('inicio');
        }
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// Mostrar confirmación al hacer clic en el ícono de salir
document.getElementById('btn-nav-logout').addEventListener('click', () => {
    abrirModal('modal-logout');
});

// Botón de Cancelar en el modal
document.getElementById('btn-cancelar-logout').addEventListener('click', () => {
    cerrarModal('modal-logout');
});

// Botón de Confirmar cierre de sesión
document.getElementById('btn-confirmar-logout').addEventListener('click', () => {
    usuarioAutenticado = false;
    document.getElementById('user-name-display').textContent = 'Iniciar sesión'; 
    document.getElementById('btn-nav-logout').style.display = 'none';
    
    // Limpiamos los inputs del login para mayor realismo
    document.getElementById('login-email').value = 'carlos@ejemplo.com';
    document.getElementById('login-pass').value = '123456';
    
    cerrarModal('modal-logout');
    mostrarVista('inicio');
});

document.getElementById('btn-continuar-retiro').addEventListener('click', () => {
    if (!usuarioAutenticado) {
        vistaPostLogin = 'retiro';
        mostrarVista('login');
        return;
    }
    
    let total = 0, htmlStr = '';
    carrito.forEach(i => { htmlStr += `${i.nombre} x ${i.cantidad}<br>`; total += i.precio * i.cantidad; });
    document.getElementById('resumen-retiro-items').innerHTML = htmlStr;
    document.getElementById('resumen-retiro-total').textContent = `$${total.toLocaleString('es-EC',{minimumFractionDigits:2})}`;
    mostrarVista('retiro');
});

document.getElementById('btn-continuar-pago').addEventListener('click', () => {
    let total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    document.getElementById('resumen-pago-total').textContent = `$${total.toLocaleString('es-EC',{minimumFractionDigits:2})}`;
    mostrarVista('pago');
});

document.getElementsByName('metodo-pago').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if(e.target.value === 'tarjeta') {
            document.getElementById('form-tarjeta').style.display = 'grid';
            document.getElementById('form-efectivo').style.display = 'none';
            document.getElementById('txt-resumen-metodo').textContent = 'Pago: Tarjeta';
        } else {
            document.getElementById('form-tarjeta').style.display = 'none';
            document.getElementById('form-efectivo').style.display = 'block';
            document.getElementById('txt-resumen-metodo').textContent = 'Pago: Efectivo al retirar';
        }
    });
});

document.getElementById('btn-confirmar-pago').addEventListener('click', () => {
    const metodo = document.querySelector('input[name="metodo-pago"]:checked').value;
    
    if (metodo === 'tarjeta') {
        const num = document.getElementById('cc-num').value.trim();
        const name = document.getElementById('cc-name').value.trim();
        const exp = document.getElementById('cc-exp').value.trim();
        const cvv = document.getElementById('cc-cvv').value.trim();
        
        // Validación estricta Tarjeta
        if (num.length !== 16 || name === '' || exp.length < 5 || cvv.length < 3) {
            return abrirModal('modal-error');
        }
    }
    
    const numPedido = "LS-" + Math.floor(10000 + Math.random() * 90000);
    let total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    
    document.getElementById('conf-pedido-num').textContent = `Pedido #${numPedido}`;
    document.getElementById('conf-total').textContent = `$${total.toLocaleString('es-EC',{minimumFractionDigits:2})}`;
    
    let htmlStr = '';
    carrito.forEach(i => { htmlStr += `${i.nombre} x ${i.cantidad}<br>`; });
    document.getElementById('conf-items').innerHTML = htmlStr;

    const estadoP = document.getElementById('conf-estado-pago');
    if(metodo === 'tarjeta'){ estadoP.textContent = 'Pago: Aprobado'; estadoP.className = 'text-success text-left mb-12'; }
    else { estadoP.textContent = 'Pago: Pendiente — Efectivo al retirar'; estadoP.className = 'text-sale text-left mb-12'; }

    pedidos.push({ num: numPedido, fecha: new Date().toLocaleDateString('es-EC'), total: total, estado: 'Confirmado', items: [...carrito] });
    carrito = []; actualizarBadgeCarrito(); mostrarVista('confirmacion');
});

// PEDIDOS
function renderizarPedidos() {
    if(!usuarioAutenticado) {
        vistaPostLogin = 'pedidos';
        mostrarVista('login');
        return;
    }

    const contLleno = document.getElementById('pedidos-llenos');
    const contVacio = document.getElementById('pedidos-vacio');

    if(pedidos.length === 0){ 
        contVacio.style.display = 'block'; 
        contLleno.style.display = 'none'; 
        return; 
    }
    
    contVacio.style.display = 'none'; 
    contLleno.style.display = 'block';
    
    const lista = document.getElementById('lista-pedidos');
    lista.innerHTML = '<div class="resumen-fila text-secondary"><span>Pedido</span><span>Fecha</span><span>Total</span><span>Estado</span><span></span></div>';
    
    pedidos.forEach((p, index) => {
        lista.innerHTML += `
        <div class="pedido-card">
            <strong>#${p.num}</strong>
            <span>${p.fecha}</span>
            <strong>$${p.total.toLocaleString('es-EC',{minimumFractionDigits:2})}</strong>
            <span class="text-success">✓ ${p.estado}</span>
            <span class="link-detalle" style="cursor:pointer;" onclick="verDetallePedido(${index})">Ver detalle →</span>
        </div>`;
    });
}

function verDetallePedido(index) {
    const p = pedidos[index];
    document.getElementById('md-num').textContent = `#${p.num}`;
    document.getElementById('md-estado').textContent = p.estado;
    document.getElementById('md-total').textContent = `$${p.total.toLocaleString('es-EC',{minimumFractionDigits:2})}`;
    
    let htmlItems = '';
    p.items.forEach(i => {
        htmlItems += `
        <div class="item-detalle-pedido">
            <img src="img/productos/${i.imagenes[0]}" alt="${i.nombre}">
            <div>
                <strong>${i.nombre}</strong> <br>
                <span class="text-secondary">${i.cantidad} unidad(es)</span>
            </div>
        </div>`;
    });
    document.getElementById('md-items').innerHTML = htmlItems;
    abrirModal('modal-detalle-pedido');
}

// NAVEGACION
function sincronizarBotonesActivos() {
    document.querySelectorAll('.header-nav .nav-btn, #lista-categorias .filtro-item').forEach(b => b.classList.remove('activo'));
    document.querySelectorAll(`[data-filtro="${filtroCat}"]`).forEach(b => b.classList.add('activo'));
    document.querySelectorAll('#lista-precios .filtro-item').forEach(b => b.classList.remove('activo'));
    document.querySelector(`#lista-precios [data-precio="${filtroPrec}"]`).classList.add('activo');
}

function limpiarFiltrosNav() { document.querySelectorAll('.header-nav .nav-btn').forEach(b => b.classList.remove('activo')); }

document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.addEventListener('click', (e) => { 
        if (!e.currentTarget.classList.contains('card-cat-click')) {
            searchInput.value = ''; filtroBusqueda = ''; 
        }
        filtroCat = e.currentTarget.dataset.filtro; 
        sincronizarBotonesActivos(); mostrarVista('catalogo'); actualizarCatalogo(); 
    });
});
document.querySelectorAll('[data-precio]').forEach(btn => {
    btn.addEventListener('click', (e) => { filtroPrec = e.currentTarget.dataset.precio; sincronizarBotonesActivos(); actualizarCatalogo(); });
});

document.querySelectorAll('.btn-explorar-general').forEach(btn => {
    btn.addEventListener('click', () => { filtroCat = 'camaras'; sincronizarBotonesActivos(); mostrarVista('catalogo'); actualizarCatalogo(); });
});
document.querySelectorAll('.btn-seguir-general').forEach(btn => {
    btn.addEventListener('click', () => { mostrarVista('catalogo'); actualizarCatalogo(); });
});


logoBtn.addEventListener('click', () => { searchInput.value=''; filtroBusqueda=''; mostrarVista('inicio'); });
btnAtrasGlobal.addEventListener('click', () => { searchInput.value=''; filtroBusqueda=''; mostrarVista('inicio'); });

document.getElementById('btn-nav-carrito').addEventListener('click', () => { renderizarCarrito(); mostrarVista('carrito'); });
document.getElementById('btn-nav-pedidos').addEventListener('click', () => { renderizarPedidos(); mostrarVista('pedidos'); });
document.getElementById('btn-ver-mis-pedidos-conf').addEventListener('click', () => { renderizarPedidos(); mostrarVista('pedidos'); });
document.getElementById('btn-nav-login').addEventListener('click', () => {
    if(!usuarioAutenticado) mostrarVista('login');
});

// Formateo automático de MM/AA
const ccExpInput = document.getElementById('cc-exp');
if (ccExpInput) {
    ccExpInput.addEventListener('input', function (e) {
        let valor = e.target.value.replace(/\D/g, ''); // Elimina todo lo que no sea número
        if (valor.length > 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
        }
        e.target.value = valor;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarInicio();
    actualizarCatalogo();
});

// ACCESIBILIDAD: Cerrar modales con la tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        const modalesAbiertos = document.querySelectorAll('.modal');
        modalesAbiertos.forEach(modal => {
            modal.style.display = 'none';
        });
        document.getElementById('overlay').style.display = 'none';
    }
});