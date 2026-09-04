/* ==============================================================
   CAPA DE DATOS
   Almacenamiento local (localStorage) mientras no exista backend.
   Todas las pantallas leen y escriben a través de este archivo.
   ============================================================== */

const DB = (() => {

  const CLAVES = {
    usuarios: 'geo_usuarios',
    fichas: 'geo_fichas',
    estudiantes: 'geo_estudiantes',
    bitacora: 'geo_bitacora',
    reportes: 'geo_reportes',
    notificaciones: 'geo_notificaciones',
    eventos: 'geo_eventos'
  };

  /* ---------- Catálogo de asignaturas ---------- */
  const ASIGNATURAS = [
    { codigo: 'GEO101', nombre: 'Geología General' },
    { codigo: 'GEO205', nombre: 'Petrología' },
    { codigo: 'GEO310', nombre: 'Geología Estructural' },
    { codigo: 'GEO420', nombre: 'Geología de Campo' }
  ];

  const PERIODOS = ['2026-1', '2026-2', '2025-2'];

  /* ---------- Datos semilla ---------- */
  const USUARIOS_SEMILLA = [
    {
      usuario: 'docente',
      clave: 'geo2026',
      nombre: 'Carla Reyes',
      correo: 'creyes@unab.cl',
      rol: 'docente',
      debeCambiarClave: false,
      asignaturas: ['GEO101', 'GEO205', 'GEO310', 'GEO420']
    },
    {
      usuario: 'estudiante',
      clave: 'geo2026',
      nombre: 'Juan Pérez',
      correo: 'j.perez@uandresbello.edu',
      rut: '20.111.222-3',
      rol: 'estudiante',
      debeCambiarClave: false,
      asignaturas: ['GEO101', 'GEO310']
    },
    {
      usuario: 'nuevo',
      clave: 'temporal123',
      nombre: 'Estudiante Nuevo',
      correo: 'nuevo@uandresbello.edu',
      rut: '21.333.444-5',
      rol: 'estudiante',
      debeCambiarClave: true,
      asignaturas: ['GEO101']
    }
  ];

  const ESTUDIANTES_SEMILLA = [
    { rut: '20.111.222-3', nombre: 'Juan Pérez',        correo: 'j.perez@uandresbello.edu',   asignatura: 'GEO101', periodo: '2026-1' },
    { rut: '20.111.222-3', nombre: 'Juan Pérez',        correo: 'j.perez@uandresbello.edu',   asignatura: 'GEO310', periodo: '2026-1' },
    { rut: '21.333.444-5', nombre: 'Estudiante Nuevo',  correo: 'nuevo@uandresbello.edu',     asignatura: 'GEO101', periodo: '2026-1' },
    { rut: '19.888.777-6', nombre: 'María Soto',        correo: 'm.soto@uandresbello.edu',    asignatura: 'GEO101', periodo: '2026-1' },
    { rut: '20.555.666-K', nombre: 'Diego Fuentes',     correo: 'd.fuentes@uandresbello.edu', asignatura: 'GEO205', periodo: '2026-1' },
    { rut: '20.777.888-1', nombre: 'Camila Rojas',      correo: 'c.rojas@uandresbello.edu',   asignatura: 'GEO205', periodo: '2026-1' },
    { rut: '19.222.333-4', nombre: 'Ignacio Muñoz',     correo: 'i.munoz@uandresbello.edu',   asignatura: 'GEO310', periodo: '2026-1' },
    { rut: '20.999.111-2', nombre: 'Valentina Díaz',    correo: 'v.diaz@uandresbello.edu',    asignatura: 'GEO420', periodo: '2026-1' }
  ];

  /* Una ficha de ejemplo para que el panel del docente no parta vacío */
  const FICHAS_SEMILLA = [
    {
      id: 'ficha-demo-1',
      usuario: 'msoto',
      rut: '19.888.777-6',
      nombre: 'María Soto',
      fecha_nacimiento: '2003-04-12',
      edad: 22,
      telefono: '+56 9 8765 4321',
      correo_inst: 'm.soto@uandresbello.edu',
      correo_personal: 'maria.soto@gmail.com',
      asignatura: 'GEO101',
      periodo: '2026-1',
      sistema_salud: 'fonasa',
      domicilio: 'Av. República 239, Santiago',
      peso: 58,
      estatura: 1.62,
      grupo_sanguineo: 'O+',
      donante: 'si',
      alergia: 'si',
      alergia_detalle: 'Penicilina',
      enfermedad: 'si',
      enfermedad_detalle: 'Asma bronquial, usa inhalador Salbutamol',
      lesion: 'no',
      lesion_detalle: '',
      situaciones_especiales: '',
      emergencia_nombre: 'Rosa Soto',
      emergencia_telefono: '+56 9 1111 2222',
      declaracion: 'acuerdo',
      protocolo: {},
      estado: 'enviada',
      version: 1,
      creada: '2026-03-10T14:00:00.000Z',
      actualizada: '2026-03-10T14:00:00.000Z'
    }
  ];

  /* ---------- Utilidades de lectura/escritura ---------- */
  function leer(clave, porDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : porDefecto;
    } catch (e) {
      console.warn('No se pudo leer', clave, e);
      return porDefecto;
    }
  }

  function escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  /* Carga los datos semilla la primera vez que se abre la aplicación */
  function inicializar() {
    if (!localStorage.getItem(CLAVES.usuarios))    escribir(CLAVES.usuarios, USUARIOS_SEMILLA);
    if (!localStorage.getItem(CLAVES.estudiantes)) escribir(CLAVES.estudiantes, ESTUDIANTES_SEMILLA);
    if (!localStorage.getItem(CLAVES.fichas))      escribir(CLAVES.fichas, FICHAS_SEMILLA);
    if (!localStorage.getItem(CLAVES.bitacora))    escribir(CLAVES.bitacora, []);
    if (!localStorage.getItem(CLAVES.reportes))    escribir(CLAVES.reportes, []);
    if (!localStorage.getItem(CLAVES.notificaciones)) escribir(CLAVES.notificaciones, []);
  }

  /* ---------- Usuarios / sesión ---------- */
  function usuarios()            { return leer(CLAVES.usuarios, []); }
  function guardarUsuarios(lista){ escribir(CLAVES.usuarios, lista); }

  function buscarUsuario(identificador) {
    const id = (identificador || '').trim().toLowerCase();
    return usuarios().find(u =>
      u.usuario.toLowerCase() === id ||
      (u.correo || '').toLowerCase() === id
    ) || null;
  }

  function actualizarUsuario(nombreUsuario, cambios) {
    const lista = usuarios();
    const i = lista.findIndex(u => u.usuario === nombreUsuario);
    if (i === -1) return null;
    lista[i] = Object.assign({}, lista[i], cambios);
    guardarUsuarios(lista);
    return lista[i];
  }

  function iniciarSesion(usuario) {
    sessionStorage.setItem('geo_sesion', JSON.stringify({
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      rut: usuario.rut || '',
      correo: usuario.correo || ''
    }));
  }

  function sesion() {
    try {
      return JSON.parse(sessionStorage.getItem('geo_sesion'));
    } catch (e) {
      return null;
    }
  }

  function cerrarSesion() { sessionStorage.removeItem('geo_sesion'); }

  /* ---------- Fichas ---------- */
  function fichas()             { return leer(CLAVES.fichas, []); }
  function guardarFichas(lista) { escribir(CLAVES.fichas, lista); }

  function fichaDeUsuario(nombreUsuario) {
    return fichas().find(f => f.usuario === nombreUsuario) || null;
  }

  function fichaPorId(id) {
    return fichas().find(f => f.id === id) || null;
  }

  /* Guarda una ficha nueva o actualiza la existente del mismo usuario.
     Devuelve { ficha, esNueva } para que la UI decida el mensaje. */
  function guardarFicha(datos, nombreUsuario) {
    const lista = fichas();
    const i = lista.findIndex(f => f.usuario === nombreUsuario);
    const ahora = new Date().toISOString();

    if (i === -1) {
      const ficha = Object.assign({}, datos, {
        id: 'ficha-' + Date.now(),
        usuario: nombreUsuario,
        estado: 'enviada',
        version: 1,
        creada: ahora,
        actualizada: ahora
      });
      lista.push(ficha);
      guardarFichas(lista);
      return { ficha: ficha, esNueva: true };
    }

    const ficha = Object.assign({}, lista[i], datos, {
      estado: 'actualizada',
      version: (lista[i].version || 1) + 1,
      actualizada: ahora
    });
    lista[i] = ficha;
    guardarFichas(lista);
    return { ficha: ficha, esNueva: false };
  }

  /* ---------- Clasificación de riesgo (HU 60) ----------
     crítico  : alergia declarada o enfermedad con tratamiento
     atención : lesión traumatológica o situaciones especiales descritas
     normal   : sin antecedentes declarados                             */
  function clasificarFicha(ficha) {
    if (!ficha) return { nivel: 'sin-ficha', etiqueta: 'Sin ficha', motivos: [] };

    const motivos = [];
    if (ficha.alergia === 'si')    motivos.push('Alergia: ' + (ficha.alergia_detalle || 'sin detalle'));
    if (ficha.enfermedad === 'si') motivos.push('Enfermedad con tratamiento: ' + (ficha.enfermedad_detalle || 'sin detalle'));

    const secundarios = [];
    if (ficha.lesion === 'si')                          secundarios.push('Lesión traumatológica: ' + (ficha.lesion_detalle || 'sin detalle'));
    if ((ficha.situaciones_especiales || '').trim())     secundarios.push('Situación especial: ' + ficha.situaciones_especiales.trim());

    if (motivos.length) return { nivel: 'critico',  etiqueta: 'Crítico',  motivos: motivos.concat(secundarios) };
    if (secundarios.length) return { nivel: 'atencion', etiqueta: 'Atención', motivos: secundarios };
    return { nivel: 'normal', etiqueta: 'Sin antecedentes', motivos: [] };
  }

  /* ---------- Estudiantes por asignatura ---------- */
  function estudiantes()             { return leer(CLAVES.estudiantes, []); }
  function guardarEstudiantes(lista) { escribir(CLAVES.estudiantes, lista); }

  function estudiantesPorAsignatura(codigo, periodo) {
    return estudiantes().filter(e =>
      (!codigo || e.asignatura === codigo) &&
      (!periodo || e.periodo === periodo)
    );
  }

  /* Agrega estudiantes evitando duplicados (mismo rut + asignatura + periodo).
     Devuelve cuántos se agregaron y cuántos se omitieron. */
  function agregarEstudiantes(nuevos) {
    const lista = estudiantes();
    let agregados = 0, omitidos = 0;

    nuevos.forEach(n => {
      const existe = lista.some(e =>
        e.rut === n.rut && e.asignatura === n.asignatura && e.periodo === n.periodo
      );
      if (existe) { omitidos++; return; }
      lista.push(n);
      agregados++;
    });

    guardarEstudiantes(lista);
    return { agregados: agregados, omitidos: omitidos };
  }

  /* ---------- Bitácora de terreno ---------- */
  function bitacora()             { return leer(CLAVES.bitacora, []); }
  function guardarBitacora(lista) { escribir(CLAVES.bitacora, lista); }

  function agregarSuceso(suceso) {
    const lista = bitacora();
    const registro = Object.assign({
      id: 'suceso-' + Date.now(),
      registrado: new Date().toISOString()
    }, suceso);
    lista.unshift(registro);
    guardarBitacora(lista);
    return registro;
  }

  function eliminarSuceso(id) {
    guardarBitacora(bitacora().filter(s => s.id !== id));
  }

  /* ---------- Reportes ---------- */
  function reportes()             { return leer(CLAVES.reportes, []); }
  function guardarReportes(lista) { escribir(CLAVES.reportes, lista); }

  function agregarReporte(reporte) {
    const lista = reportes();
    const registro = Object.assign({
      id: 'reporte-' + Date.now(),
      generado: new Date().toISOString()
    }, reporte);
    lista.unshift(registro);
    guardarReportes(lista);
    return registro;
  }

  function reportePorId(id) {
    return reportes().find(r => r.id === id) || null;
  }

  /* ---------- Notificaciones (HU 54) ---------- */
  function notificaciones()             { return leer(CLAVES.notificaciones, []); }
  function guardarNotificaciones(lista) { escribir(CLAVES.notificaciones, lista); }

  function agregarNotificacion(texto, tipo) {
    const lista = notificaciones();
    lista.unshift({
      id: 'notif-' + Date.now(),
      texto: texto,
      tipo: tipo || 'info',
      fecha: new Date().toISOString(),
      leida: false
    });
    guardarNotificaciones(lista.slice(0, 50));
  }

  function marcarNotificacionesLeidas() {
    guardarNotificaciones(notificaciones().map(n => Object.assign({}, n, { leida: true })));
  }

  /* ---------- Helpers de formato ---------- */
  function nombreAsignatura(codigo) {
    const a = ASIGNATURAS.find(x => x.codigo === codigo);
    return a ? a.codigo + ' · ' + a.nombre : (codigo || '—');
  }

  function formatoFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  /* Las fechas "YYYY-MM-DD" de los <input type="date"> se interpretan como UTC
     si se pasan directamente a Date(), lo que restaba un día en Chile. */
  function formatoFechaCorta(valor) {
    if (!valor) return '—';

    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    const d = soloFecha
      ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
      : new Date(valor);

    return isNaN(d) ? '—' : d.toLocaleDateString('es-CL');
  }

  inicializar();

  return {
    ASIGNATURAS, PERIODOS,
    inicializar,
    usuarios, buscarUsuario, actualizarUsuario,
    iniciarSesion, sesion, cerrarSesion,
    fichas, fichaDeUsuario, fichaPorId, guardarFicha, clasificarFicha,
    estudiantes, estudiantesPorAsignatura, agregarEstudiantes, guardarEstudiantes,
    bitacora, agregarSuceso, eliminarSuceso,
    reportes, agregarReporte, reportePorId,
    notificaciones, agregarNotificacion, marcarNotificacionesLeidas,
    nombreAsignatura, formatoFecha, formatoFechaCorta
  };
})();
