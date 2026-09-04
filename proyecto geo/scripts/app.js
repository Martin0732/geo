/* ==============================================================
   NÚCLEO DE LA APLICACIÓN
   Sesión, navegación entre secciones, avisos y utilidades comunes.
   ============================================================== */

let SESION = null;
let seccionActual = 'ficha';
let seccionPrevia = 'ficha';

const TITULOS = {
  ficha: 'Mi Ficha de Ingreso',
  fichas: 'Fichas recibidas',
  detalle: 'Detalle de ficha',
  estudiantes: 'Cursos y estudiantes',
  alertas: 'Alertas de salud',
  bitacora: 'Bitácora de terreno',
  reportes: 'Reportes de salida a terreno',
  calendario: 'Calendario de Salidas a Terreno'
};

function iniciarApp() {
  SESION = DB.sesion();

  if (!SESION) {
    window.location.replace('../index.html');
    return;
  }

  document.getElementById('account-avatar').textContent = (SESION.nombre || SESION.usuario).charAt(0).toUpperCase();
  document.getElementById('user-chip').textContent = SESION.nombre + ' · ' + (SESION.rol === 'docente' ? 'Docente' : 'Estudiante');

  aplicarPermisos();
  poblarSelectores();
  renderNotificaciones();

  /* El docente parte en el panel de fichas; el estudiante, en su ficha */
  mostrarSeccion(SESION.rol === 'docente' ? 'fichas' : 'ficha');
}

/* Oculta del menú lateral las secciones que no corresponden al rol */
function aplicarPermisos() {
  document.querySelectorAll('#sidebar-menu li[data-rol]').forEach(li => {
    if (li.dataset.rol !== SESION.rol) li.style.display = 'none';
  });

  /* El docente no llena ficha propia */
  if (SESION.rol === 'docente') {
    document.querySelector('#sidebar-menu li[data-seccion="ficha"]').style.display = 'none';
  }
}

function cerrarSesion() {
  if (!confirm('¿Cerrar sesión?')) return;
  DB.cerrarSesion();
  window.location.href = '../index.html';
}

/* ---------- Navegación ---------- */
function mostrarSeccion(seccion) {
  if (seccion !== 'detalle') seccionPrevia = seccion;
  seccionActual = seccion;

  document.querySelectorAll('.dashboard-container').forEach(el => el.classList.add('section-hidden'));
  const destino = document.getElementById('seccion-' + seccion);
  if (destino) destino.classList.remove('section-hidden');

  document.querySelectorAll('#sidebar-menu li[data-seccion]').forEach(li => {
    li.classList.toggle('active', li.dataset.seccion === seccion);
  });

  document.getElementById('page-title').textContent = TITULOS[seccion] || '';
  document.getElementById('notif-panel').classList.remove('abierto');

  if (seccion === 'ficha')       prepararFicha();
  if (seccion === 'fichas')      renderPanelFichas();
  if (seccion === 'estudiantes') renderEstudiantes();
  if (seccion === 'alertas')     renderAlertas();
  if (seccion === 'bitacora')    renderBitacora();
  if (seccion === 'reportes')    renderReportes();
  if (seccion === 'calendario')  renderCalendario();

  document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Selectores de asignatura y período ---------- */
function poblarSelectores() {
  const asignaturasTodas = [
    { id: 'filtro-fichas-asignatura',   texto: 'Todas las asignaturas' },
    { id: 'filtro-est-asignatura',      texto: '' },
    { id: 'filtro-alertas-asignatura',  texto: 'Todas las asignaturas' },
    { id: 'filtro-bitacora-asignatura', texto: 'Todas las asignaturas' },
    { id: 'filtro-rep-asignatura',      texto: 'Todas las asignaturas' },
    { id: 'asignatura',                 texto: 'Seleccione...' },
    { id: 'suceso-asignatura',          texto: '' },
    { id: 'rep-asignatura',             texto: '' }
  ];

  asignaturasTodas.forEach(cfg => {
    const select = document.getElementById(cfg.id);
    if (!select) return;
    select.innerHTML = '';
    if (cfg.texto) select.appendChild(nuevaOpcion('', cfg.texto));
    DB.ASIGNATURAS.forEach(a => select.appendChild(nuevaOpcion(a.codigo, a.codigo + ' · ' + a.nombre)));
  });

  const periodos = [
    { id: 'periodo',                 texto: 'Seleccione...' },
    { id: 'filtro-est-periodo',      texto: '' },
    { id: 'filtro-bitacora-periodo', texto: 'Todos los períodos' },
    { id: 'suceso-periodo',          texto: '' },
    { id: 'rep-periodo',             texto: '' }
  ];

  periodos.forEach(cfg => {
    const select = document.getElementById(cfg.id);
    if (!select) return;
    select.innerHTML = '';
    if (cfg.texto) select.appendChild(nuevaOpcion('', cfg.texto));
    DB.PERIODOS.forEach(p => select.appendChild(nuevaOpcion(p, p)));
  });
}

function nuevaOpcion(valor, texto) {
  const op = document.createElement('option');
  op.value = valor;
  op.textContent = texto;
  return op;
}

/* ---------- Avisos emergentes (HU 54) ---------- */
function mostrarToast(mensaje, tipo) {
  const stack = document.getElementById('toast-stack');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (tipo || 'info');
  toast.textContent = mensaje;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('saliendo');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ---------- Campana de notificaciones (HU 54) ---------- */
function alternarNotificaciones() {
  document.getElementById('notif-panel').classList.toggle('abierto');
}

function renderNotificaciones() {
  const lista = document.getElementById('notif-lista');
  const badge = document.getElementById('bell-badge');
  const notifs = DB.notificaciones();

  lista.innerHTML = '';
  if (!notifs.length) {
    const vacio = document.createElement('li');
    vacio.className = 'notif-vacia';
    vacio.textContent = 'Sin notificaciones.';
    lista.appendChild(vacio);
  } else {
    notifs.slice(0, 15).forEach(n => {
      const item = document.createElement('li');
      item.className = 'notif-item' + (n.leida ? '' : ' no-leida');
      item.innerHTML = '<span class="notif-texto"></span><span class="notif-fecha"></span>';
      item.querySelector('.notif-texto').textContent = n.texto;
      item.querySelector('.notif-fecha').textContent = DB.formatoFecha(n.fecha);
      lista.appendChild(item);
    });
  }

  const sinLeer = notifs.filter(n => !n.leida).length;
  badge.textContent = sinLeer;
  badge.style.display = sinLeer ? 'flex' : 'none';
}

function limpiarNotificaciones() {
  DB.marcarNotificacionesLeidas();
  renderNotificaciones();
}

/* ---------- Utilidades compartidas ---------- */
function celda(texto) {
  const td = document.createElement('td');
  td.textContent = texto === undefined || texto === null || texto === '' ? '—' : texto;
  return td;
}

function filaVacia(tbody, columnas, mensaje) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = columnas;
  td.className = 'tabla-vacia';
  td.textContent = mensaje;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function etiquetaRiesgo(clasificacion) {
  const span = document.createElement('span');
  span.className = 'badge badge-' + clasificacion.nivel;
  span.textContent = clasificacion.etiqueta;
  return span;
}

/* Cierra el panel de notificaciones al hacer clic fuera */
document.addEventListener('click', function (e) {
  const panel = document.getElementById('notif-panel');
  if (!panel || !panel.classList.contains('abierto')) return;
  if (panel.contains(e.target) || e.target.closest('.bell-btn')) return;
  panel.classList.remove('abierto');
});
