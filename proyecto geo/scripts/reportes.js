/* ==============================================================
   REPORTES
   HU 62 - Reporte de estudiantes críticos previo a la salida
   HU 65 - Generar reporte automático de salida a terreno
   HU 66 - Envío del reporte al encargado de laboratorio
   HU 67 - Buscar reporte por asignatura
   ============================================================== */

const CORREO_LABORATORIO = 'laboratorio.geologia@unab.cl';

let reporteEnPantalla = null;

/* ---------- Armado del contenido (HU 65) ---------- */
function armarResumen(asignatura, periodo) {
  const inscritos = DB.estudiantesPorAsignatura(asignatura, periodo);
  const fichas = DB.fichas().filter(f => f.asignatura === asignatura && (!periodo || f.periodo === periodo));
  const rutsConFicha = new Set(fichas.map(f => f.rut));

  const criticos = [];
  const atencion = [];

  fichas.forEach(f => {
    const c = DB.clasificarFicha(f);
    const registro = {
      nombre: f.nombre,
      rut: f.rut,
      motivos: c.motivos,
      grupo_sanguineo: f.grupo_sanguineo,
      emergencia: (f.emergencia_nombre || '—') + ' · ' + (f.emergencia_telefono || '—')
    };
    if (c.nivel === 'critico') criticos.push(registro);
    if (c.nivel === 'atencion') atencion.push(registro);
  });

  const sucesos = DB.bitacora().filter(s =>
    s.asignatura === asignatura && (!periodo || s.periodo === periodo)
  );

  return {
    inscritos: inscritos.length,
    fichasRecibidas: fichas.length,
    fichasActualizadas: fichas.filter(f => f.estado === 'actualizada').length,
    pendientes: inscritos.filter(e => !rutsConFicha.has(e.rut)).map(e => e.nombre + ' (' + e.rut + ')'),
    criticos: criticos,
    atencion: atencion,
    sucesos: sucesos
  };
}

function generarReporteSalida() {
  const asignatura = document.getElementById('rep-asignatura').value;
  const periodo    = document.getElementById('rep-periodo').value;
  const fecha      = document.getElementById('rep-fecha').value;
  const lugar      = document.getElementById('rep-lugar').value.trim();

  if (!asignatura || !periodo) {
    mostrarToast('Selecciona asignatura y período para generar el reporte.', 'error');
    return;
  }

  const reporte = DB.agregarReporte({
    tipo: 'salida',
    titulo: 'Reporte de salida a terreno',
    asignatura: asignatura,
    periodo: periodo,
    fecha: fecha,
    lugar: lugar,
    docente: SESION.nombre,
    resumen: armarResumen(asignatura, periodo)
  });

  DB.agregarNotificacion('Reporte de salida generado — ' + DB.nombreAsignatura(asignatura) + ' (' + periodo + ')', 'info');
  renderNotificaciones();
  mostrarToast('Reporte generado.', 'exito');

  renderReportes();
  verReporte(reporte.id);
}

/* ---------- Reporte previo a la salida, solo críticos (HU 62) ---------- */
function generarReporteCriticos() {
  const asignatura = document.getElementById('filtro-alertas-asignatura').value;

  if (!asignatura) {
    mostrarToast('Selecciona una asignatura en el filtro para generar el reporte.', 'error');
    return;
  }

  const periodo = DB.PERIODOS[0];
  const resumen = armarResumen(asignatura, periodo);

  if (!resumen.criticos.length && !resumen.atencion.length) {
    mostrarToast('No hay estudiantes con condiciones declaradas en esta asignatura.', 'info');
    return;
  }

  const reporte = DB.agregarReporte({
    tipo: 'criticos',
    titulo: 'Reporte de estudiantes críticos previo a la salida',
    asignatura: asignatura,
    periodo: periodo,
    fecha: new Date().toISOString().slice(0, 10),
    lugar: '',
    docente: SESION.nombre,
    resumen: resumen
  });

  DB.agregarNotificacion(
    'Reporte de críticos generado — ' + DB.nombreAsignatura(asignatura) +
    ' (' + resumen.criticos.length + ' crítico(s))',
    resumen.criticos.length ? 'alerta' : 'info'
  );
  renderNotificaciones();

  mostrarSeccion('reportes');
  verReporte(reporte.id);
}

