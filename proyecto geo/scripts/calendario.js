/* ==============================================================
   CALENDARIO DE SALIDAS A TERRENO
   Eventos guardados en localStorage (sin backend aún).
   ============================================================== */

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const hoy = new Date();
let calMes = hoy.getMonth();
let calAnio = hoy.getFullYear();
let diaSeleccionado = null;

function obtenerEventos() {
  try {
    return JSON.parse(localStorage.getItem('geo_eventos') || '{}');
  } catch (e) {
    return {};
  }
}

function guardarEventos(eventos) {
  localStorage.setItem('geo_eventos', JSON.stringify(eventos));
}

function formatearFecha(anio, mes, dia) {
  return anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

function cambiarMes(delta) {
  calMes += delta;
  if (calMes < 0) { calMes = 11; calAnio--; }
  if (calMes > 11) { calMes = 0; calAnio++; }
  diaSeleccionado = null;
  document.getElementById('day-panel').style.display = 'none';
  renderCalendario();
}

function renderCalendario() {
  const grid = document.getElementById('calendar-grid');
  const titulo = document.getElementById('calendar-titulo');
  const eventos = obtenerEventos();

  titulo.textContent = MESES[calMes] + ' ' + calAnio;
  grid.innerHTML = '';

  DIAS_SEMANA.forEach(dia => {
    const celdaDia = document.createElement('div');
    celdaDia.className = 'calendar-weekday';
    celdaDia.textContent = dia;
    grid.appendChild(celdaDia);
  });

  const primerDia = new Date(calAnio, calMes, 1);
  // getDay(): 0=Dom..6=Sáb -> convertir a offset con Lunes=0
  const offset = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const vacio = document.createElement('div');
    vacio.className = 'calendar-day calendar-day-empty';
    grid.appendChild(vacio);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaStr = formatearFecha(calAnio, calMes, dia);
    const celdaDia = document.createElement('div');
    celdaDia.className = 'calendar-day';

    if (fechaStr === formatearFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) celdaDia.classList.add('today');
    if (fechaStr === diaSeleccionado) celdaDia.classList.add('selected');

    const numero = document.createElement('div');
    numero.className = 'calendar-day-number';
    numero.textContent = dia;
    celdaDia.appendChild(numero);

    const eventosDia = eventos[fechaStr] || [];
    if (eventosDia.length > 0) {
      const puntos = document.createElement('div');
      puntos.className = 'calendar-day-events';
      eventosDia.slice(0, 3).forEach(() => {
        const punto = document.createElement('span');
        punto.className = 'event-dot';
        puntos.appendChild(punto);
      });
      celdaDia.appendChild(puntos);
    }

    celdaDia.onclick = () => seleccionarDia(fechaStr);
    grid.appendChild(celdaDia);
  }
}

function seleccionarDia(fechaStr) {
  diaSeleccionado = fechaStr;
  renderCalendario();

  const panel = document.getElementById('day-panel');
  const titulo = document.getElementById('day-panel-titulo');
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  titulo.textContent = 'Eventos del ' + dia + ' de ' + MESES[mes - 1] + ' ' + anio;

  panel.style.display = 'block';
  renderListaEventos();
}

function renderListaEventos() {
  const lista = document.getElementById('day-events-list');
  const eventos = obtenerEventos();
  const eventosDia = eventos[diaSeleccionado] || [];

  lista.innerHTML = '';
  if (eventosDia.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'day-event-empty';
    vacio.textContent = 'Sin eventos para este día.';
    lista.appendChild(vacio);
    return;
  }

  eventosDia.forEach((evento, index) => {
    const item = document.createElement('li');
    item.className = 'day-event-item';

    const texto = document.createElement('span');
    texto.textContent = evento;
    item.appendChild(texto);

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'day-event-delete';
    btnEliminar.textContent = '×';
    btnEliminar.onclick = () => eliminarEvento(index);
    item.appendChild(btnEliminar);

    lista.appendChild(item);
  });
}

function agregarEvento() {
  const input = document.getElementById('nuevo-evento-input');
  const texto = input.value.trim();
  if (!texto || !diaSeleccionado) return;

  const eventos = obtenerEventos();
  if (!eventos[diaSeleccionado]) eventos[diaSeleccionado] = [];
  eventos[diaSeleccionado].push(texto);
  guardarEventos(eventos);

  input.value = '';
  renderListaEventos();
  renderCalendario();
}

function eliminarEvento(index) {
  const eventos = obtenerEventos();
  eventos[diaSeleccionado].splice(index, 1);
  if (eventos[diaSeleccionado].length === 0) delete eventos[diaSeleccionado];
  guardarEventos(eventos);

  renderListaEventos();
  renderCalendario();
}
