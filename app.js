// -----------------------------
// CONSTANTES
// -----------------------------
const LS_ACCEPTED = "cj_aceptado_v1";
const LS_NAME = "nombre_trabajador";
const LS_READ_TERMS = "cj_read_terms_v1";
const LS_REGISTROS = "registros";
const LS_ESTADO = "estado";
const LS_ADELANTO = "adelanto";

// -----------------------------
// VARIABLES
// -----------------------------
let registros = JSON.parse(localStorage.getItem(LS_REGISTROS)) || {};
let estado = JSON.parse(localStorage.getItem(LS_ESTADO)) || 0;

// SUELDO NOMINAL (editable directo en el archivo)
let salario = 29267;

// ADELANTO
let adelanto = parseFloat(localStorage.getItem(LS_ADELANTO)) || 0;

// -----------------------------
// INICIO
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    const adel = document.getElementById("adelanto");
    if (adel) adel.value = adelanto || "";

    setupModalFlow();
    actualizarTabla();
});

// -----------------------------
// MODAL INICIAL
// -----------------------------
function setupModalFlow(){
    const accepted = JSON.parse(localStorage.getItem(LS_ACCEPTED));
    const name = localStorage.getItem(LS_NAME);

    if(accepted && name){
        setUserName(name);
        showApp();
        return;
    }

    document.getElementById("initialOverlay").style.display = "flex";

    const inputNombre = document.getElementById("inputNombre");
    const chkAcepto = document.getElementById("chkAcepto");
    const btnAceptar = document.getElementById("btnAceptar");

    function validar(){
        const okName = inputNombre.value.trim().length >= 2;
        const okChk = chkAcepto.checked;
        if(okName && okChk){
            btnAceptar.classList.remove("disabled");
        } else {
            btnAceptar.classList.add("disabled");
        }
    }

    inputNombre.addEventListener("input", validar);
    chkAcepto.addEventListener("change", validar);
}

function acceptAndContinue(){
    const name = document.getElementById("inputNombre").value.trim();
    const chk = document.getElementById("chkAcepto").checked;

    if(name.length < 2 || !chk){
        alert("Debes ingresar un nombre válido y aceptar los términos.");
        return;
    }

    localStorage.setItem(LS_ACCEPTED, true);
    localStorage.setItem(LS_READ_TERMS, true);
    localStorage.setItem(LS_NAME, name);

    setUserName(name);
    hideModalAndShowApp();
}

function denyAccess(){
    alert("No puedes usar la app sin aceptar los términos.");
}

function setUserName(n){
    document.getElementById("titulo").innerText =
        "CONTROL DE JORNADA - " + n.toUpperCase();
}

function hideModalAndShowApp(){
    document.getElementById("initialOverlay").style.display = "none";
    showApp();
}

function showApp(){
    const app = document.getElementById("appContent");
    app.style.display = "block";
    app.setAttribute("aria-hidden","false");
}

// -----------------------------
// TERMINOS Y CONDICIONES
// -----------------------------
function openLegalPanelFromModal(){
    document.getElementById("initialOverlay").style.display = "none";
    document.getElementById("legalPanel").classList.remove("hidden");

    localStorage.setItem(LS_READ_TERMS, true);
}

function returnToModal(){
    document.getElementById("legalPanel").classList.add("hidden");
    document.getElementById("initialOverlay").style.display = "flex";
}

// -----------------------------
// ADELANTO
// -----------------------------
function guardarAdelanto(){
    adelanto = parseFloat(document.getElementById("adelanto").value) || 0;
    localStorage.setItem(LS_ADELANTO, adelanto);
}

function confirmarAdelanto(){
    guardarAdelanto();
    alert("Adelanto confirmado: $" + adelanto);
}

// -----------------------------
// REGISTROS
// -----------------------------
function horaActual(){
    return new Date().toTimeString().slice(0,5);
}

function convertirMin(h){
    if(!h) return null;
    const parts = h.split(":");
    const hh = parseInt(parts[0],10) || 0;
    const mm = parseInt(parts[1],10) || 0;
    return hh*60 + mm;
}