/* ---------- Listado y búsqueda (HU 67) ---------- */
function renderReportes() {
  const asignatura = document.getElementById('filtro-rep-asignatura').value;
  const texto      = document.getElementById('filtro-rep-texto').value.trim().toLowerCase();

  const lista = DB.reportes().filter(r => {
    if (asignatura && r.asignatura !== asignatura) return false;
    if (texto && !((r.lugar || '') + ' ' + (r.periodo || '') + ' ' + (r.titulo || '')).toLowerCase().includes(texto)) return false;
    return true;
  });

  const tbody = document.querySelector('#tabla-reportes tbody');
  tbody.innerHTML = '';

  if (!lista.length) {
    filaVacia(tbody, 7, 'Aún no hay reportes generados con este filtro.');
    return;
  }

  lista.forEach(r => {
    const tr = document.createElement('tr');
    const criticos = r.resumen.criticos.length;
    if (criticos) tr.classList.add('fila-critica');

    tr.appendChild(celda(DB.formatoFecha(r.generado)));
    tr.appendChild(celda(DB.nombreAsignatura(r.asignatura)));
    tr.appendChild(celda(r.periodo));
    tr.appendChild(celda(DB.formatoFechaCorta(r.fecha)));
    tr.appendChild(celda(r.lugar));

    const tdAlertas = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + (criticos ? 'critico' : 'normal');
    badge.textContent = criticos ? criticos + ' crítico(s)' : 'Sin críticos';
    tdAlertas.appendChild(badge);
    tr.appendChild(tdAlertas);

    const tdAcciones = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-tabla';
    btn.textContent = 'Ver';
    btn.onclick = () => verReporte(r.id);
    tdAcciones.appendChild(btn);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });
}

/* ---------- Detalle ---------- */
function verReporte(id) {
  const reporte = DB.reportePorId(id);
  if (!reporte) return;

  reporteEnPantalla = reporte;
  document.getElementById('reporte-detalle').innerHTML = plantillaReporte(reporte);
  document.getElementById('reporte-detalle-card').classList.remove('section-hidden');
  document.getElementById('reporte-detalle-card').scrollIntoView({ behavior: 'smooth' });
}

function cerrarDetalleReporte() {
  reporteEnPantalla = null;
  document.getElementById('reporte-detalle-card').classList.add('section-hidden');
}

function imprimirReporte() {
  document.body.classList.add('imprimir-reporte');
  window.print();
  setTimeout(() => document.body.classList.remove('imprimir-reporte'), 500);
}

function plantillaReporte(r) {
  const s = r.resumen;

  const listaPersonas = (personas, vacio) => {
    if (!personas.length) return '<p class="detalle-vacio">' + vacio + '</p>';
    return '<ul class="detalle-lista">' + personas.map(p =>
      '<li><strong>' + escapar(p.nombre) + '</strong> (' + escapar(p.rut) + ')' +
      ' — grupo ' + escapar(p.grupo_sanguineo || '—') +
      '<br><span class="detalle-sub">Emergencia: ' + escapar(p.emergencia) + '</span>' +
      '<ul>' + p.motivos.map(m => '<li>' + escapar(m) + '</li>').join('') + '</ul></li>'
    ).join('') + '</ul>';
  };

  const sucesos = s.sucesos.length
    ? '<ul class="detalle-lista">' + s.sucesos.map(x =>
        '<li>' + DB.formatoFechaCorta(x.fecha) + ' · <strong>' + escapar(TIPOS_SUCESO[x.tipo] || x.tipo) + '</strong>' +
        (x.estudiante ? ' — ' + escapar(x.estudiante) : '') +
        '<br><span class="detalle-sub">' + escapar(x.descripcion) + '</span></li>'
      ).join('') + '</ul>'
    : '<p class="detalle-vacio">Sin sucesos registrados en el período.</p>';

  return '' +
    '<div class="detalle-encabezado">' +
      '<img src="../image/fi-1.png" alt="Geología UNAB">' +
      '<div>' +
        '<h2>' + escapar(r.titulo) + '</h2>' +
        '<p class="subtitle">' + escapar(DB.nombreAsignatura(r.asignatura)) + ' · Período ' + escapar(r.periodo) +
        (r.lugar ? ' · ' + escapar(r.lugar) : '') + '</p>' +
      '</div>' +
    '</div>' +

    '<p class="detalle-sub">Generado por ' + escapar(r.docente) + ' el ' + DB.formatoFecha(r.generado) +
    (r.fecha ? ' · Salida programada: ' + DB.formatoFechaCorta(r.fecha) : '') + '</p>' +

    '<div class="detalle-grid">' +
      '<div class="detalle-item"><span class="detalle-label">Estudiantes inscritos</span><span class="detalle-valor">' + s.inscritos + '</span></div>' +
      '<div class="detalle-item"><span class="detalle-label">Fichas recibidas</span><span class="detalle-valor">' + s.fichasRecibidas + '</span></div>' +
      '<div class="detalle-item"><span class="detalle-label">Fichas actualizadas</span><span class="detalle-valor">' + s.fichasActualizadas + '</span></div>' +
      '<div class="detalle-item"><span class="detalle-label">Estudiantes críticos</span><span class="detalle-valor">' + s.criticos.length + '</span></div>' +
    '</div>' +

    '<h3 class="detalle-titulo">Estudiantes críticos</h3>' +
    listaPersonas(s.criticos, 'Ningún estudiante marcado como crítico.') +

    '<h3 class="detalle-titulo">Estudiantes que requieren atención</h3>' +
    listaPersonas(s.atencion, 'Ningún estudiante en este nivel.') +

    '<h3 class="detalle-titulo">Fichas pendientes</h3>' +
    (s.pendientes.length
      ? '<ul class="detalle-lista">' + s.pendientes.map(p => '<li>' + escapar(p) + '</li>').join('') + '</ul>'
      : '<p class="detalle-vacio">Todos los inscritos entregaron su ficha.</p>') +

    '<h3 class="detalle-titulo">Bitácora del período</h3>' + sucesos;
}

