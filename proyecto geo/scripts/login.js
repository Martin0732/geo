/* ==============================================================
   LOGIN (HU 49) y CAMBIO DE CLAVE INICIAL (HU 50)
   Validación local mientras no exista backend institucional.
   ============================================================== */

const pasoCredenciales = document.getElementById('paso-credenciales');
const pasoCambioClave  = document.getElementById('paso-cambio-clave');
const errorLogin       = document.getElementById('login-error');
const errorCambio      = document.getElementById('cambio-error');

/* Usuario que ya validó credenciales pero aún debe cambiar la clave */
let usuarioPendiente = null;

/* Si la sesión sigue abierta, entra directo a la aplicación */
if (DB.sesion()) {
  window.location.replace('html/app.html');
}

function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.style.display = mensaje ? 'block' : 'none';
}

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const identificador = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value;

  if (!identificador || !clave) {
    mostrarError(errorLogin, 'Completa usuario y contraseña.');
    return;
  }

  const usuario = DB.buscarUsuario(identificador);

  if (!usuario || usuario.clave !== clave) {
    mostrarError(errorLogin, 'Usuario o contraseña incorrectos.');
    return;
  }

  mostrarError(errorLogin, '');

  /* HU 50: primer ingreso obliga a definir una clave personal */
  if (usuario.debeCambiarClave) {
    usuarioPendiente = usuario;
    pasoCredenciales.classList.add('oculto');
    pasoCambioClave.classList.remove('oculto');
    document.getElementById('clave-nueva').focus();
    return;
  }

  DB.iniciarSesion(usuario);
  window.location.href = 'html/app.html';
});

document.getElementById('cambio-clave-form').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!usuarioPendiente) return;

  const nueva   = document.getElementById('clave-nueva').value;
  const repetir = document.getElementById('clave-repetir').value;

  if (nueva.length < 8) {
    mostrarError(errorCambio, 'La clave debe tener al menos 8 caracteres.');
    return;
  }
  if (!/[a-zA-Z]/.test(nueva) || !/[0-9]/.test(nueva)) {
    mostrarError(errorCambio, 'La clave debe incluir al menos una letra y un número.');
    return;
  }
  if (nueva !== repetir) {
    mostrarError(errorCambio, 'Las claves no coinciden.');
    return;
  }
  if (nueva === usuarioPendiente.clave) {
    mostrarError(errorCambio, 'La nueva clave debe ser distinta de la clave temporal.');
    return;
  }

  const actualizado = DB.actualizarUsuario(usuarioPendiente.usuario, {
    clave: nueva,
    debeCambiarClave: false
  });

  mostrarError(errorCambio, '');
  DB.agregarNotificacion('Cambio de clave inicial completado por ' + actualizado.nombre + '.', 'info');
  DB.iniciarSesion(actualizado);
  window.location.href = 'html/app.html';
});

document.getElementById('btn-cancelar-cambio').addEventListener('click', function () {
  usuarioPendiente = null;
  document.getElementById('clave-nueva').value = '';
  document.getElementById('clave-repetir').value = '';
  mostrarError(errorCambio, '');
  pasoCambioClave.classList.add('oculto');
  pasoCredenciales.classList.remove('oculto');
});

document.getElementById('forgot-link').addEventListener('click', function (e) {
  e.preventDefault();
  alert('Recuperación de clave: por ahora debes solicitarla al encargado de laboratorio.\n\nQuedará automatizada cuando el sistema se conecte a las cuentas institucionales.');
});