function agregarRegistro(tipo, diaManual = null, horaManual = null){
    let dia = diaManual || new Date().toLocaleDateString("es-UY");

    if(!registros[dia]){
        registros[dia] = {
            entrada:"",
            edesc:"",
            sdesc:"",
            salida:"",
            horas:0,
            extras:0
        };
    }

    registros[dia][tipo] = horaManual || horaActual();
    calcularHoras(dia);
    persistirRegistros();
    actualizarTabla();
}

/* -----------------------------
   calcularHoras(dia) -> NUEVA versión
   Calcula por tramos:
   - entrada -> edesc
   - sdesc -> salida
   - fallback: entrada -> salida (medio día)
   ----------------------------- */
function calcularHoras(dia){
    const r = registros[dia];

    const entrada = convertirMin(r.entrada);
    const edesc = convertirMin(r.edesc);
    const sdesc = convertirMin(r.sdesc);
    const salida = convertirMin(r.salida);

    let total = 0;

    // Primer tramo: entrada -> inicio descanso (si ambos existen y están en orden)
    if(entrada !== null && edesc !== null && edesc > entrada){
        total += (edesc - entrada) / 60;
    }

    // Segundo tramo: fin descanso -> salida (si ambos existen y están en orden)
    if(sdesc !== null && salida !== null && salida > sdesc){
        total += (salida - sdesc) / 60;
    }

    // Caso especial: solo entrada y salida (sin descansos) -> uso directo
    if(entrada !== null && salida !== null && salida > entrada && edesc === null && sdesc === null){
        total = (salida - entrada) / 60;
    }

    // Si no se cumple nada arriba, total queda 0 (no hay datos suficientes)
    r.horas = Number(total.toFixed(2));
    r.extras = total > 8 ? Number((total - 8).toFixed(2)) : 0;
}

// -----------------------------
function persistirRegistros(){
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
}

// -----------------------------
// ACCIONES
// -----------------------------
function registrarAccion(){
    const orden = ["entrada","edesc","sdesc","salida"];
    agregarRegistro(orden[estado]);
    estado = (estado + 1) % 4;
    localStorage.setItem(LS_ESTADO, estado);
}

let medioDiaEstado = 0;
function registrarMedioDia(){
    agregarRegistro(medioDiaEstado === 0 ? "entrada" : "salida");
    medioDiaEstado = (medioDiaEstado + 1) % 2;
}

// -----------------------------
// REGISTRO MANUAL
// -----------------------------
function guardarManual(){
    const diaInput = document.getElementById("manualDia").value;
    const hora = document.getElementById("manualHora").value;
    const tipo = document.getElementById("manualTipo").value;

    if(!diaInput || !hora){
        alert("Debes ingresar día y hora.");
        return;
    }

    const [y,m,d] = diaInput.split("-");
    const fecha = `${d}/${m}/${y}`;

    agregarRegistro(tipo, fecha, hora);

    alert("Registro manual guardado.");

    document.getElementById("manualDia").value = "";
    document.getElementById("manualHora").value = "";
}

