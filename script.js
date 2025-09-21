const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOV26as2bsWMXhMGfnIcQY25nAZA1T2M3KsffmpZEVsQa431IRnrFhUyQ-jQAWWosh309a-DyoHIfK/pub?output=csv";

let productos = [];
let categorias = new Set();
let carrito = [];

// Cargar productos desde Google Sheets
async function cargarProductos() {
  try {
    const resp = await fetch(SHEET_URL);
    const data = await resp.text();
    const filas = data.split("\n").map(r => r.split(","));
    const headers = filas[0].map(h => h.trim());

    productos = [];
    categorias.clear();

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if(fila.length < headers.length) continue;
      let prod = {};
      headers.forEach((h, idx) => prod[h] = fila[idx] ? fila[idx].trim() : "");
      if(prod.Visible.toUpperCase() === "TRUE") {
        productos.push(prod);
        categorias.add(prod.Categoria);
      }
    }

    llenarFiltroCategorias();
    mostrarCatalogo(productos);

  } catch(error) {
    console.error("Error cargando productos desde Google Sheets:", error);
  }
}

// Llenar select categorías
function llenarFiltroCategorias() {
  const select = document.getElementById("filtro-categoria");
  select.innerHTML = `<option value="todas">Todas las categorías</option>`;
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Mostrar catálogo
function mostrarCatalogo(lista) {
  const catalogoDiv = document.getElementById("catalogo");
  catalogoDiv.innerHTML = "";

  const agrupados = {};
  lista.forEach(p => {
    if(p.Visible.toUpperCase() === "TRUE") {
      if(!agrupados[p.Categoria]) agrupados[p.Categoria]=[];
      agrupados[p.Categoria].push(p);
    }
  });

  for(let cat in agrupados){
    const section = document.createElement("div");
    section.classList.add("categoria");
    const h2 = document.createElement("h2");
    h2.textContent = cat;
    section.appendChild(h2);

    const contenedor = document.createElement("div");
    contenedor.classList.add("productos");

    agrupados[cat].forEach(p => {
      const card = document.createElement("div");
      card.classList.add("producto");
      card.innerHTML = `
        <img src="${p.Imagen}" alt="${p.Nombre}">
        <h3>${p.Nombre}</h3>
        <p>${p.Descripcion}</p>
        <p class="precio">$${p.Precio}</p>
        <p class="stock">Stock: ${p.Stock}</p>
        <button class="agregar-carrito">Agregar al carrito</button>
      `;
      contenedor.appendChild(card);
    });

    section.appendChild(contenedor);
    catalogoDiv.appendChild(section);
  }
}

// Filtros
function aplicarFiltros() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;

  const filtrados = productos.filter(p => {
    const coincideTexto = p.Nombre.toLowerCase().includes(texto) || p.Descripcion.toLowerCase().includes(texto);
    const coincideCategoria = categoria === "todas" || p.Categoria === categoria;
    return coincideTexto && coincideCategoria;
  });

  mostrarCatalogo(filtrados);
}

// Inicialización
function init() {
  cargarProductos();
  document.getElementById("buscador").addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-categoria").addEventListener("change", aplicarFiltros);
}

// Carrito
function actualizarContador() {
  document.getElementById("contador-carrito").textContent = carrito.reduce((acc,p)=>acc+p.cantidad,0);
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
    li.innerHTML = `${p.nombre} x${p.cantidad} - $${(p.precio*p.cantidad).toFixed(2)} <button onclick="eliminarProducto(${idx})">X</button>`;
    lista.appendChild(li);
  });

  document.getElementById("total-carrito").textContent = total.toFixed(2);
  actualizarContador();
}

function eliminarProducto(idx) {
  carrito.splice(idx,1);
  actualizarCarrito();
}

// Eventos
document.addEventListener("click", e=>{
  if(e.target.classList.contains("agregar-carrito")) {
    const card = e.target.closest(".producto");
    const nombre = card.querySelector("h3").textContent;
    const precio = parseFloat(card.querySelector(".precio").textContent.replace("$",""));

    const item = carrito.find(p => p.nombre === nombre);
    if(item) item.cantidad++;
    else carrito.push({nombre, precio, cantidad:1});

    actualizarCarrito();
  }

  if(e.target.id === "icono-carrito") abrirCarrito();
});

document.getElementById("cerrar-carrito").addEventListener("click", ()=>{
  document.getElementById("carrito-modal").style.display = "none";
});

document.getElementById("btn-enviar-pedido").addEventListener("click", ()=>{
  document.getElementById("formulario-modal").style.display = "flex";
});

document.getElementById("cerrar-formulario").addEventListener("click", ()=>{
  document.getElementById("formulario-modal").style.display = "none";
});

document.getElementById("formulario-pedido").addEventListener("submit", e=>{
  e.preventDefault();
  const form = e.target;
  let mensaje = `Pedido de ${form.nombre.value} (${form.correo.value}, ${form.telefono.value})\nDirección: ${form.direccion.value}\n\nProductos:\n`;
  carrito.forEach(p => mensaje += `${p.nombre} x${p.cantidad} - $${(p.precio*p.cantidad).toFixed(2)}\n`);

  alert("Pedido enviado:\n\n" + mensaje);

  carrito = [];
  actualizarCarrito();
  document.getElementById("formulario-modal").style.display = "none";
  document.getElementById("carrito-modal").style.display = "none";
});

// Ejecutar init
init();
