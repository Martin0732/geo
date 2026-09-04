/* ==============================================================
   PANELES DEL DOCENTE
   HU 55 - Panel de fichas recibidas
   HU 57 - Cargar listado de estudiantes por asignatura
   HU 58 - Filtrar información por asignatura
   HU 59 - Dashboard de fichas actualizadas
   HU 60 - Marcado automático de estudiante crítico
   HU 61 - Listado de estudiantes con condiciones
   ============================================================== */

/* ==============================================================
   PANEL DE FICHAS RECIBIDAS (HU 55 · 58 · 59)
   ============================================================== */
function renderPanelFichas() {
  const asignatura = document.getElementById('filtro-fichas-asignatura').value;
  const estado     = document.getElementById('filtro-fichas-estado').value;
  const texto      = document.getElementById('filtro-fichas-texto').value.trim().toLowerCase();

  const fichas = DB.fichas().filter(f => {
    if (asignatura && f.asignatura !== asignatura) return false;
    if (estado && f.estado !== estado) return false;
    if (texto && !((f.nombre || '') + ' ' + (f.rut || '')).toLowerCase().includes(texto)) return false;
    return true;
  }).sort((a, b) => new Date(b.actualizada) - new Date(a.actualizada));

  renderStatsFichas(asignatura);

  const tbody = document.querySelector('#tabla-fichas tbody');
  tbody.innerHTML = '';

  if (!fichas.length) {
    filaVacia(tbody, 7, 'No hay fichas que coincidan con el filtro.');
    return;
  }

  fichas.forEach(f => {
    const clasificacion = DB.clasificarFicha(f);
    const tr = document.createElement('tr');
    if (clasificacion.nivel === 'critico') tr.classList.add('fila-critica');

    tr.appendChild(celda(f.nombre));
    tr.appendChild(celda(f.rut));
    tr.appendChild(celda(DB.nombreAsignatura(f.asignatura)));

    const tdEstado = document.createElement('td');
    const badgeEstado = document.createElement('span');
    badgeEstado.className = 'badge badge-' + (f.estado === 'actualizada' ? 'actualizada' : 'enviada');
    badgeEstado.textContent = f.estado === 'actualizada' ? 'Actualizada v' + f.version : 'Enviada';
    tdEstado.appendChild(badgeEstado);
    tr.appendChild(tdEstado);

    const tdRiesgo = document.createElement('td');
    tdRiesgo.appendChild(etiquetaRiesgo(clasificacion));
    tr.appendChild(tdRiesgo);

    tr.appendChild(celda(DB.formatoFecha(f.actualizada)));

    const tdAcciones = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-tabla';
    btn.textContent = 'Ver ficha';
    btn.onclick = () => verFicha(f.id);
    tdAcciones.appendChild(btn);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });
}

/* Dashboard: cobertura de fichas y actualizaciones (HU 59) */
function renderStatsFichas(asignatura) {
  const inscritos = DB.estudiantesPorAsignatura(asignatura, '');
  const fichas = DB.fichas().filter(f => !asignatura || f.asignatura === asignatura);

  const rutsConFicha = new Set(fichas.map(f => f.rut));
  const conFicha = inscritos.filter(e => rutsConFicha.has(e.rut)).length;
  const actualizadas = fichas.filter(f => f.estado === 'actualizada').length;
  const criticas = fichas.filter(f => DB.clasificarFicha(f).nivel === 'critico').length;
  const cobertura = inscritos.length ? Math.round((conFicha / inscritos.length) * 100) : 0;

  pintarStats('stats-fichas', [
    { valor: fichas.length,            etiqueta: 'Fichas recibidas' },
    { valor: actualizadas,             etiqueta: 'Fichas actualizadas' },
    { valor: cobertura + '%',          etiqueta: 'Cobertura del curso', detalle: conFicha + ' de ' + inscritos.length + ' inscritos' },
    { valor: criticas,                 etiqueta: 'Fichas críticas', tono: criticas ? 'critico' : 'normal' }
  ]);
}

