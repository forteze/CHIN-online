// ================= ELEMENTOS =================
const $ = id => document.getElementById(id);
const pantallaJuego = $("pantallaJuego"), portadaJuego = $("portadaJuego"), zonaJuego = $("zonaJuego");
const mapa = $("mapa"), jugador = $("jugador"), aviso = $("aviso"), pantallaGameOver = $("pantallaGameOver");
const vidaTexto = $("vida"), balasTexto = $("balas"), puntosTexto = $("puntos"), zonaTexto = $("zona");
const pantallaContinuar = $("pantallaContinuar");
const jefeHUD = $("jefeHUD"), jefeNombre = $("jefeNombre"), jefeVida = $("jefeVida");
const relampago = $("relampago"), rayo = $("rayo");

// Capas del fondo: [elemento, velocidad relativa a la cámara, ancho del tile]
const capas = [[".capaNubes", 0.05, 600], [".capaMontanas", 0.2, 800], [".capaCiudad", 0.45, 500]]
    .map(([sel, factor, tile]) => [document.querySelector(sel), factor, tile]);

// ================= AJUSTES (tocá estos números para cambiar la "sensación") =================
const SUELO = 45;          // alto del suelo en px
const ACEL = 0.7;          // qué tan rápido acelera
const VMAX = 4.5;          // velocidad máxima horizontal
const FRIC_SUELO = 0.78;   // frenado en el suelo (más chico = frena antes)
const FRIC_AIRE = 0.94;    // frenado en el aire
const GRAV = 0.6;          // gravedad
const SALTO = 12.5;        // fuerza del salto
const COYOTE = 6;          // frames de gracia para saltar justo después de dejar una plataforma
const BUFFER = 6;          // frames que se "recuerda" un salto apretado un poco antes de tocar el suelo

// ---- Dificultad y munición ----
const VIDAS = 3;           // vidas al empezar la partida
const VIDAS_MAX = 4;       // tope de vidas (los corazones 💚 del mapa suman una)
const BALAS_ITEM = 2;      // balas que da CADA item de munición del mapa
const BALAS_ENEMIGO = 1;   // balas que suelta un enemigo común al morir
const BALAS_INICIO = 4;    // balas al empezar la partida
const BALAS_ZONA = 6;      // balas de ayuda al entrar a cada zona nueva
const VIDA_ENEMIGO = 2;    // disparos que aguanta un enemigo común

// ================= NIVELES =================
// bloques:  [x, y, ancho, alto, "p"] -> y = altura sobre el suelo. Todos son SÓLIDOS (no se atraviesan).
//           El "p" solo cambia el aspecto (pasarela flotante de metal).
// items:    ["b" = balas | "m" = moneda | "v" = corazón, x, y]
// enemigos: ["b", min, max]      patrullero en el suelo
//           ["v", min, max, y]   volador que oscila alrededor de la altura y
//           ["t", x, y]          torreta que dispara apuntando (y = altura de la base)
// jefe:     sprite (carpeta img/), caja de choque (w, h), escala del dibujo (esc) y su comportamiento
const SPRITES = {   // [ancho del cuadro, alto del cuadro, cantidad de cuadros]
    guardian: { andar: [191, 87, 8], ataque: [191, 140, 6] },
    mutante:  { andar: [188, 89, 8], ataque: [193, 139, 6] },
    final:    { andar: [191, 110, 8], ataque: [191, 147, 6] }
};

