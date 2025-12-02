const LS_NAME = "nombre_trabajador";
const LS_REGISTROS = "registros";
const LS_ESTADO = "estado";
const LS_ADELANTO = "adelanto";
const LS_SALARIO = "cj_salario_personalizado";
const LS_PASS_ADMIN = "cj_pass_admin";

let registros = JSON.parse(localStorage.getItem(LS_REGISTROS)) || {};
let estado = JSON.parse(localStorage.getItem(LS_ESTADO)) || 0;
let salario = 29267;
let adelanto = parseFloat(localStorage.getItem(LS_ADELANTO)) || 0;
window.ADMIN_PASS = localStorage.getItem(LS_PASS_ADMIN) || "1234";

document.addEventListener("DOMContentLoaded", () => {
    cargarAjustesPersonalizados();
    const adel = document.getElementById("adelanto");
    if (adel) adel.value = adelanto || "";
    setupModalFlow();
    actualizarTabla();
});

function cargarAjustesPersonalizados() {
    const nombre = localStorage.getItem(LS_NAME);
    if (nombre) setUserName(nombre);
    const s = localStorage.getItem(LS_SALARIO);
    if (s) salario = parseFloat(s);
    const p = localStorage.getItem(LS_PASS_ADMIN);
    if (p) window.ADMIN_PASS = p;
}

function setUserName(n) {
    document.getElementById("titulo").innerText = "CONTROL DE JORNADA - " + n.toUpperCase();
}

function horaActual() { return new Date().toTimeString().slice(0,5); }

function convertirMin(h){
    if(!h) return null;
    const [hh,mm] = h.split(":").map(Number);
    return hh*60 + mm;
}

function agregarRegistro(tipo, diaManual=null, horaManual=null){
    let dia = diaManual || new Date().toLocaleDateString("es-UY");
    if(!registros[dia]) registros[dia] = {entrada:"",edesc:"",sdesc:"",salida:"",horas:0,extras:0};
    registros[dia][tipo] = horaManual || horaActual();
    calcularHoras(dia);
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
}

function calcularHoras(dia){
    const r = registros[dia];
    const e = convertirMin(r.entrada), ed = convertirMin(r.edesc), sd = convertirMin(r.sdesc), s = convertirMin(r.salida);
    let total = 0;
    if(e!==null && ed!==null && ed>e) total += (ed-e)/60;
    if(sd!==null && s!==null && s>sd) total += (s-sd)/60;
    if(e!==null && s!==null && s>e && ed===null && sd===null) total = (s-e)/60;
    r.horas = Number(total.toFixed(2));
    r.extras = total > 8 ? Number((total-8).toFixed(2)) : 0;
}

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

function guardarManual(){
    const d = document.getElementById("manualDia").value;
    const h = document.getElementById("manualHora").value;
    const t = document.getElementById("manualTipo").value;
    if(!d || !h) return alert("Faltan datos");
    const [y,m,dd] = d.split("-");
    agregarRegistro(t, `${dd}/${m}/${y}`, h);
    document.getElementById("manualDia").value = "";
    document.getElementById("manualHora").value = "";
}

function toggleManual(){
    const b = document.getElementById("manualBox");
    b.style.display = b.style.display === "none" ? "block" : "none";
}

function actualizarTabla(){
    const t = document.getElementById("tabla");
    t.innerHTML = `<tr><th>Día</th><th>Entrada</th><th>E.Descanso</th><th>S.Descanso</th><th>Salida</th><th>Horas</th><th>Extras</th></tr>`;
    const fechas = Object.keys(registros).sort((a,b)=>{
        const toD = s => { const [d,m,y] = s.split("/"); return new Date(y,m-1,d); };
        return toD(a) - toD(b);
    });
    fechas.forEach(d => {
        const r = registros[d];
        t.innerHTML += `<tr><td>${d}</td><td>${r.entrada||"-"}</td><td>${r.edesc||"-"}</td><td>${r.sdesc||"-"}</td><td>${r.salida||"-"}</td><td>${r.horas}</td><td>${r.extras}</td></tr>`;
    });
}