function pintarStats(contenedorId, tarjetas) {
  const cont = document.getElementById(contenedorId);
  cont.innerHTML = '';
  tarjetas.forEach(t => {
    const div = document.createElement('div');
    div.className = 'stat-card' + (t.tono === 'critico' ? ' stat-critico' : '');
    div.innerHTML = '<div class="stat-valor"></div><div class="stat-etiqueta"></div><div class="stat-detalle"></div>';
    div.querySelector('.stat-valor').textContent = t.valor;
    div.querySelector('.stat-etiqueta').textContent = t.etiqueta;
    div.querySelector('.stat-detalle').textContent = t.detalle || '';
    cont.appendChild(div);
  });
}

/* ==============================================================
   CURSOS Y ESTUDIANTES (HU 57 · 58)
   ============================================================== */
function renderEstudiantes() {
  const asignatura = document.getElementById('filtro-est-asignatura').value;
  const periodo    = document.getElementById('filtro-est-periodo').value;

  const lista = DB.estudiantesPorAsignatura(asignatura, periodo)
                  .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const fichas = DB.fichas();

  const tbody = document.querySelector('#tabla-estudiantes tbody');
  tbody.innerHTML = '';

  if (!lista.length) {
    filaVacia(tbody, 6, 'No hay estudiantes cargados para esta asignatura y período.');
    return;
  }

  lista.forEach(e => {
    const ficha = fichas.find(f => f.rut === e.rut);
    const tr = document.createElement('tr');

    tr.appendChild(celda(e.nombre));
    tr.appendChild(celda(e.rut));
    tr.appendChild(celda(e.correo));
    tr.appendChild(celda(DB.nombreAsignatura(e.asignatura)));
    tr.appendChild(celda(e.periodo));

    const tdFicha = document.createElement('td');
    if (ficha) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-tabla';
      btn.textContent = ficha.estado === 'actualizada' ? 'Actualizada v' + ficha.version : 'Enviada';
      btn.onclick = () => verFicha(ficha.id);
      tdFicha.appendChild(btn);
    } else {
      const span = document.createElement('span');
      span.className = 'badge badge-sin-ficha';
      span.textContent = 'Pendiente';
      tdFicha.appendChild(span);
    }
    tr.appendChild(tdFicha);

    tbody.appendChild(tr);
  });
}

/* Carga de un CSV: rut,nombre,correo */
function cargarArchivoEstudiantes() {
  const input = document.getElementById('archivo-estudiantes');
  const asignatura = document.getElementById('filtro-est-asignatura').value;
  const periodo    = document.getElementById('filtro-est-periodo').value;

  if (!input.files.length) {
    mostrarToast('Selecciona un archivo CSV primero.', 'error');
    return;
  }
  if (!asignatura || !periodo) {
    mostrarToast('Elige la asignatura y el período antes de cargar el listado.', 'error');
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    const resultado = procesarCSVEstudiantes(lector.result, asignatura, periodo);

    if (resultado.error) {
      mostrarToast(resultado.error, 'error');
      return;
    }

    const conteo = DB.agregarEstudiantes(resultado.estudiantes);
    mostrarToast(
      conteo.agregados + ' estudiante(s) cargados en ' + DB.nombreAsignatura(asignatura) +
      (conteo.omitidos ? ' · ' + conteo.omitidos + ' ya estaban inscritos' : ''),
      'exito'
    );
    input.value = '';
    renderEstudiantes();
  };
  lector.readAsText(input.files[0], 'UTF-8');
}