const NIVELES = [
    // ---------- ZONA 1: techos y escaleras de la ciudad ----------
    {
        nombre: "Abandoned City", clase: "zona1", ancho: 2500,
        bloques: [[260, 0, 70, 40], [330, 0, 70, 80], [400, 0, 220, 115],
            [1000, 0, 70, 60], [1070, 0, 70, 100], [1190, 95, 110, 25, "p"], [1350, 75, 100, 25, "p"],
            [1640, 0, 60, 45], [1700, 0, 60, 85], [1760, 0, 130, 125],
            [2120, 85, 100, 25, "p"], [2340, 85, 100, 25, "p"]],
        items: [["b", 275, 48], ["b", 500, 120], ["b", 580, 120], ["b", 700, 5], ["b", 905, 100], ["b", 1030, 65], ["b", 1210, 125],
            ["b", 1380, 105], ["b", 1520, 90], ["b", 1720, 90], ["b", 1810, 130], ["b", 2000, 85], ["b", 2150, 115], ["b", 2080, 5], ["b", 2430, 5],
            ["v", 1100, 105],
            ["m", 345, 85], ["m", 460, 120], ["m", 540, 120], ["m", 760, 5], ["m", 1150, 5], ["m", 1260, 125], ["m", 1420, 5], ["m", 1660, 50], ["m", 1850, 130], ["m", 2380, 115]],
        enemigos: [["b", 650, 800], ["b", 1160, 1240], ["b", 1290, 1410], ["v", 640, 820, 85], ["v", 870, 930, 90], ["v", 1475, 1560, 95], ["t", 560, 115]],
        jefe: { nombre: "GUARDIAN", img: "guardian", x: 2300, w: 130, h: 80, esc: 1.15, vida: 16, min: 2130, max: 2330,
            vel: 1.4, cad: 105, aviso: 36, ataques: ["embestida", "fuego"], fuego: "recto", vf: 4.4 }
    },
    // ---------- ZONA 2: pilares y pasarelas de la fábrica ----------
    {
        nombre: "Energy Factory", clase: "zona2", ancho: 3000,
        bloques: [[250, 0, 60, 50], [650, 0, 60, 60], [710, 0, 60, 110], [840, 95, 120, 25, "p"],
            [1000, 65, 90, 25, "p"], [1230, 0, 70, 90], [1300, 0, 70, 50],
            [1700, 0, 60, 70], [1760, 0, 60, 110], [1880, 90, 100, 25, "p"], [2000, 60, 90, 25, "p"],
            [2260, 0, 70, 60], [2330, 0, 70, 105], [2420, 110, 110, 25, "p"], [2570, 75, 100, 25, "p"]],
        items: [["b", 270, 55], ["b", 730, 115], ["b", 880, 125], ["b", 1030, 95], ["b", 1250, 95], ["b", 1320, 55], ["b", 1480, 5],
            ["b", 1620, 80], ["b", 1780, 115], ["b", 1910, 120], ["b", 2030, 90], ["b", 2150, 5], ["b", 2350, 110], ["b", 2450, 140], ["b", 2600, 105],
            ["b", 1170, 5], ["b", 2270, 65], ["b", 2740, 5], ["b", 2830, 5],
            ["v", 800, 5], ["v", 2220, 5],
            ["m", 200, 5], ["m", 350, 5], ["m", 680, 65], ["m", 900, 125], ["m", 1180, 40], ["m", 1500, 5], ["m", 1850, 5], ["m", 2290, 65], ["m", 2900, 5]],
        enemigos: [["b", 555, 610], ["b", 1145, 1190], ["b", 1400, 1540], ["b", 1830, 1990], ["v", 545, 640, 100], ["v", 1380, 1550, 85],
            ["v", 1830, 2040, 150], ["v", 2210, 2380, 150], ["t", 1236, 90], ["t", 1780, 110], ["t", 2360, 105]],
        jefe: { nombre: "MUTANT", img: "mutante", x: 2780, w: 140, h: 85, esc: 1.15, vida: 22, min: 2700, max: 2860,
            vel: 1.8, cad: 85, aviso: 32, ataques: ["embestida", "fuego", "salto"], fuego: "apuntado", vf: 4.2, n: 3, onda: true }
    },
    // ---------- ZONA 3: el reactor, islas sobre ácido y una pirámide ----------
    {
        nombre: "Nexoria's Core", clase: "zona3", ancho: 3300,
        bloques: [[470, 0, 60, 55], [540, 0, 60, 90], [900, 0, 80, 70],
            [1250, 0, 70, 50], [1320, 0, 70, 90], [1390, 0, 70, 130], [1460, 0, 70, 130], [1530, 0, 70, 90], [1600, 0, 70, 50],
            [1760, 70, 90, 25, "p"], [1990, 70, 90, 25, "p"], [2400, 0, 70, 55], [2470, 0, 70, 90],
            [2600, 100, 100, 25, "p"], [2850, 100, 100, 25, "p"]],
        items: [["b", 490, 60], ["b", 560, 95], ["b", 920, 75], ["b", 1270, 55], ["b", 1340, 95], ["b", 1480, 135], ["b", 1550, 95], ["b", 1620, 55],
            ["b", 1780, 100], ["b", 2010, 100], ["b", 2420, 60], ["b", 2490, 95], ["b", 2620, 130], ["b", 2870, 130], ["b", 380, 90], ["b", 2300, 95],
            ["b", 2980, 5], ["b", 3200, 5], ["b", 1050, 5], ["b", 2560, 5], ["b", 150, 5],
            ["v", 1430, 135], ["v", 2150, 5],
            ["m", 200, 5], ["m", 420, 5], ["m", 780, 5], ["m", 1000, 5], ["m", 1180, 5], ["m", 1700, 5], ["m", 1880, 5], ["m", 2120, 5], ["m", 2370, 5], ["m", 2700, 5]],
        enemigos: [["b", 150, 270], ["b", 610, 665], ["b", 985, 1060], ["b", 1680, 1860], ["b", 2030, 2200], ["b", 2550, 2700],
            ["v", 340, 700, 130], ["v", 1260, 1660, 195], ["v", 1900, 2260, 140], ["t", 1425, 130], ["t", 2505, 90], ["t", 940, 70]],
        jefe: { nombre: "???", img: "final", x: 3050, w: 140, h: 100, esc: 1.15, vida: 30, min: 2950, max: 3130,
            vel: 2.2, cad: 65, aviso: 28, ataques: ["embestida", "fuego", "salto"], fuego: "apuntado", vf: 4.8, n: 5, onda: true }
    }
];

// ================= ESTADO =================
let p, nivel, nivelActual, bloques, items, enemigos, disparos, camX, vistaAncho;
let vida, balas, puntos;
let teclas = {}, juegoActivo = false, enTransicion = false;
let raf, ultimoTiempo, tTransicion, tAviso, tRayo;

// ================= DIÁLOGOS DE COCARDO (nubecitas de diálogo) =================
const NOMBRE_HEROE = "Cocardo";
const dialogo = $("dialogo"), dialogoTexto = $("dialogoTexto");

