/* ==============================================================
   BITÁCORA DE TERRENO
   HU 63 - Registrar sucesos en terreno
   HU 64 - Asociar sucesos a estudiante, asignatura y período
   ============================================================== */

const TIPOS_SUCESO = {
  observacion: 'Observación',
  incidente: 'Incidente',
  accidente: 'Accidente',
  salud: 'Atención de salud',
  logistica: 'Logística'
};

/* Rellena el desplegable de estudiantes según asignatura y período elegidos */
function actualizarEstudiantesSuceso() {
  const asignatura = document.getElementById('suceso-asignatura').value;
  const periodo    = document.getElementById('suceso-periodo').value;
  const select     = document.getElementById('suceso-estudiante');

  select.innerHTML = '';
  select.appendChild(nuevaOpcion('', 'Sin estudiante específico'));

  DB.estudiantesPorAsignatura(asignatura, periodo).forEach(e => {
    select.appendChild(nuevaOpcion(e.rut, e.nombre + ' — ' + e.rut));
  });
}

function registrarSuceso() {
  const fecha       = document.getElementById('suceso-fecha').value;
  const tipo        = document.getElementById('suceso-tipo').value;
  const asignatura  = document.getElementById('suceso-asignatura').value;
  const periodo     = document.getElementById('suceso-periodo').value;
  const rut         = document.getElementById('suceso-estudiante').value;
  const lugar       = document.getElementById('suceso-lugar').value.trim();
  const descripcion = document.getElementById('suceso-descripcion').value.trim();

  if (!fecha)       { mostrarToast('Indica la fecha del suceso.', 'error'); return; }
  if (!asignatura)  { mostrarToast('Selecciona la asignatura.', 'error'); return; }
  if (!periodo)     { mostrarToast('Selecciona el período.', 'error'); return; }
  if (!descripcion) { mostrarToast('Describe el suceso antes de registrarlo.', 'error'); return; }

  const estudiante = rut ? DB.estudiantes().find(e => e.rut === rut) : null;

  DB.agregarSuceso({
    fecha: fecha,
    tipo: tipo,
    asignatura: asignatura,
    periodo: periodo,
    rut: rut,
    estudiante: estudiante ? estudiante.nombre : '',
    lugar: lugar,
    descripcion: descripcion,
    docente: SESION.nombre
  });

  DB.agregarNotificacion(
    'Nuevo suceso en bitácora (' + TIPOS_SUCESO[tipo] + ') — ' + DB.nombreAsignatura(asignatura),
    tipo === 'accidente' ? 'alerta' : 'info'
  );
  renderNotificaciones();

  document.getElementById('suceso-descripcion').value = '';
  document.getElementById('suceso-lugar').value = '';
  mostrarToast('Suceso registrado en la bitácora.', 'exito');
  renderBitacora();
}

function renderBitacora() {
  /* Al abrir la sección: fecha de hoy por defecto y listas sincronizadas */
  const campoFecha = document.getElementById('suceso-fecha');
  if (!campoFecha.value) campoFecha.value = new Date().toISOString().slice(0, 10);
  if (!document.getElementById('suceso-estudiante').options.length) actualizarEstudiantesSuceso();

  const asignatura = document.getElementById('filtro-bitacora-asignatura').value;
  const periodo    = document.getElementById('filtro-bitacora-periodo').value;

  const sucesos = DB.bitacora().filter(s =>
    (!asignatura || s.asignatura === asignatura) &&
    (!periodo || s.periodo === periodo)
  );

  const tbody = document.querySelector('#tabla-bitacora tbody');
  tbody.innerHTML = '';

  if (!sucesos.length) {
    filaVacia(tbody, 8, 'Todavía no hay sucesos registrados para este filtro.');
    return;
  }

  sucesos.forEach(s => {
    const tr = document.createElement('tr');
    if (s.tipo === 'accidente') tr.classList.add('fila-critica');

    tr.appendChild(celda(DB.formatoFechaCorta(s.fecha)));

    const tdTipo = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + (s.tipo === 'accidente' ? 'critico' : s.tipo === 'incidente' || s.tipo === 'salud' ? 'atencion' : 'normal');
    badge.textContent = TIPOS_SUCESO[s.tipo] || s.tipo;
    tdTipo.appendChild(badge);
    tr.appendChild(tdTipo);

    tr.appendChild(celda(DB.nombreAsignatura(s.asignatura)));
    tr.appendChild(celda(s.periodo));
    tr.appendChild(celda(s.estudiante || 'Grupo completo'));
    tr.appendChild(celda(s.lugar));
    tr.appendChild(celda(s.descripcion));

    const tdAcciones = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-tabla btn-tabla-peligro';
    btn.textContent = 'Eliminar';
    btn.onclick = () => {
      if (!confirm('¿Eliminar este suceso de la bitácora?')) return;
      DB.eliminarSuceso(s.id);
      renderBitacora();
    };
    tdAcciones.appendChild(btn);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });
}