/* ---------- Envío al encargado de laboratorio (HU 66) ----------
   Sin backend de correo: se abre el cliente de correo del usuario con
   el reporte ya redactado para que lo revise y lo envíe.              */
function enviarReporteEncargado() {
  if (!reporteEnPantalla) return;

  const r = reporteEnPantalla;
  const s = r.resumen;

  const destinatario = prompt('Correo del encargado de laboratorio:', CORREO_LABORATORIO);
  if (!destinatario) return;

  const asunto = r.titulo + ' — ' + DB.nombreAsignatura(r.asignatura) + ' (' + r.periodo + ')';

  const cuerpo = [
    r.titulo,
    DB.nombreAsignatura(r.asignatura) + ' · Período ' + r.periodo + (r.lugar ? ' · ' + r.lugar : ''),
    'Generado por ' + r.docente + ' el ' + DB.formatoFecha(r.generado),
    '',
    'Estudiantes inscritos: ' + s.inscritos,
    'Fichas recibidas: ' + s.fichasRecibidas + ' (actualizadas: ' + s.fichasActualizadas + ')',
    'Fichas pendientes: ' + (s.pendientes.length ? s.pendientes.join('; ') : 'ninguna'),
    '',
    'ESTUDIANTES CRÍTICOS (' + s.criticos.length + '):',
    s.criticos.length
      ? s.criticos.map(p => '- ' + p.nombre + ' (' + p.rut + '): ' + p.motivos.join(' | ') + ' — Emergencia: ' + p.emergencia).join('\n')
      : '- Ninguno',
    '',
    'REQUIEREN ATENCIÓN (' + s.atencion.length + '):',
    s.atencion.length
      ? s.atencion.map(p => '- ' + p.nombre + ' (' + p.rut + '): ' + p.motivos.join(' | ')).join('\n')
      : '- Ninguno',
    '',
    'SUCESOS DE BITÁCORA (' + s.sucesos.length + '):',
    s.sucesos.length
      ? s.sucesos.map(x => '- ' + DB.formatoFechaCorta(x.fecha) + ' ' + (TIPOS_SUCESO[x.tipo] || x.tipo) + ': ' + x.descripcion).join('\n')
      : '- Ninguno'
  ].join('\n');

  window.location.href = 'mailto:' + encodeURIComponent(destinatario) +
    '?subject=' + encodeURIComponent(asunto) +
    '&body=' + encodeURIComponent(cuerpo);

  mostrarToast('Se abrió tu cliente de correo con el reporte listo para enviar.', 'info');
}