// Un jefe por zona: Guardian (0), Mutant (1) y el jefe final "??" (2)
const DIALOGOS = {
    inicio: [
        "Nexoria is burning... and nobody else is left to stand up. Then it's up to me.",
        "Whatever hit this planet, I'm going to find it. And I'm going to end it.",
        "Alright. Weapon ready. Let's take our world back."
    ],
    zonaEntrada: [
        ["These streets used to be full of life. Now there's only silence... and claws.",
         "The beasts took everything. I'm getting it all back."],
        ["The factory that powered all of Nexoria... Without it, the whole planet goes dark.",
         "Something has been changing these creatures. They're stronger than before."],
        ["The Core... the heart of Nexoria. Everything ends here, one way or another.",
         "Nobody has ever seen what waits inside. Time to change that."]
    ],
    jefeAparece: [
        ["So you're the Guardian. The invaders' chief sent you to stop heroes like me.",
         "Many tried before me. I'm not planning to be the last one standing in front of you... I'm planning to be the first one past you."],
        ["Genetically modified to be stronger... They made you into a weapon.",
         "They say no one has ever beaten you. Good. I like a challenge."],
        ["So you're the one behind the invasion. The one they call invincible.",
         "Nobody is invincible. Everything falls... you just haven't met me yet."]
    ],
    jefeFuria: [
        ["He's getting angry! Stay sharp, every bullet counts!", "Come on, show me what else you've got!"],
        ["He's getting angry! Stay sharp, every bullet counts!", "Come on, show me what else you've got!"],
        ["You're angry? Good. That means I'm getting to you!", "I'm not backing down. Not now, not after everything I've been through!"]
    ],
    jefeDerrotado: [
        ["One down. The first zone is free.", "If that was the guard dog, I can't wait to meet the owner."],
        ["They said you were unbeatable. They were wrong.", "The factory is ours again. One more zone to go."],
        ["It's over... Nexoria is safe.",
         "I got the coins back. Every single one. Now my people can finally rebuild.",
         "They said the final boss was invincible. Turns out that was only until a hero showed up."]
    ],
    zonaCompleta: [
        "Zone cleared. Catch your breath... the fight isn't over.",
        "I got stronger in there. Let's keep moving."
    ],
    balas: ["Ammo! Every bullet counts.", "Just what I needed."],
    moneda: ["A Nexoria coin... one step closer to getting them all back.",
             "This belongs to my people. I'll make sure it gets home."],
    sinBalas: "I'm out of ammo! I need to find more.",
    dano: ["Argh! That hurt...", "I've been through worse. Keep going!"],
    pocaVida: "I can't take much more of this... Careful now.",
    enemigoDerrotado: "One less beast in Nexoria.",
    salto: "Here goes nothing!",
    corazon: "A little strength back. Let's keep going.",
    derrota: ["No... I can't fall here... Nexoria is counting on me...",
              "I'll be back. And next time, I won't lose."]
};

let dialogoCola = [], dialogoPrio = 0, dialogoVisible = false, dialogoAncho = 0, dialogoAlto = 0;
let tDialogo, dialogoPendiente = [];
const ultimaVez = {};

const elegir = lista => lista[Math.floor(Math.random() * lista.length)];
const duracionLinea = texto => 1500 + texto.length * 45;     // ms que se queda cada nubecita en pantalla
const citar = lineas => [].concat(lineas).map(l => `“${l}”`).join(" ") + ` — ${NOMBRE_HEROE}`;

// Evita repetir la misma clase de frase muy seguido
function listo(clave, ms) {
    const ahora = performance.now();
    if (ahora - (ultimaVez[clave] || -1e9) < ms) return false;
    ultimaVez[clave] = ahora;
    return true;
}

// Cocardo dice una frase (o varias en fila). Una frase de menor prioridad no pisa a una más importante.
function decir(lineas, prio = 1, retraso = 0) {
    if (prio < dialogoPrio) return;
    clearTimeout(tDialogo);
    dialogoPrio = prio;
    dialogoCola = [].concat(lineas);
    tDialogo = setTimeout(siguienteDialogo, retraso);
}

function siguienteDialogo() {
    const texto = dialogoCola.shift();
    if (!texto) return ocultarDialogo();
    dialogoTexto.textContent = texto;
    dialogo.classList.add("visible");
    dialogoVisible = true;
    dialogoAncho = dialogo.offsetWidth;
    dialogoAlto = dialogo.offsetHeight;
    tDialogo = setTimeout(siguienteDialogo, duracionLinea(texto));
}

function ocultarDialogo() {
    clearTimeout(tDialogo);
    dialogoCola = [];
    dialogoPrio = 0;
    dialogoVisible = false;
    dialogo.classList.remove("visible");
}

// La nubecita sigue a Cocardo y se mantiene dentro de la pantalla
function posicionarDialogo(cx) {
    const mitad = dialogoAncho / 2;
    const centro = p.x + p.w / 2 - cx;
    const izq = Math.max(mitad + 6, Math.min(vistaAncho - mitad - 6, centro));
    const alto = Math.min(SUELO + p.y + p.h + 14, zonaJuego.clientHeight - 40 - dialogoAlto);
    dialogo.style.left = Math.round(izq) + "px";
    dialogo.style.bottom = Math.round(alto) + "px";
    dialogo.style.setProperty("--cola", Math.round(Math.max(16 - mitad, Math.min(mitad - 16, centro - izq))) + "px");
}

// ================= BOTONES =================
$("btnJugar").addEventListener("click", iniciarJuego);
$("btnNavbar").addEventListener("click", iniciarJuego);
$("btnVolver").addEventListener("click", volverAlInicio);
$("btnInicio").addEventListener("click", volverAlInicio);
$("btnComenzar").addEventListener("click", function () {
    portadaJuego.style.display = "none";
    zonaJuego.style.display = "block";
    iniciarPartida();
});
$("btnReintentar").addEventListener("click", function () {
    pantallaGameOver.style.display = "none";
    iniciarPartida();
});

$("btnContinuar").addEventListener("click", function () {
    pantallaContinuar.style.display = "none";
    if (nivelActual === NIVELES.length - 1) return terminar(true);
    cargarNivel(nivelActual + 1);
    arrancar();
});

// Disparar también con el mouse (clic dentro del juego)
zonaJuego.addEventListener("mousedown", () => { if (juegoActivo) teclas.disparar = true; });
window.addEventListener("mouseup", () => { teclas.disparar = false; });

function iniciarJuego() {
    pantallaJuego.style.display = "block";
}

function volverAlInicio() {
    detener();
    pantallaGameOver.style.display = "none";
    zonaJuego.style.display = "none";
    portadaJuego.style.display = "flex";
    pantallaJuego.style.display = "none";
}

// ================= TECLADO =================
// Se usa event.code (posición física de la tecla) para que ande igual con cualquier idioma de teclado
const ACCIONES = {
    KeyA: "izq", ArrowLeft: "izq", KeyD: "der", ArrowRight: "der",
    KeyW: "saltar", ArrowUp: "saltar", Space: "saltar",
    KeyJ: "disparar", KeyK: "disparar", KeyX: "disparar"
};

