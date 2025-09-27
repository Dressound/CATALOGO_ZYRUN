const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOV26as2bsWMXhMGfnIcQY25nAZA1T2M3KsffmpZEVsQa431IRnrFhUyQ-jQAWWosh309a-DyoHIfK/pub?output=csv";

let productos = [];
let categorias = new Set();
let carrito = [];

// ----------------------
// Cargar productos desde Google Sheets
// ----------------------
async function cargarProductos() {
  try {
    const resp = await fetch(SHEET_URL);
    const data = await resp.text();
    const filas = data.split("\n").map((r) => r.split(","));
    const headers = filas[0].map((h) => h.trim());

    productos = [];
    categorias.clear();

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (fila.length < headers.length) continue;
      let prod = {};
      headers.forEach(
        (h, idx) => (prod[h] = fila[idx] ? fila[idx].trim() : "")
      );
      if (prod.Visible.toUpperCase() === "TRUE") {
        productos.push(prod);
        categorias.add(prod.Categoria);
      }
    }

    llenarFiltroCategorias();
    mostrarCatalogo(productos);
  } catch (error) {
    console.error("Error cargando productos desde Google Sheets:", error);
  }
}

// ----------------------
// Llenar select categorías
// ----------------------
function llenarFiltroCategorias() {
  const select = document.getElementById("filtro-categoria");
  select.innerHTML = `<option value="todas">Todas las categorías</option>`;
  categorias.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// ----------------------
// Mostrar catálogo
// ----------------------
function mostrarCatalogo(lista) {
  const catalogoDiv = document.getElementById("catalogo");
  catalogoDiv.innerHTML = "";

  const agrupados = {};
  lista.forEach((p) => {
    if (p.Visible.toUpperCase() === "TRUE") {
      if (!agrupados[p.Categoria]) agrupados[p.Categoria] = [];
      agrupados[p.Categoria].push(p);
    }
  });

  for (let cat in agrupados) {
    const section = document.createElement("div");
    section.classList.add("categoria");
    const h2 = document.createElement("h2");
    h2.textContent = cat;
    section.appendChild(h2);

    const contenedor = document.createElement("div");
    contenedor.classList.add("productos");

    agrupados[cat].forEach((p) => {
      const card = document.createElement("div");
      card.classList.add("producto");
      card.innerHTML = `
        <div class="id-etiqueta">${p.ID}</div> 
        <img src="${p.Imagen}" alt="${p.Nombre}">
        <h3>${p.Nombre}</h3>
        <p class="descripcion-producto">${p.Descripcion}</p>
        <p class="precio">$${p.Precio}</p>
        <p class="stock">Stock: ${p.Stock}</p>
        <button class="agregar-carrito">Agregar al carrito</button>
        <button class="leer-mas" aria-expanded="false">Leer más</button> 
      `;
      contenedor.appendChild(card);
    });

    section.appendChild(contenedor);
    catalogoDiv.appendChild(section);
  }

  // Activar acordeón y leer más
  habilitarAcordeon();
  habilitarLeerMas(3);
}

// ----------------------
// Filtros
// ----------------------
function aplicarFiltros() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const categoria = document.getElementById("filtro-categoria").value;
    // ✅ Obtener los valores de los nuevos inputs y parsearlos a número
    const precioMin = parseFloat(document.getElementById("precio-min").value);
    const precioMax = parseFloat(document.getElementById("precio-max").value);
  
    const filtrados = productos.filter((p) => {
      const coincideTexto =
        p.Nombre.toLowerCase().includes(texto) ||
        p.Descripcion.toLowerCase().includes(texto);
      const coincideCategoria =
        categoria === "todas" || p.Categoria === categoria;
  
      // ✅ Nuevo filtro de precio
      const precioProducto = parseFloat(p.Precio);
      const coincidePrecioMin = isNaN(precioMin) || precioProducto >= precioMin;
      const coincidePrecioMax = isNaN(precioMax) || precioProducto <= precioMax;
      // ------------------------
  
      // ✅ Combina todos los filtros
      return coincideTexto && coincideCategoria && coincidePrecioMin && coincidePrecioMax;
    });
  
    mostrarCatalogo(filtrados);
  }

// ----------------------
// Carrito
// ----------------------
function actualizarContador() {
  document.getElementById("contador-carrito").textContent = carrito.reduce(
    (acc, p) => acc + p.cantidad,
    0
  );
}

function abrirCarrito() {
  document.getElementById("carrito-modal").style.display = "flex";
  actualizarCarrito();
}

function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  lista.innerHTML = "";
  let total = 0;

  carrito.forEach((p, idx) => {
    total += p.precio * p.cantidad;
    const li = document.createElement("li");
    li.innerHTML = `${p.nombre} x${p.cantidad} - $${(
      p.precio * p.cantidad
    ).toFixed(2)} <button onclick="eliminarProducto(${idx})">X</button>`;
    lista.appendChild(li);
  });

  document.getElementById("total-carrito").textContent = total.toFixed(2);
  actualizarContador();
}

function eliminarProducto(idx) {
  carrito.splice(idx, 1);
  actualizarCarrito();
}


