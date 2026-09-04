
// BUSCAR ELEMENTOS

const botonJugar = document.getElementById("btnJugar");

const botonNavbar = document.getElementById("btnNavbar");

const pantallaJuego = document.getElementById("pantallaJuego");

const botonVolver = document.getElementById("btnVolver");

// EVENTOS

botonJugar.addEventListener("click", iniciarJuego);

botonNavbar.addEventListener("click", iniciarJuego);

botonVolver.addEventListener("click", cerrarJuego);

// FUNCIONES

function iniciarJuego() {

    pantallaJuego.style.display = "block";

}


function cerrarJuego() {

    pantallaJuego.style.display = "none";

}