document.addEventListener("keydown", function (e) {
    const accion = ACCIONES[e.code];
    if (!accion || !juegoActivo) return;
    e.preventDefault();
    teclas[accion] = true;
    if (accion === "saltar" && !e.repeat) p.buffer = BUFFER;
});

document.addEventListener("keyup", function (e) {
    const accion = ACCIONES[e.code];
    if (!accion) return;
    teclas[accion] = false;
    // Salto variable: si soltás la tecla en el aire, el salto se corta
    if (accion === "saltar" && p && p.vy > 4) p.vy *= 0.5;
});

window.addEventListener("blur", () => { teclas = {}; });
window.addEventListener("resize", () => { vistaAncho = zonaJuego.clientWidth || vistaAncho; });


// ================= PARTIDA Y NIVELES =================
function iniciarPartida() {
    detener();
    vida = VIDAS; balas = BALAS_INICIO; puntos = 0;
    dialogoPendiente = [];
    Object.keys(ultimaVez).forEach(k => delete ultimaVez[k]);
    p = { w: 28, h: 68, dir: 1, coyote: 0, buffer: 0, cd: 0, flash: 0 };
    cargarNivel(0);
    arrancar();
}

function cargarNivel(i) {
    nivelActual = i;
    nivel = NIVELES[i];
    mapa.querySelectorAll(".dinamico").forEach(el => el.remove());
    mapa.style.width = nivel.ancho + "px";
    zonaJuego.className = nivel.clase;
    zonaTexto.textContent = i + 1;
    jefeHUD.classList.remove("visible");

    // Suelo firme en todo el ancho del nivel
    crear("suelo", 0, -SUELO, nivel.ancho, SUELO);

    bloques = nivel.bloques.map(([x, y, w, h, t]) => {
        crear(t ? "plataforma" : "bloque", x, y, w, h);
        return { x, y, w, h };
    });
    const ICONO = { b: "🔫", m: "🪙", v: "💚" };
    items = nivel.items.map(([t, x, y]) => ({
        t, x, y, w: 24, h: 24, el: crear("item", x, y, 24, 24, ICONO[t])
    }));
    crearEnemigos();
    disparos = [];

    Object.assign(p, { x: 70, y: 0, vx: 0, vy: 0, suelo: true, invul: 0, golpe: 0 });
    if (i > 0) balas += BALAS_ZONA;   // ayuda al empezar cada zona nueva
    vistaAncho = zonaJuego.clientWidth;
    camX = 0;
    enTransicion = false;
    actualizarHUD();
    mostrarAviso(`ZONE ${i + 1} · ${nivel.nombre}`, 1800);
    // Cocardo habla al empezar la partida y al entrar a cada zona
    const intro = (i === 0 ? DIALOGOS.inicio : dialogoPendiente).concat(DIALOGOS.zonaEntrada[i]);
    dialogoPendiente = [];
    decir(intro, 2, 700);
    dibujar();
}

// Crea un div dentro del mapa. y = altura sobre el suelo
function crear(clase, x, y, w, h, texto) {
    const el = document.createElement("div");
    el.className = clase + " dinamico";
    if (texto) el.textContent = texto;
    if (w) el.style.width = w + "px";
    if (h) el.style.height = h + "px";
    el.style.left = x + "px";
    el.style.bottom = (SUELO + y) + "px";
    mapa.appendChild(el);
    return el;
}

// ================= ENEMIGOS: dibujos =================
// Bicho de un solo ojo (el ojo sigue al jugador)
const BICHO = `<svg viewBox="0 0 34 34">
<g fill="none" stroke="#1b1f14" stroke-width="2.2" stroke-linecap="round"><path class="pata" d="M8 24L3 32"/><path class="pata" d="M13 26L11 33"/><path class="pata" d="M21 26L23 33"/><path class="pata" d="M26 24L31 32"/></g>
<path d="M11 8L8 1M23 8L26 1" stroke="#1b1f14" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="8" cy="1.5" r="1.8" fill="#ff4a4a"/><circle cx="26" cy="1.5" r="1.8" fill="#ff4a4a"/>
<path class="cuerpoBicho" d="M2 27C2 13 9 6 17 6S32 13 32 27Z"/>
<circle cx="17" cy="14.5" r="6.8" fill="#fff" stroke="#111" stroke-width="1.3"/>
<g class="pupila"><circle cx="17" cy="14.5" r="4" fill="#c01515"/><circle cx="17" cy="14.5" r="1.8" fill="#000"/></g>
<path d="M8 25L11 22 14 25 17 22 20 25 23 22 26 25" stroke="#111" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
</svg>`;

// Volador tóxico: esfera con alas que oscila en el aire
const VOLADOR = `<svg viewBox="0 0 34 30">
<g class="ala alaI"><ellipse cx="8" cy="9" rx="8.5" ry="4" fill="rgba(210,255,190,.6)" stroke="#1b1f14" stroke-width="1"/></g>
<g class="ala alaD"><ellipse cx="26" cy="9" rx="8.5" ry="4" fill="rgba(210,255,190,.6)" stroke="#1b1f14" stroke-width="1"/></g>
<path d="M11 25l-3 4M17 26v4M23 25l3 4" stroke="#111" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<ellipse class="cuerpoBicho" cx="17" cy="17" rx="11" ry="9.5"/>
<circle cx="17" cy="16" r="5.2" fill="#fff" stroke="#111" stroke-width="1.1"/>
<g class="pupila"><circle cx="17" cy="16" r="3" fill="#c01515"/><circle cx="17" cy="16" r="1.3" fill="#000"/></g>
</svg>`;