// Acordeón categorías (MODIFICADA PARA CIERRE EXCLUSIVO)
// ----------------------
function habilitarAcordeon() {
    const categorias = document.querySelectorAll(".categoria");
  
    categorias.forEach((cat) => {
      const titulo = cat.querySelector("h2");
      cat.classList.remove("abierta"); // Asegura que todas empiecen cerradas
  
      titulo.addEventListener("click", () => {
        // 1. Verificar si la categoría clicada ya estaba abierta
        const estabaAbierta = cat.classList.contains("abierta");
  
        // 2. Cerrar todas las categorías (exclusividad)
        categorias.forEach((c) => {
          c.classList.remove("abierta");
        });
  
        // 3. Si NO estaba abierta (o si estaba abierta y la cerramos antes), ábrela.
        // Si estaba abierta, después de ejecutar el paso 2 (cerrar todas) no volvemos a abrirla,
        // lo que efectivamente la mantiene cerrada (comportamiento de toggle).
        if (!estabaAbierta) {
          cat.classList.add("abierta");
        }
      });
    });
  }

// ----------------------
// Leer más / menos
// ----------------------
function habilitarLeerMas(lineas = 3) {
  // Seleccionamos todos los párrafos de descripción y sus botones
  const tarjetas = document.querySelectorAll(".producto");

  tarjetas.forEach((card) => {
    const par = card.querySelector(".descripcion-producto"); // Usamos la clase para el párrafo
    const btn = card.querySelector(".leer-mas");
    if (!par || !btn) return; // Asegurarse de que existan // Calcula la altura máxima para las líneas

    const lineHeight = parseFloat(getComputedStyle(par).lineHeight);
    const maxHeight = lineHeight * lineas; // Si el contenido es corto, ocultamos el botón

    if (par.scrollHeight <= maxHeight + 1) {
      btn.style.display = "none";
      return;
    } // Aplica la restricción inicial

    par.style.maxHeight = maxHeight + "px";
    par.style.overflow = "hidden"; // Añadir el evento al botón existente

    btn.addEventListener("click", () => {
      const expandido = btn.getAttribute("aria-expanded") === "true";
      if (!expandido) {
        par.style.maxHeight = par.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Leer menos";
      } else {
        par.style.maxHeight = maxHeight + "px";
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Leer más";
      }
    });

    par.parentNode.appendChild(btn);
  });
}

// ----------------------
// Inicialización
// ----------------------
function init() {
  cargarProductos();
  document.getElementById("buscador").addEventListener("input", aplicarFiltros);
  document
    .getElementById("filtro-categoria")
      .addEventListener("change", aplicarFiltros);
    // ✅ Agregar event listeners para los nuevos filtros de precio
    document.getElementById("precio-min").addEventListener("input", aplicarFiltros);
    document.getElementById("precio-max").addEventListener("input", aplicarFiltros);

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("agregar-carrito")) {
      const card = e.target.closest(".producto");
      const nombre = card.querySelector("h3").textContent;
      const precio = parseFloat(
        card.querySelector(".precio").textContent.replace("$", "")
      );
      const item = carrito.find((p) => p.nombre === nombre);
      if (item) item.cantidad++;
      else carrito.push({ nombre, precio, cantidad: 1 });
      actualizarCarrito();
    }

    if (e.target.id === "icono-carrito") abrirCarrito();
  });

  document.getElementById("cerrar-carrito").addEventListener("click", () => {
    document.getElementById("carrito-modal").style.display = "none";
  });

  document.getElementById("btn-enviar-pedido").addEventListener("click", () => {
    document.getElementById("formulario-modal").style.display = "flex";
  });

  document.getElementById("cerrar-formulario").addEventListener("click", () => {
    document.getElementById("formulario-modal").style.display = "none";
  });

  document
    .getElementById("formulario-pedido")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      let total = 0;

      // 1. Construir el mensaje de pedido detallado
      let mensaje = `*🚨 NUEVO PEDIDO EN LÍNEA 🚨*\n\n`;
      mensaje += `*CLIENTE:*\n`;
      mensaje += `👤 Nombre del Cliente:${form.nombre.value}\n`;
      mensaje += `📞 Telefono:${form.telefono.value}\n`; // El número del cliente es crucial
      mensaje += `📧 Correo electronico${form.correo.value}\n`;
      mensaje += `📍 Dirección de entrega: ${form.direccion.value}\n`;
      mensaje += `------------------------------------\n`;
      mensaje += `*PRODUCTOS:*\n`;

      carrito.forEach((p) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        mensaje += `✅ ${p.nombre} /TotalUnidades:${p.cantidad} (Precio:$${subtotal.toFixed(2)})\n`;
      });

      mensaje += `\n*TOTAL DEL PEDIDO: $${total.toFixed(2)}*\n`;
      mensaje += `------------------------------------`;


      // 2. Configurar el enlace de WhatsApp
      // NOTA: Usa tu número de WhatsApp completo (ej: 593993842259)
      const miNumeroWhatsApp = "593993842259"; 
      const textoCodificado = encodeURIComponent(mensaje);
      const whatsappURL = `https://wa.me/${miNumeroWhatsApp}?text=${textoCodificado}`;

      // 3. Abrir WhatsApp
      window.open(whatsappURL, "_blank");

      // 4. Limpieza post-envío
      carrito = [];
      actualizarCarrito();
      document.getElementById("formulario-modal").style.display = "none";
      document.getElementById("carrito-modal").style.display = "none";
      form.reset(); // Opcional: limpiar el formulario después del envío
    });
}

// ----------------------
// Ejecutar init
// ----------------------
init();