function procesarCSVEstudiantes(contenido, asignatura, periodo) {
  const lineas = contenido.split(/\r?\n/).filter(l => l.trim());
  if (!lineas.length) return { error: 'El archivo está vacío.' };

  /* Se ignora la fila de encabezado si viene incluida */
  const primera = lineas[0].toLowerCase();
  if (primera.includes('rut') && primera.includes('nombre')) lineas.shift();

  const estudiantes = [];
  const invalidas = [];

  lineas.forEach((linea, i) => {
    const partes = linea.split(/[,;]/).map(p => p.trim().replace(/^"|"$/g, ''));
    if (partes.length < 2 || !partes[0] || !partes[1]) {
      invalidas.push(i + 1);
      return;
    }
    estudiantes.push({
      rut: partes[0],
      nombre: partes[1],
      correo: partes[2] || '',
      asignatura: asignatura,
      periodo: periodo
    });
  });

  if (!estudiantes.length) return { error: 'No se encontró ninguna fila válida (formato: rut,nombre,correo).' };
  return { estudiantes: estudiantes, invalidas: invalidas };
}

function descargarPlantillaCSV() {
  const contenido = 'rut,nombre,correo\n20.111.222-3,Juan Pérez,j.perez@uandresbello.edu\n';
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = 'plantilla_estudiantes.csv';
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/* ==============================================================
   ALERTAS DE SALUD (HU 60 · 61)
   ============================================================== */
function fichasConAlerta(asignatura, nivel) {
  return DB.fichas()
    .filter(f => !asignatura || f.asignatura === asignatura)
    .map(f => ({ ficha: f, clasificacion: DB.clasificarFicha(f) }))
    .filter(x => nivel ? x.clasificacion.nivel === nivel
                       : (x.clasificacion.nivel === 'critico' || x.clasificacion.nivel === 'atencion'))
    .sort((a, b) => (a.clasificacion.nivel === 'critico' ? -1 : 1) - (b.clasificacion.nivel === 'critico' ? -1 : 1));
}

function renderAlertas() {
  const asignatura = document.getElementById('filtro-alertas-asignatura').value;
  const nivel      = document.getElementById('filtro-alertas-nivel').value;
  const registros  = fichasConAlerta(asignatura, nivel);

  const todas = DB.fichas().filter(f => !asignatura || f.asignatura === asignatura);
  const criticos = todas.filter(f => DB.clasificarFicha(f).nivel === 'critico').length;
  const atencion = todas.filter(f => DB.clasificarFicha(f).nivel === 'atencion').length;

  pintarStats('stats-alertas', [
    { valor: criticos, etiqueta: 'Estudiantes críticos', tono: criticos ? 'critico' : 'normal' },
    { valor: atencion, etiqueta: 'Requieren atención' },
    { valor: todas.length - criticos - atencion, etiqueta: 'Sin antecedentes' },
    { valor: todas.length, etiqueta: 'Fichas revisadas' }
  ]);

  const tbody = document.querySelector('#tabla-alertas tbody');
  tbody.innerHTML = '';

  if (!registros.length) {
    filaVacia(tbody, 6, 'Ningún estudiante con condiciones declaradas en este filtro.');
    return;
  }

  registros.forEach(({ ficha, clasificacion }) => {
    const tr = document.createElement('tr');
    if (clasificacion.nivel === 'critico') tr.classList.add('fila-critica');

    tr.appendChild(celda(ficha.nombre));
    tr.appendChild(celda(ficha.rut));
    tr.appendChild(celda(DB.nombreAsignatura(ficha.asignatura)));

    const tdNivel = document.createElement('td');
    tdNivel.appendChild(etiquetaRiesgo(clasificacion));
    tr.appendChild(tdNivel);

    const tdMotivos = document.createElement('td');
    const ul = document.createElement('ul');
    ul.className = 'motivos';
    clasificacion.motivos.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      ul.appendChild(li);
    });
    tdMotivos.appendChild(ul);
    tr.appendChild(tdMotivos);

    tr.appendChild(celda((ficha.emergencia_nombre || '—') + ' · ' + (ficha.emergencia_telefono || '—')));
    tbody.appendChild(tr);
  });
}