// Torreta: cañón fijo que apunta al jugador
const TORRETA = `<svg viewBox="0 0 34 34">
<rect x="4" y="22" width="26" height="12" rx="2" fill="#2a302b" stroke="#000" stroke-opacity=".55" stroke-width="1.2"/>
<rect x="7" y="23" width="20" height="3" fill="#4d5a50"/>
<rect x="21" y="14" width="13" height="7" rx="2" fill="#15181a" stroke="#000" stroke-width="1"/>
<rect x="8" y="10" width="17" height="14" rx="5" class="cuerpoTorreta"/>
<circle class="ojoTorreta" cx="17" cy="17" r="3.8"/>
</svg>`;

function crearEnemigos() {
    enemigos = nivel.enemigos.map(([t, a, b, c]) => {
        if (t === "v") return nuevoEnemigo({ tipo: "volador", x: a, min: a, max: b, y: c, y0: c, w: 34, h: 30, vida: VIDA_ENEMIGO, vel: 1.5, amp: 32, fase: Math.random() * 6, pts: 30 });
        if (t === "t") return nuevoEnemigo({ tipo: "torreta", x: a, y: b, w: 34, h: 34, vida: 3, cad: 120, pts: 30 });
        return nuevoEnemigo({ tipo: "bicho", x: a, min: a, max: b, w: 34, h: 34, vida: VIDA_ENEMIGO, vel: 1.6, pts: 20 });
    });
    enemigos.push(nuevoJefe(nivel.jefe));
}

function nuevoEnemigo(d) {
    const el = crear("enemigo " + d.tipo, 0, 0, d.w, d.h);
    el.innerHTML = d.tipo === "torreta" ? TORRETA : d.tipo === "volador" ? VOLADOR : BICHO;
    return { y: 0, dir: 1, t: d.cad || 0, ...d, vidaMax: d.vida, el };
}

// Jefe: usa las hojas de sprites de img/ (una tira para andar y otra para atacar)
function nuevoJefe(d) {
    const S = SPRITES[d.img];
    const el = crear("enemigo esJefe", 0, 0, d.w, d.h);
    el.innerHTML = '<div class="cuerpoJefe"><div class="sprite sAndar"></div><div class="sprite sAtaque"></div></div>';
    const e = {
        ...d, jefe: true, tipo: "jefe", y: 0, vy: 0, dir: 1, mira: -1, estado: "activo", t: d.cad, vidaMax: d.vida,
        el, anim: 0, pose: 0, poseT: 0, avisoMax: d.aviso, sprite: S, tira: "", cuadro: -1, ultimoAtaque: "", pts: 200,
        divs: { andar: el.querySelector(".sAndar"), ataque: el.querySelector(".sAtaque") }
    };
    for (const k of ["andar", "ataque"]) {
        const [w, h, n] = S[k], div = e.divs[k];
        div.style.width = Math.round(w * d.esc) + "px";
        div.style.height = Math.round(h * d.esc) + "px";
        div.style.backgroundImage = `url(img/${d.img}_${k}.png)`;
        div.style.backgroundSize = `${Math.round(w * n * d.esc)}px ${Math.round(h * d.esc)}px`;
    }
    return e;
}

// Elige la tira (andar / ataque) y el cuadro según lo que está haciendo el jefe
function animarJefe(e) {
    let tira = "andar", f;
    if (e.poseT > 0) { tira = "ataque"; f = e.pose; }
    else if (e.estado === "aviso") { tira = "ataque"; f = e.t > e.avisoMax * 0.5 ? 1 : 2; }
    else if (e.estado === "embestida") { tira = "ataque"; f = 3 + Math.floor(e.anim) % 3; }
    else if (e.estado === "salto") { tira = "ataque"; f = e.vy > 0 ? 4 : 5; }
    else f = Math.floor(e.anim) % 8;

    e.el.classList.toggle("izq", e.mira < 0);
    if (tira !== e.tira) {
        e.divs.andar.style.display = tira === "andar" ? "block" : "none";
        e.divs.ataque.style.display = tira === "ataque" ? "block" : "none";
        e.tira = tira; e.cuadro = -1;
    }
    if (f !== e.cuadro) {
        e.divs[tira].style.backgroundPositionX = -Math.round(f * e.sprite[tira][0] * e.esc) + "px";
        e.cuadro = f;
    }
}

function completarZona() {
    enTransicion = true;
    disparos.forEach(d => d.el.remove());
    disparos = [];
    temblor();
    // Cocardo comenta la victoria; el resto de sus frases sale en la pantalla de continuar y en la zona siguiente
    const lineas = DIALOGOS.jefeDerrotado[nivelActual];
    if (nivelActual < NIVELES.length - 1) dialogoPendiente = lineas.slice(1);
    decir(lineas[0], 4);
    tTransicion = setTimeout(mostrarContinuar, Math.max(1200, duracionLinea(lineas[0]) + 200));   // deja ver cómo cae el jefe
}

// Pausa el juego y muestra el botón para pasar a la siguiente zona
function mostrarContinuar() {
    const esUltima = nivelActual === NIVELES.length - 1;
    ocultarDialogo();
    jefeHUD.classList.remove("visible");
    $("continuarTitulo").textContent = esUltima ? "NEXORIA IS SAFE!" : `ZONE ${nivelActual + 1} COMPLETE`;
    $("continuarTexto").textContent = `Score: ${puntos} · Ammo: ${balas}` +
        (esUltima ? "" : ` · Next zone: ${NIVELES[nivelActual + 1].nombre}`);
    $("continuarDialogo").textContent = citar(esUltima ? DIALOGOS.jefeDerrotado[2][1] : elegir(DIALOGOS.zonaCompleta));
    $("btnContinuar").textContent = esUltima ? "SEE RESULTS ▶" : "CONTINUE ▶";
    pantallaContinuar.style.display = "flex";
    $("btnContinuar").focus();
    juegoActivo = false;
    cancelAnimationFrame(raf);
    clearTimeout(tRayo);
    teclas = {};
}