function generarImagenRecibo(){
    Object.keys(registros).forEach(calcularHoras);

    let totalHoras = 0;
    let totalExtras = 0;

    const fechas = Object.keys(registros).sort((a,b)=>{
        const toD = s => { const [d,m,y]=s.split("/"); return new Date(y,m-1,d); };
        return toD(a)-toD(b);
    });

    fechas.forEach(d => {
        totalHoras += registros[d].horas || 0;
        totalExtras += registros[d].extras || 0;
    });

    const valorHoraNormal = salario / 160;
    const valorHoraExtra = valorHoraNormal * 1.5;

    const pagoHorasNormales = totalHoras * valorHoraNormal;
    const pagoHorasExtras = totalExtras * valorHoraExtra;
    const totalBruto = pagoHorasNormales + pagoHorasExtras;

    const descuentoBPS = totalBruto * 0.22;
    const netoDespuesBPS = totalBruto - descuentoBPS;
    const liquidoFinal = netoDespuesBPS - adelanto;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1600 + fechas.length * 25;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("RECIBO DE SUELDO", 450, 60);

    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Trabajador: ${localStorage.getItem(LS_NAME) || "Sin nombre"}`, 50, 120);
    ctx.fillText(`Período: ${fechas[0] || "?"} al ${fechas[fechas.length-1] || "?"}`, 50, 150);
    ctx.fillText(`Fecha de emisión: ${new Date().toLocaleDateString("es-UY")}`, 50, 180);
    ctx.fillText(`Sueldo nominal mensual: $${salario.toLocaleString()}`, 50, 210);

    let y = 280;
    ctx.font = "bold 18px Arial";
    ctx.fillText("DETALLE DIARIO", 50, y);
    y += 30;
    ctx.font = "16px Arial";

    fechas.forEach(d => {
        const r = registros[d];
        ctx.fillText(`${d} → ${r.entrada||"-"} | ${r.edesc||"-"} → ${r.sdesc||"-"} | ${r.salida||"-"} → ${r.horas}h (+${r.extras}h extra)`, 70, y);
        y += 25;
    });

    y += 30;
    ctx.fillStyle = "#1565c0";
    ctx.font = "bold 20px Arial";
    ctx.fillText("RESUMEN DE LIQUIDACIÓN", 50, y);
    y += 40;

    ctx.font = "18px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(`Horas trabajadas: ${totalHoras.toFixed(2)} × $${valorHoraNormal.toFixed(2)} = $${pagoHorasNormales.toFixed(2)}`, 50, y); y += 30;
    ctx.fillText(`Horas extras: ${totalExtras.toFixed(2)} × $${valorHoraExtra.toFixed(2)} = $${pagoHorasExtras.toFixed(2)}`, 50, y); y += 40;

    ctx.font = "bold 20px Arial";
    ctx.fillText(`TOTAL BRUTO: $${totalBruto.toFixed(2)}`, 50, y); y += 40;

    ctx.fillStyle = "#d32f2f";
    ctx.fillText(`Descuento BPS (22%): -$${descuentoBPS.toFixed(2)}`, 50, y); y += 30;

    ctx.fillStyle = "#000000";
    ctx.fillText(`Neto después de BPS: $${netoDespuesBPS.toFixed(2)}`, 50, y); y += 30;
    ctx.fillText(`Adelanto solicitado: -$${adelanto.toFixed(2)}`, 50, y); y += 50;

    ctx.fillStyle = "#2e7d32";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`LÍQUIDO A COBRAR: $${liquidoFinal.toFixed(2)}`, 50, y);

    const link = document.createElement("a");
    link.download = `recibo_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function pedirPassAjustes(){
    document.getElementById("inputPassAjustes").value = "";
    document.getElementById("passAjustesOverlay").classList.remove("hidden");
}
function cerrarPassAjustes(){ document.getElementById("passAjustesOverlay").classList.add("hidden"); }
function verificarPassAjustes(){
    if(document.getElementById("inputPassAjustes").value === window.ADMIN_PASS){
        cerrarPassAjustes();
        abrirAjustes();
    } else alert("Contraseña incorrecta");
}

function abrirAjustes(){
    document.getElementById("ajustesNombre").value = localStorage.getItem(LS_NAME) || "";
    document.getElementById("ajustesSalario").value = salario;
    document.getElementById("ajustesPass").value = "";
    document.getElementById("diaEliminar").value = "";
    document.getElementById("ajustesOverlay").classList.remove("hidden");
}
function cerrarAjustes(){ document.getElementById("ajustesOverlay").classList.add("hidden"); }

function guardarAjustes(){
    const nombre = document.getElementById("ajustesNombre").value.trim();
    const sueldo = parseFloat(document.getElementById("ajustesSalario").value);
    const nuevaPass = document.getElementById("ajustesPass").value.trim();
    if(!nombre || nombre.length < 2) return alert("Nombre inválido");
    if(isNaN(sueldo) || sueldo < 10000) return alert("Sueldo mínimo $10.000");
    if(nuevaPass && nuevaPass.length < 4) return alert("Contraseña muy corta");
    localStorage.setItem(LS_NAME, nombre);
    localStorage.setItem(LS_SALARIO, sueldo);
    if(nuevaPass){
        localStorage.setItem(LS_PASS_ADMIN, nuevaPass);
        window.ADMIN_PASS = nuevaPass;
    }
    salario = sueldo;
    setUserName(nombre);
    cerrarAjustes();
    alert("Guardado!");
}

function eliminarDiaEspecifico(){
    const f = document.getElementById("diaEliminar").value;
    if(!f) return alert("Elige fecha");
    const [y,m,d] = f.split("-");
    const clave = `${d}/${Number(m)}/${y}`;
    if(!registros[clave]) return alert("No existe");
    if(!confirm(`¿Eliminar ${clave}?`)) return;
    delete registros[clave];
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Eliminado");
}

function eliminarTodoConConfirm(){
    if(!confirm("¿BORRAR TODO PARA SIEMPRE?")) return;
    if(!confirm("¿SEGURO? NO HAY VUELTA ATRÁS")) return;
    registros = {}; estado = 0; adelanto = 0;
    localStorage.removeItem(LS_REGISTROS);
    localStorage.removeItem(LS_ESTADO);
    localStorage.removeItem(LS_ADELANTO);
    actualizarTabla();
    alert("Todo eliminado");
}

function eliminarRegistros(){
    if(prompt("Contraseña:") !== window.ADMIN_PASS) return alert("Incorrecta");
    eliminarTodoConConfirm();
}

function guardarAdelanto(){
    adelanto = parseFloat(document.getElementById("adelanto").value) || 0;
    localStorage.setItem(LS_ADELANTO, adelanto);
}
function confirmarAdelanto(){ guardarAdelanto(); alert("Adelanto confirmado"); }

function setupModalFlow(){
    if(localStorage.getItem(LS_NAME)){
        showApp();
    } else {
        document.getElementById("initialOverlay").style.display = "flex";
    }
}
function acceptAndContinue(){
    const n = document.getElementById("inputNombre").value.trim();
    if(n.length < 2 || !document.getElementById("chkAcepto").checked) return alert("Faltan datos");
    localStorage.setItem(LS_NAME, n);
    setUserName(n);
    document.getElementById("initialOverlay").style.display = "none";
    showApp();
}
function showApp(){ document.getElementById("appContent").style.display = "block"; }

// === NUEVAS FUNCIONES PARA TÉRMINOS Y CHECKBOX ===
function openLegalPanelFromModal() {
    document.getElementById("initialOverlay").style.display = "none";
    document.getElementById("legalPanel").classList.remove("hidden");
}

function returnToModal() {
    document.getElementById("legalPanel").classList.add("hidden");
    document.getElementById("initialOverlay").style.display = "flex";
}

function toggleAceptarBtn() {
    const chk = document.getElementById("chkAcepto");
    const btn = document.getElementById("btnAceptar");
    btn.classList.toggle("disabled", !chk.checked);
}
