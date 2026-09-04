/* ==============================================================
   FICHA DE TERRENO
   HU 52 - Completar y enviar ficha
   HU 53 - Actualizar ficha existente
   HU 54 - Notificación de ficha enviada o actualizada
   HU 56 - Exportar ficha a PDF
   ============================================================== */

/* Ficha que se está mostrando en la vista de detalle */
let fichaEnDetalle = null;

/* ---------- Wizard ---------- */
function cambiarVista(paso) {
  if (paso > 0 && !validarPaso(paso - 1)) return;
  irAVista(paso);
}

/* Navega sin validar (se usa cuando la validación ya se hizo) */
function irAVista(paso) {
  document.querySelectorAll('#seccion-ficha .form-card').forEach(el => {
    el.classList.remove('active-view');
    el.classList.add('hidden-view');
  });

  const destino = document.getElementById('vista-' + paso);
  destino.classList.remove('hidden-view');
  destino.classList.add('active-view');

  const progreso = document.getElementById('wizard-progress');
  if (paso === 0) {
    progreso.style.display = 'none';
  } else {
    progreso.style.display = 'flex';
    for (let i = 1; i <= 3; i++) {
      document.getElementById('indicator-' + i).classList.toggle('active', i === paso);
    }
  }

  document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

/* Valida los campos obligatorios del paso que se está abandonando */
function validarPaso(paso) {
  if (paso < 1) return true;

  const vista = document.getElementById('vista-' + paso);
  if (!vista) return true;

  const faltantes = [];
  vista.querySelectorAll('input[required], select[required], textarea[required]').forEach(campo => {
    if (campoOculto(campo, vista)) return;            // campo desplegable no visible
    if (campo.type === 'radio') return;               // los radios se revisan aparte
    if (!campo.value.trim()) {
      faltantes.push(etiquetaDe(campo));
      campo.classList.add('campo-invalido');
    } else {
      campo.classList.remove('campo-invalido');
    }
  });

  if (paso === 2 && !valorRadio('donante')) faltantes.push('¿Es donante voluntario?');

  if (faltantes.length) {
    mostrarToast('Falta completar: ' + faltantes.slice(0, 3).join(', ') + (faltantes.length > 3 ? '…' : ''), 'error');
    return false;
  }
  return true;
}

/* Un campo cuenta como oculto si alguno de sus contenedores dentro de la vista
   está colapsado (por ejemplo "Especifique su sistema de salud").
   No se mira la vista misma, porque al enviar el formulario los pasos
   anteriores están ocultos y sus campos igual deben validarse. */
function campoOculto(campo, vista) {
  let nodo = campo;
  while (nodo && nodo !== vista) {
    if (nodo.style && nodo.style.display === 'none') return true;
    nodo = nodo.parentElement;
  }
  return false;
}

function etiquetaDe(campo) {
  const label = campo.closest('.form-group') && campo.closest('.form-group').querySelector('label');
  return label ? label.textContent.trim() : campo.id;
}

function valorRadio(nombre) {
  const marcado = document.querySelector('input[name="' + nombre + '"]:checked');
  return marcado ? marcado.value : '';
}

function marcarRadio(nombre, valor) {
  const opcion = document.querySelector('input[name="' + nombre + '"][value="' + valor + '"]');
  if (opcion) opcion.checked = true;
}

function toggleEspecificar(selectId, valorObjetivo, divId) {
  const select = document.getElementById(selectId);
  document.getElementById(divId).style.display = (select.value === valorObjetivo) ? 'block' : 'none';
}

function toggleRadio(nombreRadio, divId) {
  const div = document.getElementById(divId);
  const mostrar = valorRadio(nombreRadio) === 'si';
  div.style.display = mostrar ? 'block' : 'none';
  if (!mostrar && div.querySelector('input')) div.querySelector('input').value = '';
}

/* ---------- Precarga de la ficha existente (HU 53) ---------- */
function prepararFicha() {
  const ficha = DB.fichaDeUsuario(SESION.usuario);
  const banner = document.getElementById('ficha-estado');
  const btnVer = document.getElementById('btn-ver-ficha');
  const btnComenzar = document.getElementById('btn-comenzar');
  const btnEnviar = document.getElementById('btn-enviar-ficha');

  document.getElementById('saludo-titulo').textContent = '¡Hola, ' + SESION.nombre.split(' ')[0] + '!';

  if (!ficha) {
    banner.style.display = 'none';
    btnVer.hidden = true;
    btnComenzar.textContent = 'Comenzar Ficha';
    btnEnviar.textContent = 'Enviar Ficha';
    /* datos que ya conocemos del usuario */
    if (!document.getElementById('nombre').value) document.getElementById('nombre').value = SESION.nombre || '';
    if (!document.getElementById('rut').value)    document.getElementById('rut').value = SESION.rut || '';
    if (!document.getElementById('correo_inst').value) document.getElementById('correo_inst').value = SESION.correo || '';
    return;
  }

  banner.style.display = 'block';
  banner.innerHTML = '';
  const estado = document.createElement('strong');
  estado.textContent = ficha.estado === 'actualizada' ? 'Ficha actualizada' : 'Ficha enviada';
  const detalle = document.createElement('span');
  detalle.textContent = ' · versión ' + (ficha.version || 1) + ' · última modificación ' + DB.formatoFecha(ficha.actualizada);
  banner.appendChild(estado);
  banner.appendChild(detalle);

  btnVer.hidden = false;
  btnComenzar.textContent = 'Actualizar Ficha';
  btnEnviar.textContent = 'Guardar cambios';

  cargarFichaEnFormulario(ficha);
}

function cargarFichaEnFormulario(f) {
  const texto = ['nombre', 'rut', 'fecha_nacimiento', 'edad', 'telefono', 'correo_inst', 'correo_personal',
                 'asignatura', 'periodo', 'sistema_salud', 'sistema_salud_otros', 'domicilio', 'peso',
                 'estatura', 'grupo_sanguineo', 'alergia_detalle', 'enfermedad_detalle', 'lesion_detalle',
                 'situaciones_especiales', 'emergencia_nombre', 'emergencia_telefono'];

  texto.forEach(id => {
    const campo = document.getElementById(id);
    if (campo && f[id] !== undefined && f[id] !== null) campo.value = f[id];
  });

  marcarRadio('donante', f.donante);
  marcarRadio('alergia_radio', f.alergia || 'no');
  marcarRadio('enfermedad_radio', f.enfermedad || 'no');
  marcarRadio('lesion_radio', f.lesion || 'no');
  marcarRadio('declaracion_jurada', f.declaracion);

  for (let i = 1; i <= 8; i++) {
    if (f.protocolo && f.protocolo['preg_' + i]) marcarRadio('preg_' + i, f.protocolo['preg_' + i]);
  }

  toggleEspecificar('sistema_salud', 'otros', 'div_salud_otros');
  toggleRadio('alergia_radio', 'div_alergia');
  toggleRadio('enfermedad_radio', 'div_enfermedad');
  toggleRadio('lesion_radio', 'div_lesion');
}

/* ---------- Envío / actualización (HU 52 · 53 · 54) ---------- */
function recolectarFicha() {
  const valor = id => {
    const campo = document.getElementById(id);
    return campo ? campo.value.trim() : '';
  };

  const protocolo = {};
  for (let i = 1; i <= 8; i++) protocolo['preg_' + i] = valorRadio('preg_' + i);

  return {
    nombre: valor('nombre'),
    rut: valor('rut'),
    fecha_nacimiento: valor('fecha_nacimiento'),
    edad: valor('edad'),
    telefono: valor('telefono'),
    correo_inst: valor('correo_inst'),
    correo_personal: valor('correo_personal'),
    asignatura: valor('asignatura'),
    periodo: valor('periodo'),
    sistema_salud: valor('sistema_salud') === 'otros' ? valor('sistema_salud_otros') || 'otros' : valor('sistema_salud'),
    domicilio: valor('domicilio'),
    peso: valor('peso'),
    estatura: valor('estatura'),
    grupo_sanguineo: valor('grupo_sanguineo'),
    donante: valorRadio('donante'),
    alergia: valorRadio('alergia_radio'),
    alergia_detalle: valor('alergia_detalle'),
    enfermedad: valorRadio('enfermedad_radio'),
    enfermedad_detalle: valor('enfermedad_detalle'),
    lesion: valorRadio('lesion_radio'),
    lesion_detalle: valor('lesion_detalle'),
    situaciones_especiales: valor('situaciones_especiales'),
    emergencia_nombre: valor('emergencia_nombre'),
    emergencia_telefono: valor('emergencia_telefono'),
    declaracion: valorRadio('declaracion_jurada'),
    protocolo: protocolo
  };
}

function finalizarFormulario() {
  const error = document.getElementById('ficha-error');
  error.style.display = 'none';

  /* Si falta algo en un paso anterior, se vuelve a ese paso */
  if (!validarPaso(1)) { irAVista(1); return; }
  if (!validarPaso(2)) { irAVista(2); return; }

  const pendientes = [];
  for (let i = 1; i <= 8; i++) if (!valorRadio('preg_' + i)) pendientes.push(i);

  if (pendientes.length) {
    error.textContent = 'Debes responder todas las declaraciones del protocolo. Faltan las preguntas: ' + pendientes.join(', ') + '.';
    error.style.display = 'block';
    return;
  }

  if (valorRadio('declaracion_jurada') !== 'acuerdo') {
    error.textContent = 'Para habilitar tu participación debes aceptar la declaración jurada.';
    error.style.display = 'block';
    return;
  }

  const datos = recolectarFicha();
  const resultado = DB.guardarFicha(datos, SESION.usuario);
  const clasificacion = DB.clasificarFicha(resultado.ficha);

  const mensaje = resultado.esNueva
    ? 'Ficha enviada correctamente. El docente ya puede verla en su panel.'
    : 'Ficha actualizada correctamente (versión ' + resultado.ficha.version + ').';

  /* HU 54: aviso al estudiante y registro para el docente */
  mostrarToast(mensaje, 'exito');
  DB.agregarNotificacion(
    (resultado.esNueva ? 'Nueva ficha recibida de ' : 'Ficha actualizada por ') +
    datos.nombre + ' (' + DB.nombreAsignatura(datos.asignatura) + ')' +
    (clasificacion.nivel === 'critico' ? ' — marcada como CRÍTICA' : ''),
    clasificacion.nivel === 'critico' ? 'alerta' : 'exito'
  );
  renderNotificaciones();

  prepararFicha();
  cambiarVista(0);
}

/* ---------- Detalle imprimible (HU 56) ---------- */
function verFichaPropia() {
  const ficha = DB.fichaDeUsuario(SESION.usuario);
  if (ficha) verFicha(ficha.id);
}

function verFicha(id) {
  const ficha = DB.fichaPorId(id);
  if (!ficha) return;

  fichaEnDetalle = ficha;
  document.getElementById('detalle-ficha').innerHTML = plantillaFicha(ficha);
  mostrarSeccion('detalle');
}

function volverDeDetalle() {
  mostrarSeccion(SESION.rol === 'docente' ? 'fichas' : 'ficha');
}

function exportarFichaPDF() {
  /* El diálogo de impresión del navegador permite "Guardar como PDF" */
  window.print();
}

function plantillaFicha(f) {
  const clasificacion = DB.clasificarFicha(f);
  const si = v => v === 'si' ? 'Sí' : 'No';

  const fila = (etiqueta, valor) =>
    '<div class="detalle-item"><span class="detalle-label">' + escapar(etiqueta) +
    '</span><span class="detalle-valor">' + escapar(valor || '—') + '</span></div>';

  let protocolo = '';
  for (let i = 1; i <= 8; i++) {
    const r = (f.protocolo && f.protocolo['preg_' + i]) || '';
    protocolo += '<li>Declaración ' + i + ': <strong>' +
      (r === 'acuerdo' ? 'De acuerdo' : r === 'desacuerdo' ? 'En desacuerdo' : 'Sin responder') + '</strong></li>';
  }

  return '' +
    '<div class="detalle-encabezado">' +
      '<img src="../image/fi-1.png" alt="Geología UNAB">' +
      '<div>' +
        '<h2>Ficha de Ingreso — Salidas a Terreno</h2>' +
        '<p class="subtitle">' + escapar(DB.nombreAsignatura(f.asignatura)) + ' · Período ' + escapar(f.periodo || '—') + '</p>' +
      '</div>' +
      '<span class="badge badge-' + clasificacion.nivel + '">' + clasificacion.etiqueta + '</span>' +
    '</div>' +

    '<h3 class="detalle-titulo">Datos personales</h3>' +
    '<div class="detalle-grid">' +
      fila('Nombre completo', f.nombre) + fila('RUT', f.rut) +
      fila('Fecha de nacimiento', f.fecha_nacimiento) + fila('Edad', f.edad) +
      fila('Teléfono', f.telefono) + fila('Domicilio', f.domicilio) +
      fila('Correo institucional', f.correo_inst) + fila('Correo personal', f.correo_personal) +
    '</div>' +

    '<h3 class="detalle-titulo">Información médica</h3>' +
    '<div class="detalle-grid">' +
      fila('Sistema de salud', f.sistema_salud) + fila('Grupo sanguíneo', f.grupo_sanguineo) +
      fila('Peso (kg)', f.peso) + fila('Estatura (m)', f.estatura) +
      fila('Donante voluntario', si(f.donante)) +
      fila('Alergias', f.alergia === 'si' ? f.alergia_detalle : 'No declara') +
      fila('Enfermedad con tratamiento', f.enfermedad === 'si' ? f.enfermedad_detalle : 'No declara') +
      fila('Lesiones traumatológicas', f.lesion === 'si' ? f.lesion_detalle : 'No declara') +
      fila('Situaciones especiales', f.situaciones_especiales) +
    '</div>' +

    '<h3 class="detalle-titulo">Contacto de emergencia</h3>' +
    '<div class="detalle-grid">' +
      fila('Nombre', f.emergencia_nombre) + fila('Teléfono', f.emergencia_telefono) +
    '</div>' +

    '<h3 class="detalle-titulo">Protocolo y declaración</h3>' +
    '<ul class="detalle-lista">' + protocolo + '</ul>' +
    '<p><strong>Declaración jurada:</strong> ' +
      (f.declaracion === 'acuerdo' ? 'Aceptada' : 'No aceptada') + '</p>' +

    '<p class="detalle-pie">Estado: ' + escapar(f.estado) + ' · versión ' + (f.version || 1) +
    ' · enviada el ' + DB.formatoFecha(f.creada) +
    ' · última actualización ' + DB.formatoFecha(f.actualizada) + '</p>';
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto === undefined || texto === null ? '' : String(texto);
  return div.innerHTML;
}