function terminar(gano) {
    detener();
    let record = puntos;
    try {
        record = Math.max(puntos, Number(localStorage.getItem("nexoriaRecord")) || 0);
        localStorage.setItem("nexoriaRecord", record);
    } catch (err) { /* sin localStorage: se ignora */ }
    $("gameOverTitulo").textContent = gano ? "VICTORY!" : "GAME OVER";
    $("gameOverTexto").textContent = (gano ? "You recovered Nexoria's coins!" : "You have been defeated.") +
        ` Score: ${puntos} · Best: ${record}`;
    $("gameOverDialogo").textContent = citar(gano ? DIALOGOS.jefeDerrotado[2][2] : DIALOGOS.derrota);
    pantallaGameOver.style.display = "flex";
}

// ================= BUCLE PRINCIPAL =================
// dt = 1 equivale a un frame a 60 FPS, así el juego va igual en monitores de 60, 120 o 144 Hz
function bucle(t) {
    if (!juegoActivo) return;
    const dt = Math.max(0, Math.min((t - ultimoTiempo) / 16.667, 2.5));
    ultimoTiempo = t;
    actualizar(dt);
    dibujar();
    raf = requestAnimationFrame(bucle);
}

function arrancar() {
    cancelAnimationFrame(raf);   // evita bucles duplicados
    juegoActivo = true;
    ultimoTiempo = performance.now();
    raf = requestAnimationFrame(bucle);
    programarRayo();
}

function detener() {
    juegoActivo = false;
    cancelAnimationFrame(raf);
    clearTimeout(tTransicion);
    clearTimeout(tAviso);
    clearTimeout(tRayo);
    aviso.classList.remove("visible");
    jefeHUD.classList.remove("visible");
    ocultarDialogo();
    teclas = {};
    pantallaContinuar.style.display = "none";
}

function actualizar(dt) {
    moverJugador(dt);
    moverEnemigos(dt);
    moverDisparos(dt);
    recogerItems();
    for (const e of enemigos) {
        if (solapa(p, e)) { danar(p.x + p.w / 2 < e.x + e.w / 2 ? -1 : 1); break; }
    }
    // Cocardo reacciona cuando se acerca a un jefe por primera vez
    for (const e of enemigos) {
        if (e.jefe && !e.visto && Math.abs(p.x - e.x) < 450) {
            e.visto = true;
            jefeNombre.textContent = e.nombre;
            jefeVida.style.width = "100%";
            jefeVida.classList.remove("furia");
            jefeHUD.classList.add("visible");
            decir(DIALOGOS.jefeAparece[nivelActual], 3);
        }
    }
    // Cámara suave, con un poco de adelanto hacia donde mirás
    const objetivo = p.x - vistaAncho * 0.4 + p.dir * 40;
    const limite = Math.max(0, nivel.ancho - vistaAncho);
    const meta = Math.max(0, Math.min(limite, objetivo));
    camX += (meta - camX) * (1 - Math.pow(0.88, dt));
}

// ================= JUGADOR =================

function moverJugador(dt) {
    p.golpe -= dt; p.invul -= dt; p.cd -= dt; p.flash -= dt; p.buffer -= dt;

    // Horizontal con aceleración y fricción (sin input durante el golpe)
    const dir = p.golpe > 0 ? 0 : (teclas.der ? 1 : 0) - (teclas.izq ? 1 : 0);
    if (dir) {
        p.dir = dir;
        p.vx += dir * ACEL * dt * (p.vx * dir < 0 ? 2 : 1);   // doble aceleración al girar
        p.vx = Math.max(-VMAX, Math.min(VMAX, p.vx));
    } else {
        p.vx *= Math.pow(p.suelo ? FRIC_SUELO : FRIC_AIRE, dt);
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
    }

    // Salto con coyote time + buffer
    p.coyote = p.suelo ? COYOTE : p.coyote - dt;
    if (p.buffer > 0 && p.coyote > 0) {
        p.vy = SALTO; p.coyote = 0; p.buffer = 0; p.suelo = false;
        if (Math.random() < 0.25 && listo("salto", 30000)) decir(DIALOGOS.salto, 1);
    }

    // Eje X: se mueve y se resuelve contra los bloques (todos sólidos)
    p.x += p.vx * dt;
    for (const b of bloques) {
        if (!solapa(p, b)) continue;
        p.x = p.x + p.w / 2 < b.x + b.w / 2 ? b.x - p.w : b.x + b.w;
        p.vx = 0;
    }
    p.x = Math.max(0, Math.min(nivel.ancho - p.w, p.x));

    // Eje Y: gravedad, aterrizaje y golpes de cabeza (los bloques no se atraviesan desde ningún lado)
    const yAntes = p.y;
    p.vy = Math.max(p.vy - GRAV * dt, -14);
    p.y += p.vy * dt;
    p.suelo = false;
    for (const b of bloques) {
        if (!solapa(p, b)) continue;
        if (p.vy <= 0 && yAntes >= b.y + b.h - 0.01) {          // cae encima
            p.y = b.y + b.h; p.vy = 0; p.suelo = true;
        } else if (p.vy > 0) {                                  // se golpea la cabeza
            p.y = b.y - p.h; p.vy = 0;
        }
    }
    // Suelo firme en todo el mapa: si Cocardo baja hasta la altura del suelo, aterriza
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.suelo = true; }

    // Disparo (mantener apretado = ráfaga)
    if (teclas.disparar && p.cd <= 0 && balas > 0 && !enTransicion) {
        balas--; p.cd = 14; p.flash = 6;
        lanzar(p.dir > 0 ? p.x + p.w : p.x - 16, p.y + 20, p.dir * 9, false);
        actualizarHUD();
    } else if (teclas.disparar && balas <= 0 && !enTransicion && listo("sinBalas", 6000)) {
        decir(DIALOGOS.sinBalas, 1);
    }
}