function toggleManual(){
    const box = document.getElementById("manualBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
}

// -----------------------------
// TABLA
// -----------------------------
function actualizarTabla(){
    const tabla = document.getElementById("tabla");
    tabla.innerHTML = `
        <tr>
            <th>Día</th>
            <th>Entrada</th>
            <th>E. Descanso</th>
            <th>S. Descanso</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Extras</th>
        </tr>
    `;

    const fechas = Object.keys(registros).sort((a,b)=>{
        const toDate = (s)=>{
            const [dd,mm,yyyy] = s.split("/");
            return new Date(yyyy,mm-1,dd).getTime();
        };
        return toDate(a) - toDate(b);
    });

    for(const d of fechas){
        const r = registros[d];
        tabla.innerHTML += `
            <tr>
                <td>${d}</td>
                <td>${r.entrada || "-"}</td>
                <td>${r.edesc || "-"}</td>
                <td>${r.sdesc || "-"}</td>
                <td>${r.salida || "-"}</td>
                <td>${r.horas}</td>
                <td>${r.extras}</td>
            </tr>
        `;
    }
}

// -----------------------------
// ELIMINAR
// -----------------------------
const ADMIN_PASS = "1234";

function eliminarRegistros(){
    const pass = prompt("Ingrese la contraseña:");
    if(pass !== ADMIN_PASS){
        alert("Contraseña incorrecta.");
        return;
    }
    if(!confirm("¿Eliminar todos los registros?")) return;

    registros = {};
    estado = 0;
    adelanto = 0;

    localStorage.removeItem(LS_REGISTROS);
    localStorage.removeItem(LS_ESTADO);
    localStorage.removeItem(LS_ADELANTO);

    actualizarTabla();
    alert("Registros eliminados.");
}

// -----------------------------
// RECIBO (CORREGIDO CON BPS)
// -----------------------------
function generarImagenRecibo(){
    // Asegurarse de tener horas actualizadas
    for(const d in registros) calcularHoras(d);

    let totalHoras = 0;
    let totalExtras = 0;

    const fechas = Object.keys(registros).sort((a,b)=>{
        const toDate = (s)=>{
            const [dd,mm,yyyy] = s.split("/");
            return new Date(yyyy,mm-1,dd).getTime();
        };
        return toDate(a) - toDate(b);
    });

    for(const d of fechas){
        totalHoras += Number(registros[d].horas) || 0;
        totalExtras += Number(registros[d].extras) || 0;
    }

    const valorHora = salario / 160;
    const pagoHoras = totalHoras * valorHora;
    const pagoExtras = totalExtras * valorHora * 1.5;
    const totalBruto = pagoHoras + pagoExtras;

    const descuentoBPS = totalBruto * 0.22;
    const despuesDeBPS = totalBruto - descuentoBPS;

    const adel = parseFloat(localStorage.getItem(LS_ADELANTO)) || 0;
    const liquido = despuesDeBPS - adel;

    // Generar imagen
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,900,1500);

    ctx.fillStyle = "#000";
    ctx.font = "26px Arial";
    ctx.fillText("RECIBO DE CONTROL DE JORNADA", 180, 40);

    ctx.font = "18px Arial";
    ctx.fillText("Trabajador: " + (localStorage.getItem(LS_NAME) || "Sin nombre"), 30, 80);
    ctx.fillText("Fecha: " + new Date().toLocaleDateString(), 30, 110);
    ctx.fillText("Sueldo nominal: $" + salario, 30, 140);

    let y = 190;
    ctx.font = "18px Arial";
    ctx.fillText("Detalles del mes:", 30, y);
    y += 30;

    ctx.font = "14px Arial";
    for(const d of fechas){
        const r = registros[d];
        ctx.fillText(`${d} | E:${r.entrada||"-"} | ED:${r.edesc||"-"} | SD:${r.sdesc||"-"} | S:${r.salida||"-"} | H:${r.horas} | EX:${r.extras}`, 30, y);
        y += 20;
        if(y > canvas.height - 200) break;
    }

    y += 20;
    ctx.font = "16px Arial";
    ctx.fillText("Resumen:", 30, y); y += 24;
    ctx.font = "14px Arial";
    ctx.fillText("Horas trabajadas: " + totalHoras.toFixed(2), 30, y); y += 20;
    ctx.fillText("Horas extra: " + totalExtras.toFixed(2), 30, y); y += 20;
    ctx.fillText("Pago por horas: $" + pagoHoras.toFixed(2), 30, y); y += 20;
    ctx.fillText("Pago horas extra: $" + pagoExtras.toFixed(2), 30, y); y += 20;
    ctx.fillText("Total bruto: $" + totalBruto.toFixed(2), 30, y); y += 20;

    ctx.fillStyle = "#b71c1c";
    ctx.fillText("Descuento BPS (22%): -$" + descuentoBPS.toFixed(2), 30, y); y += 20;

    ctx.fillStyle = "#000";
    ctx.fillText("Después de BPS: $" + despuesDeBPS.toFixed(2), 30, y); y += 20;
    ctx.fillText("Adelanto: -$" + adel.toFixed(2), 30, y); y += 22;

    ctx.fillStyle = "#2e7d32";
    ctx.font = "18px Arial";
    ctx.fillText("💵 TOTAL EN MANO (LÍQUIDO): $" + liquido.toFixed(2), 30, y);

    const link = document.createElement("a");
    link.download = "recibo_control_jornada.png";
    link.href = canvas.toDataURL();
    link.click();
}