function danar(lado) {
    if (p.invul > 0 || enTransicion) return;
    vida--;
    p.invul = 90; p.golpe = 12; p.vx = lado * 7; p.vy = 6; p.suelo = false;
    actualizarHUD();
    if (vida <= 0) return terminar(false);
    if (vida === 1) decir(DIALOGOS.pocaVida, 2);
    else if (listo("dano", 4000)) decir(elegir(DIALOGOS.dano), 1);
}

// ================= ENEMIGOS Y DISPAROS =================
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

function moverEnemigos(dt) {
    for (const e of enemigos) {
        if (e.jefe) { moverJefe(e, dt); continue; }
        e.el.classList.toggle("der", p.x > e.x);   // miran hacia el jugador
        if (e.tipo === "torreta") { moverTorreta(e, dt); continue; }
        e.x += e.dir * e.vel * dt;
        if (e.x <= e.min) { e.x = e.min; e.dir = 1; }
        else if (e.x >= e.max) { e.x = e.max; e.dir = -1; }
        if (e.tipo === "volador") { e.fase += 0.05 * dt; e.y = e.y0 + Math.sin(e.fase) * e.amp; }
    }
}

// Devuelve la velocidad [vx, vy] para que un disparo salga desde (x, y) hacia Cocardo
function apuntar(x, y, v) {
    const dx = p.x + p.w / 2 - x, dy = p.y + p.h / 2 - y, L = Math.hypot(dx, dy) || 1;
    return [dx / L * v, dy / L * v];
}

// Torreta: se ilumina un instante antes de disparar y dispara apuntando (los bloques sirven de cobertura)
function moverTorreta(e, dt) {
    if (enTransicion) return;
    e.t -= dt;
    const cerca = Math.abs(p.x - e.x) < 460;
    e.el.dataset.estado = cerca && e.t < 28 ? "aviso" : "activo";
    if (e.t > 0) return;
    e.t = e.cad;
    if (!cerca) return;
    const x = e.x + e.w / 2 + (p.x > e.x ? 18 : -18), y = e.y + 14;
    const [vx, vy] = apuntar(x, y, 3.8);
    lanzar(x - 9, y - 9, vx, true, vy);
}

// Jefe: persigue -> avisa (tiembla y se agazapa) -> ataca (embestida, disparos o salto) -> se recupera
function moverJefe(e, dt) {
    if (enTransicion) return;
    e.t -= dt; e.poseT -= dt;
    const cJ = p.x + p.w / 2, cE = e.x + e.w / 2, haciaJugador = cJ > cE ? 1 : -1;
    switch (e.estado) {
        case "activo": {
            e.mira = haciaJugador;
            const lejos = Math.abs(cJ - cE) > 700;
            const meta = limitar(cJ - e.w / 2, e.min, e.max);
            if (!lejos && Math.abs(meta - e.x) > 2) { e.x += Math.sign(meta - e.x) * e.vel * dt; e.anim += e.vel * dt * 0.07; }
            if (e.t <= 0 && !lejos) {
                e.ataque = e.ultimoAtaque = elegir(e.ataques.filter(a => a !== e.ultimoAtaque));
                cambiarEstado(e, "aviso", e.aviso);
            }
            break;
        }
        case "aviso":
            e.mira = haciaJugador;
            if (e.t > 0) break;
            if (e.ataque === "fuego") {
                dispararJefe(e, haciaJugador);
                e.pose = 3; e.poseT = 22;
                cambiarEstado(e, "recupera", 45);
            } else if (e.ataque === "salto") {
                e.dir = haciaJugador; e.vy = 11;
                e.vsalto = limitar(Math.abs(cJ - cE) / 36, 1.8, 6.5);   // cae más o menos donde estabas
                cambiarEstado(e, "salto", 999);
            } else {
                e.dir = haciaJugador;
                temblor();
                cambiarEstado(e, "embestida", 45);
            }
            break;
        case "embestida":
            e.x += e.dir * e.vel * 4 * dt; e.anim += 0.3 * dt;
            if (e.x <= e.min || e.x >= e.max || e.t <= 0) {
                e.x = limitar(e.x, e.min, e.max);
                cambiarEstado(e, "recupera", 50);
            }
            break;
        case "salto":
            e.x = limitar(e.x + e.dir * e.vsalto * dt, e.min, e.max);
            e.vy -= GRAV * dt; e.y += e.vy * dt;
            if (e.y <= 0 && e.vy < 0) {
                e.y = 0; e.vy = 0;
                temblor();
                if (e.onda) lanzarOnda(e);
                cambiarEstado(e, "recupera", 55);
            }
            break;
        default:   // recupera
            if (e.t <= 0) cambiarEstado(e, "activo", e.cad);
    }
}

function dispararJefe(e, dir) {
    const x = dir > 0 ? e.x + e.w : e.x - 18;
    if (e.fuego === "recto") {           // tres disparos rectos a distinta altura
        [[25, 1], [55, 1.15], [85, 1.3]].forEach(([y, k]) => lanzar(x, y, e.vf * k * dir, true));
    } else {                             // abanico apuntado a Cocardo
        const y = 45, [vx, vy] = apuntar(x, y, e.vf), base = Math.atan2(vy, vx), n = e.n || 3;
        for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.26;
            lanzar(x, y, Math.cos(a) * e.vf, true, Math.sin(a) * e.vf);
        }
    }
}

// Onda de choque al aterrizar: dos disparos bajos que hay que saltar
function lanzarOnda(e) {
    const c = e.x + e.w / 2, v = e.vf * 0.85;
    lanzar(c + e.w / 2 - 6, 2, v, true, 0, 28, 14);
    lanzar(c - e.w / 2 - 22, 2, -v, true, 0, 28, 14);
}

function cambiarEstado(e, estado, t) {
    e.estado = estado;
    e.t = t;
    e.el.dataset.estado = estado;
}

function temblor() {
    zonaJuego.classList.remove("tiembla");
    void zonaJuego.offsetWidth;   // reinicia la animación
    zonaJuego.classList.add("tiembla");
}

function lanzar(x, y, vx, hostil, vy = 0, w, h) {
    w = w || (hostil ? 18 : 16); h = h || (hostil ? 18 : 6);
    disparos.push({ x, y, vx, vy, w, h, hostil, el: crear(hostil ? "disparo enemigoDisparo" : "disparo", 0, 0, w, h) });
}

function moverDisparos(dt) {
    for (let i = disparos.length - 1; i >= 0; i--) {
        const d = disparos[i];
        d.x += d.vx * dt; d.y += d.vy * dt;
        let borrar = d.x < -30 || d.x > nivel.ancho + 30 || d.y < -4 || d.y > 420 || bloques.some(b => solapa(d, b));
        if (!borrar && d.hostil && solapa(d, p)) { danar(d.vx > 0 ? 1 : -1); borrar = true; }
        if (!borrar && !d.hostil) {
            const e = enemigos.find(en => solapa(d, en));
            if (e) { golpear(e); borrar = true; }
        }
        if (borrar) { d.el.remove(); disparos.splice(i, 1); }
    }
}

function golpear(e) {
    e.vida--;
    e.el.classList.add("golpeado");
    setTimeout(() => e.el.classList.remove("golpeado"), 90);
    if (e.jefe) {
        jefeVida.style.width = Math.max(0, e.vida / e.vidaMax * 100) + "%";
        if (!e.furia && e.vida > 0 && e.vida <= e.vidaMax / 2) {   // a mitad de vida se enfurece
            e.furia = true; e.vel *= 1.3; e.cad *= 0.7; e.aviso = Math.round(e.aviso * 0.8); e.vf *= 1.1;
            e.el.classList.add("furia");
            jefeVida.classList.add("furia");
            mostrarAviso("THE BOSS IS ENRAGED!", 1400);
            decir(elegir(DIALOGOS.jefeFuria[nivelActual]), 3);
        }
    }
    if (e.vida > 0) return;

    enemigos.splice(enemigos.indexOf(e), 1);
    puntos += e.pts;
    if (!e.jefe) balas += BALAS_ENEMIGO;
    actualizarHUD();
    if (e.jefe) {
        e.el.classList.add("muere");
        setTimeout(() => e.el.remove(), 1000);
        completarZona();
    } else {
        e.el.remove();
        if (listo("bestia", 9000)) decir(DIALOGOS.enemigoDerrotado, 1);
    }
}

function recogerItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (!solapa(p, it)) continue;
        if (it.t === "v" && vida >= VIDAS_MAX) continue;      // con la vida llena el corazón queda en el mapa
        if (it.t === "b") { balas += BALAS_ITEM; puntos += 10; }
        else if (it.t === "v") { vida++; puntos += 15; }
        else puntos += 25;
        it.el.remove();
        items.splice(i, 1);
        actualizarHUD();
        if (listo("item", 6000)) decir(elegir(it.t === "b" ? DIALOGOS.balas : it.t === "v" ? DIALOGOS.corazon : DIALOGOS.moneda), 1);
    }
}

// ================= UTILIDADES Y DIBUJO =================
function solapa(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function actualizarHUD() {
    vidaTexto.textContent = Math.max(vida, 0);
    balasTexto.textContent = balas;
    puntosTexto.textContent = puntos;
}

function mostrarAviso(texto, ms) {
    clearTimeout(tAviso);
    aviso.textContent = texto;
    aviso.classList.add("visible");
    tAviso = setTimeout(() => aviso.classList.remove("visible"), ms);
}

function poner(el, x, y) {
    el.style.transform = `translate3d(${Math.round(x)}px, ${-Math.round(y)}px, 0)`;
}

function dibujar() {
    poner(jugador, p.x, p.y);
    jugador.classList.toggle("corriendo", p.suelo && Math.abs(p.vx) > 0.8);
    jugador.classList.toggle("aire", !p.suelo);
    jugador.classList.toggle("mirandoIzq", p.dir < 0);
    jugador.classList.toggle("disparando", p.flash > 0);
    jugador.classList.toggle("herido", p.invul > 0);
    enemigos.forEach(e => { poner(e.el, e.x, e.y); if (e.jefe) animarJefe(e); });
    disparos.forEach(d => poner(d.el, d.x, d.y));

    const cx = Math.round(camX);
    mapa.style.transform = `translate3d(${-cx}px, 0, 0)`;
    if (dialogoVisible) posicionarDialogo(cx);
    // Parallax: cada capa se mueve a una fracción de la cámara y se repite en bucle
    capas.forEach(([el, factor, tile]) => {
        el.style.transform = `translate3d(${-((camX * factor) % tile)}px, 0, 0)`;
    });
}

// ================= TORMENTA TÓXICA =================
// Cada tanto cae un rayo: destello en todo el cielo y un relámpago dibujado detrás de la ciudad
function programarRayo() {
    clearTimeout(tRayo);
    tRayo = setTimeout(() => { lanzarRayo(); programarRayo(); }, 2500 + Math.random() * 5500);
}

function lanzarRayo() {
    if (!juegoActivo) return;
    rayo.style.left = (8 + Math.random() * 80) + "%";
    rayo.style.transform = `scaleX(${Math.random() < 0.5 ? -1 : 1})`;
    for (const el of [rayo, relampago]) {
        el.classList.remove("on");
        void el.offsetWidth;   // reinicia la animación
        el.classList.add("on");
    }
}
