/* Control de Jornada - MODO 1 COMPLETO PRO
   Aplicación 100% offline para registrar horas de trabajo
   Llaves de localStorage:
   - LS_NAME, LS_REGISTROS, LS_ESTADO, LS_ADELANTO, LS_SALARIO, LS_PASS_ADMIN
   - LS_ADELANTE_HIST (historial de adelantos)
   - LS_BACKUP (respaldo automático)
   - LS_MODO_SIMPLE, LS_AUTO_DESCANSO
   */

const LS_NAME = "nombre_trabajador";
const LS_REGISTROS = "registros";
const LS_ESTADO = "estado";
const LS_ADELANTO = "adelanto";
const LS_SALARIO = "cj_salario_personalizado";
const LS_PASS_ADMIN = "cj_pass_admin";
const LS_ADEL_HIST = "cj_adelantos_hist";
const LS_BACKUP = "cj_respaldo";
const LS_MODO_SIMPLE = "cj_modo_simple";
const LS_AUTO_DESC = "cj_auto_desc";

let registros = JSON.parse(localStorage.getItem(LS_REGISTROS)) || {};
let estado = JSON.parse(localStorage.getItem(LS_ESTADO)) || 0;
let salario = parseFloat(localStorage.getItem(LS_SALARIO)) || 29267;
let adelanto = parseFloat(localStorage.getItem(LS_ADELANTO)) || 0;
let adelantosHist = JSON.parse(localStorage.getItem(LS_ADEL_HIST)) || [];
window.ADMIN_PASS = localStorage.getItem(LS_PASS_ADMIN) || "1234";
let modoSimple = JSON.parse(localStorage.getItem(LS_MODO_SIMPLE)) || false;
let autoDescansoMin = parseInt(localStorage.getItem(LS_AUTO_DESC)) || 0;

let actionStack = [];

// Días festivos en Uruguay (dd/mm)
const DIAS_FESTIVOS = [
    "01/01", // Año Nuevo
    "06/01", // Epifanía
    "20/02", // Carnaval (flexible)
    "21/02", // Carnaval (flexible)
    "24/03", // Desembarco del 33
    "19/04", // Batalla de las Piedras
    "01/05", // Día del Trabajador
    "18/05", // Batalla de Rincón
    "19/06", // Natalicio de Artigas
    "25/08", // Declaración de la Independencia
    "02/11", // Día de Difuntos
    "06/11", // Día de Reyes Magos (alt)
    "25/12"  // Navidad
];

// Función para verificar si una fecha es festiva
function esDialFestivo(fechaDMY) {
    const [d, m, y] = fechaDMY.split("/");
    const diaFestivo = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    return DIAS_FESTIVOS.includes(diaFestivo);
}

// Función para obtener días laborables faltantes en el rango
function obtenerDiasFaltantes(fechas) {
    if (fechas.length <= 1) return new Map();

    const faltantes = new Map();
    const fechaMin = parseDateDMY(fechas[0]);
    const fechaMax = parseDateDMY(fechas[fechas.length - 1]);

    const diasRegistrados = new Set(fechas);

    for (let d = new Date(fechaMin); d <= fechaMax; d.setDate(d.getDate() + 1)) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = d.getFullYear();
        const diaFormato = `${dd}/${mm}/${yy}`;

        // Si no está registrado Y no es feriado Y no es domingo, marcarlo como faltante
        if (!diasRegistrados.has(diaFormato) && !esDialFestivo(diaFormato) && new Date(yy, mm - 1, dd).getDay() !== 0) {
            faltantes.set(diaFormato, true);
        }
    }

    return faltantes;
}

/* ------------------ DOM Ready ------------------ */
document.addEventListener("DOMContentLoaded", () => {
    cargarAjustesPersonalizados();
    document.getElementById("adelanto").value = adelanto || "";
    document.getElementById("autoDescansoMin").value = autoDescansoMin || "";
    document.getElementById("toggleModoSimple").checked = modoSimple;
    setupModalFlow();
    actualizarTabla();
    backupGuardar();
});

/* ------------------ UTILITARIOS ------------------ */
function hoyFormato() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
}
function horaActual() { return new Date().toTimeString().slice(0, 5); }
function parseDateDMY(s) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d);
}
function formatKeyFromInputDate(val) {
    if (!val) return null;
    const [y, m, d] = val.split("-");
    return `${d}/${Number(m)}/${y}`;
}
function timeToMin(t) {
    if (!t) return null;
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
}
function convertirMin(h) {
    if (!h) return null;
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
}

/* ------------------ CARGA / AJUSTES ------------------ */
function cargarAjustesPersonalizados() {
    const nombre = localStorage.getItem(LS_NAME);
    if (nombre) setUserName(nombre);
    const s = localStorage.getItem(LS_SALARIO);
    if (s) salario = parseFloat(s);
    const p = localStorage.getItem(LS_PASS_ADMIN);
    if (p) window.ADMIN_PASS = p;
    autoDescansoMin = parseInt(localStorage.getItem(LS_AUTO_DESC)) || 0;
    modoSimple = JSON.parse(localStorage.getItem(LS_MODO_SIMPLE)) || false;
}

function setUserName(n) {
    document.getElementById("titulo").innerText = "CONTROL DE JORNADA - " + n.toUpperCase();
}

/* ------------------ REGISTROS Y CÁLCULOS ------------------ */
function agregarRegistro(tipo, diaManual = null, horaManual = null, allowStack = true) {
    let dia = diaManual || hoyFormato();
    if (!registros[dia]) registros[dia] = { entrada: "", edesc: "", sdesc: "", salida: "", horas: 0, extras: 0, nota: "" };
    if (modoSimple && (tipo === "edesc" || tipo === "sdesc")) {
        return;
    }
    registros[dia][tipo] = horaManual || horaActual();
    calcularHoras(dia);
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    if (allowStack) actionStack.push({ op: "add", dia: dia, tipo: tipo, prev: "" });
    actualizarTabla();
    backupGuardar();
}

function calcularHoras(dia) {
    const r = registros[dia];
    const e = convertirMin(r.entrada), ed = convertirMin(r.edesc), sd = convertirMin(r.sdesc), s = convertirMin(r.salida);
    let total = 0;
    if (e !== null && ed !== null && ed > e) total += (ed - e) / 60;
    if (sd !== null && s !== null && s > sd) total += (s - sd) / 60;
    if (e !== null && s !== null && s > e && (ed === null || sd === null)) total = (s - e) / 60;
    r.horas = Number((total > 0 ? total : 0).toFixed(2));
    r.extras = total > 8 ? Number((total - 8).toFixed(2)) : 0;
}

function registrarAccion() {
    const ordenFull = ["entrada", "edesc", "sdesc", "salida"];
    const ordenSimple = ["entrada", "salida"];
    const orden = modoSimple ? ordenSimple : ordenFull;

    if (estado >= orden.length) estado = 0;

    const tipo = orden[estado];
    const autoMin = autoDescansoMin || 0;
    if (tipo === "entrada") {
        agregarRegistro("entrada");
        if (!modoSimple && autoMin > 0) {
            const ultimaHora = registros[hoyFormato()].entrada;
            if (ultimaHora) {
                const [hh, mm] = ultimaHora.split(":").map(Number);
                const dt = new Date();
                dt.setHours(hh); dt.setMinutes(mm + autoMin);
                const hAuto = String(dt.getHours()).padStart(2, '0') + ":" + String(dt.getMinutes()).padStart(2, '0');
                if (!registros[hoyFormato()].edesc) {
                    registros[hoyFormato()].edesc = hAuto;
                    calcularHoras(hoyFormato());
                    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
                    actionStack.push({ op: "add", dia: hoyFormato(), tipo: "edesc", prev: "" });
                }
            }
        }
    } else {
        agregarRegistro(tipo);
    }

    estado = (estado + 1) % orden.length;
    localStorage.setItem(LS_ESTADO, estado);
}

let medioDiaEstado = 0;
function registrarMedioDia() {
    agregarRegistro(medioDiaEstado === 0 ? "entrada" : "salida");
    medioDiaEstado = (medioDiaEstado + 1) % 2;
}

/* ------------------ MANUAL / EDICIÓN ------------------ */
function guardarManual() {
    const d = document.getElementById("manualDia").value;
    const h = document.getElementById("manualHora").value;
    const t = document.getElementById("manualTipo").value;
    if (!d || !h) return alert("Faltan datos");
    const clave = formatKeyFromInputDate(d);
    agregarRegistro(t, clave, h);
    document.getElementById("manualDia").value = "";
    document.getElementById("manualHora").value = "";
    alert("Guardado manual");
}

function guardarDiaCompleto() {
    const d = document.getElementById("manualDia").value;
    if (!d) return alert("Elige fecha antes");
    const clave = formatKeyFromInputDate(d);
    const ent = prompt("Hora de Entrada (HH:MM)", "09:00");
    if (!ent) return alert("Entrada vacía");
    const edesc = prompt("Hora de Salida a descanso (o dejar vacío)", "12:00");
    const sdesc = edesc ? prompt("Hora de Vuelta del descanso (o dejar vacío)", "13:00") : "";
    const salida = prompt("Hora de Salida final (HH:MM)", "18:00");
    registros[clave] = { entrada: ent || "", edesc: edesc || "", sdesc: sdesc || "", salida: salida || "", horas: 0, extras: 0 };
    calcularHoras(clave);
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actionStack.push({ op: "setday", dia: clave, prev: null });
    actualizarTabla();
    alert("Día completo guardado");
}

/* ------------------ TABLA / UI ------------------ */
function actualizarTabla() {
    const t = document.getElementById("tabla");
    t.innerHTML = `<tr><th>Día</th><th>Entrada</th><th>E.Descanso</th><th>S.Descanso</th><th>Salida</th><th>Horas</th><th>Extras</th><th>Acciones</th></tr>`;
    const fechas = Object.keys(registros).sort((a, b) => {
        return parseDateDMY(a) - parseDateDMY(b);
    });

    const hoy = hoyFormato();
    const faltantes = obtenerDiasFaltantes(fechas);

    // Agregar filas de días faltantes PRIMERO (en rojo)
    faltantes.forEach((_, diaFaltante) => {
        t.innerHTML += `<tr class="tr-faltante">
            <td><strong>${diaFaltante}</strong></td>
            <td colspan="7" style="text-align:center;color:#c62828;font-style:italic;">- Día no laborado -</td>
        </tr>`;
    });

    // Luego procesar registros existentes
    fechas.forEach(d => {
        const r = registros[d];
        calcularHoras(d);
        const classes = [];
        if (d === hoy) classes.push("tr-current");
        if (esDialFestivo(d)) classes.push("tr-festivo");
        const countFilled = ["entrada", "edesc", "sdesc", "salida"].reduce((acc, k) => acc + (r[k] && r[k] !== "" ? 1 : 0), 0);
        if (!modoSimple && countFilled < 2) classes.push("tr-incomplete");
        if (modoSimple && ((r.entrada && !r.salida) || (!r.entrada && r.salida))) classes.push("tr-incomplete");

        const trClass = classes.join(" ");
        const horasSpan = r.extras > 0 ? `<span class="horas-extras">${r.horas}</span>` : `<span class="horas-normales">${r.horas}</span>`;
        const acciones = `<div class="acciones-btn">
            <button class="btn-manual" onclick="abrirEditorDia('${d.replace(/\//g, '-')}')">Editar</button>
            <button class="btn-mid" onclick="duplicarUnDia('${d.replace(/\//g, '-')}')">Duplicar</button>
            <button class="btn-del" onclick="confirmarEliminarDia('${d.replace(/\//g, '-')}')">Eliminar</button>
        </div>`;

        t.innerHTML += `<tr class="${trClass}">
            <td><strong>${d}</strong></td>
            <td>${r.entrada || "-"}</td>
            <td>${r.edesc || "-"}</td>
            <td>${r.sdesc || "-"}</td>
            <td>${r.salida || "-"}</td>
            <td>${horasSpan}</td>
            <td>${r.extras || 0}</td>
            <td>${acciones}</td>
        </tr>`;
    });

    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
}

/* ------------------ RECEIPT / EXPORT ------------------ */
function generarImagenRecibo() {
    Object.keys(registros).forEach(calcularHoras);

    let totalHoras = 0;
    let totalExtras = 0;
    const fechas = Object.keys(registros).sort((a, b) => parseDateDMY(a) - parseDateDMY(b));
    fechas.forEach(d => { totalHoras += registros[d].horas || 0; totalExtras += registros[d].extras || 0; });

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
    canvas.height = 1600 + fechas.length * 26;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("RECIBO DE SUELDO - CONTROL DE JORNADA", canvas.width / 2, 50);

    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Trabajador: ${localStorage.getItem(LS_NAME) || "Sin nombre"}`, 50, 100);
    ctx.fillText(`Periodo: ${fechas[0] || "?"} al ${fechas[fechas.length - 1] || "?"}`, 50, 130);
    ctx.fillText(`Fecha emisión: ${new Date().toLocaleDateString("es-UY")}`, 50, 160);
    ctx.fillText(`Sueldo nominal: $${salario.toLocaleString()}`, 50, 190);

    let y = 230;
    ctx.font = "bold 16px Arial";
    ctx.fillText("DETALLE DIARIO", 50, y);
    y += 26;
    ctx.font = "14px Arial";

    fechas.forEach(d => {
        const r = registros[d];
        const marquilla = esDialFestivo(d) ? " [FERIADO]" : "";
        ctx.fillText(`${d}${marquilla} → ${r.entrada || "-"} | ${r.edesc || "-"} → ${r.sdesc || "-"} | ${r.salida || "-"} → ${r.horas}h (+${r.extras}h extra)`, 60, y);
        y += 22;
    });

    y += 20;
    ctx.font = "bold 16px Arial";
    ctx.fillText("RESUMEN", 50, y);
    y += 26;
    ctx.font = "14px Arial";
    ctx.fillText(`Horas trabajadas: ${totalHoras.toFixed(2)} × $${valorHoraNormal.toFixed(2)} = $${pagoHorasNormales.toFixed(2)}`, 50, y); y += 22;
    ctx.fillText(`Horas extras: ${totalExtras.toFixed(2)} × $${valorHoraExtra.toFixed(2)} = $${pagoHorasExtras.toFixed(2)}`, 50, y); y += 26;
    ctx.fillText(`TOTAL BRUTO: $${totalBruto.toFixed(2)}`, 50, y); y += 24;
    ctx.fillText(`Descuento BPS (22%): -$${descuentoBPS.toFixed(2)}`, 50, y); y += 24;
    ctx.fillText(`Neto después BPS: $${netoDespuesBPS.toFixed(2)}`, 50, y); y += 24;
    ctx.fillText(`Adelanto: -$${adelanto.toFixed(2)}`, 50, y); y += 34;

    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#2e7d32";
    ctx.fillText(`LÍQUIDO A COBRAR: $${liquidoFinal.toFixed(2)}`, 50, y);

    const link = document.createElement("a");
    link.download = `recibo_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function exportarCSV() {
    const filas = [["dia", "entrada", "edesc", "sdesc", "salida", "horas", "extras"]];
    Object.keys(registros).sort((a, b) => parseDateDMY(a) - parseDateDMY(b)).forEach(d => {
        const r = registros[d];
        filas.push([d, r.entrada || "", r.edesc || "", r.sdesc || "", r.salida || "", r.horas || 0, r.extras || 0]);
    });
    const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `registros_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ------------------ AJUSTES / PASS ------------------ */
function pedirPassAjustes() {
    document.getElementById("inputPassAjustes").value = "";
    document.getElementById("passAjustesOverlay").classList.remove("hidden");
}

function cerrarPassAjustes() {
    document.getElementById("passAjustesOverlay").classList.add("hidden");
}

function verificarPassAjustes() {
    if (document.getElementById("inputPassAjustes").value === window.ADMIN_PASS) {
        cerrarPassAjustes();
        abrirAjustes();
    } else {
        alert("Contraseña incorrecta");
        document.getElementById("inputPassAjustes").value = "";
    }
}

function abrirAjustes() {
    document.getElementById("ajustesNombre").value = localStorage.getItem(LS_NAME) || "";
    document.getElementById("ajustesSalario").value = salario || 29267;
    document.getElementById("ajustesPass").value = "";
    document.getElementById("ajustesAutoDesc").value = autoDescansoMin || 0;
    document.getElementById("editarDiaFecha").value = "";
    document.getElementById("editorDiaBox").style.display = "none";
    document.getElementById("ajustesOverlay").classList.remove("hidden");
}

function cerrarAjustes() {
    document.getElementById("ajustesOverlay").classList.add("hidden");
    document.getElementById("editarDiaFecha").value = "";
    document.getElementById("editorDiaBox").style.display = "none";
}

function guardarAjustes() {
    const nombre = document.getElementById("ajustesNombre").value.trim();
    const sueldo = parseFloat(document.getElementById("ajustesSalario").value);
    const nuevaPass = document.getElementById("ajustesPass").value.trim();
    const autoMin = parseInt(document.getElementById("ajustesAutoDesc").value) || 0;

    if (!nombre || nombre.length < 2) return alert("Nombre inválido (mínimo 2 caracteres)");
    if (isNaN(sueldo) || sueldo < 10000) return alert("Sueldo mínimo $10.000");
    if (nuevaPass && nuevaPass.length < 4) return alert("Contraseña muy corta (mínimo 4 caracteres)");

    localStorage.setItem(LS_NAME, nombre);
    localStorage.setItem(LS_SALARIO, sueldo);

    if (nuevaPass) {
        localStorage.setItem(LS_PASS_ADMIN, nuevaPass);
        window.ADMIN_PASS = nuevaPass;
    }

    salario = sueldo;
    autoDescansoMin = autoMin;
    localStorage.setItem(LS_AUTO_DESC, autoDescansoMin);
    setUserName(nombre);
    cerrarAjustes();
    alert("Cambios guardados correctamente");
}

/* ------------------ ELIMINAR / RESTAURAR ------------------ */
function eliminarDiaEspecifico() {
    const f = document.getElementById("editarDiaFecha").value;
    if (!f) return alert("Elige fecha");
    const clave = formatKeyFromInputDate(f);
    if (!registros[clave]) return alert("No existe");
    if (!confirm(`¿Eliminar ${clave}?`)) return;
    actionStack.push({ op: "del", dia: clave, prev: JSON.stringify(registros[clave]) });
    delete registros[clave];
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Eliminado");
}

function confirmarEliminarDia(dHyph) {
    const clave = dHyph.replace(/-/g, '/');
    if (!confirm(`Eliminar ${clave}?`)) return;
    actionStack.push({ op: "del", dia: clave, prev: JSON.stringify(registros[clave]) });
    delete registros[clave];
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Eliminado");
}

function eliminarTodoConConfirm() {
    if (!confirm("¿BORRAR TODO PARA SIEMPRE?")) return;
    if (!confirm("¿SEGURO? NO HAY VUELTA ATRÁS")) return;
    backupGuardar();
    actionStack.push({ op: "clear", prev: JSON.stringify(registros) });
    registros = {}; estado = 0; adelanto = 0; adelantosHist = [];
    localStorage.removeItem(LS_REGISTROS);
    localStorage.removeItem(LS_ESTADO);
    localStorage.removeItem(LS_ADELANTO);
    localStorage.removeItem(LS_ADEL_HIST);
    actualizarTabla();
    alert("Todo eliminado");
}

function restaurarRespaldo() {
    const b = localStorage.getItem(LS_BACKUP);
    if (!b) return alert("Sin respaldo disponible");
    if (!confirm("Restaurar último respaldo (sobrescribirá datos actuales)?")) return;
    registros = JSON.parse(b);
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Respaldo restaurado");
}

/* ------------------ ADELANTOS ------------------ */
function guardarAdelantoTemp() {
    const val = parseFloat(document.getElementById("adelanto").value) || 0;
    adelanto = val;
}

function confirmarAdelanto() {
    adelanto = parseFloat(document.getElementById("adelanto").value) || 0;
    localStorage.setItem(LS_ADELANTO, adelanto);
    const item = { monto: adelanto, fecha: new Date().toISOString() };
    adelantosHist.push(item);
    localStorage.setItem(LS_ADEL_HIST, JSON.stringify(adelantosHist));
    alert("Adelanto confirmado");
}

function borrarAdelanto() {
    if (!confirm("¿Borrar adelanto actual?")) return;
    actionStack.push({ op: "adelDel", prev: adelanto });
    adelanto = 0;
    localStorage.removeItem(LS_ADELANTO);
    document.getElementById("adelanto").value = "";
    actualizarTabla();
    alert("Adelanto borrado");
}

function mostrarHistorialAdelantos() {
    const overlay = document.getElementById("histAdelantosOverlay");
    const list = document.getElementById("histAdelantosList");
    list.innerHTML = "";
    if (!adelantosHist || adelantosHist.length === 0) list.innerHTML = "<p class='muted'>Sin historial</p>";
    else {
        adelantosHist.slice().reverse().forEach((it, i) => {
            const fecha = new Date(it.fecha);
            const html = `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #eee;">
                <div><strong>$${it.monto}</strong><div class="small">${fecha.toLocaleString()}</div></div>
                <div><button class="btn-del" onclick='borrarAdelantoHist(${adelantosHist.length - 1 - i})'>Borrar</button></div>
            </div>`;
            list.innerHTML += html;
        });
    }
    overlay.classList.remove("hidden");
}

function cerrarHistorialAdelantos() {
    document.getElementById("histAdelantosOverlay").classList.add("hidden");
}

function borrarAdelantoHist(idx) {
    if (!confirm("Borrar este registro de adelanto?")) return;
    adelantosHist.splice(idx, 1);
    localStorage.setItem(LS_ADEL_HIST, JSON.stringify(adelantosHist));
    mostrarHistorialAdelantos();
}

/* ------------------ EDITOR DE DÍA (AJUSTES) ------------------ */
function cargarDiaParaEditar() {
    const f = document.getElementById("editarDiaFecha").value;
    if (!f) return alert("Elige fecha");
    const clave = formatKeyFromInputDate(f);
    const r = registros[clave];
    if (!r) return alert("Ese día no existe");
    document.getElementById("editorDiaBox").style.display = "block";
    document.getElementById("editEntrada").value = r.entrada || "";
    document.getElementById("editEDesc").value = r.edesc || "";
    document.getElementById("editSDesc").value = r.sdesc || "";
    document.getElementById("editSalida").value = r.salida || "";
    document.getElementById("moverAFecha").value = f;
}

function cancelarEdicionDia() {
    document.getElementById("editorDiaBox").style.display = "none";
}

function guardarEdicionDia() {
    const f = document.getElementById("editarDiaFecha").value;
    if (!f) return alert("Elige fecha");
    const clave = formatKeyFromInputDate(f);
    if (!registros[clave]) return alert("No existe");
    const prev = JSON.stringify(registros[clave]);
    const ent = document.getElementById("editEntrada").value || "";
    const ed = document.getElementById("editEDesc").value || "";
    const sd = document.getElementById("editSDesc").value || "";
    const sal = document.getElementById("editSalida").value || "";
    const mover = document.getElementById("moverAFecha").value;
    registros[clave].entrada = ent;
    registros[clave].edesc = ed;
    registros[clave].sdesc = sd;
    registros[clave].salida = sal;
    calcularHoras(clave);
    if (mover && mover !== f) {
        const newKey = formatKeyFromInputDate(mover);
        registros[newKey] = registros[clave];
        delete registros[clave];
        actionStack.push({ op: "move", from: clave, to: newKey, prev: prev });
    } else {
        actionStack.push({ op: "edit", dia: clave, prev: prev });
    }
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    cancelarEdicionDia();
    alert("Guardado");
}

/* ------------------ OTRAS UTILIDADES ------------------ */
function abrirEditorDia(dHyph) {
    document.getElementById("passAjustesOverlay").classList.remove("hidden");
    setTimeout(() => {
        document.getElementById("inputPassAjustes").value = "";
        document._pendingEditDay = dHyph.replace(/-/g, '/');
    }, 10);
}

function verificarPassAjustesEditar() {
    if (document.getElementById("inputPassAjustes").value === window.ADMIN_PASS) {
        const pending = document._pendingEditDay || "";
        document.getElementById("passAjustesOverlay").classList.add("hidden");
        abrirAjustes();
        if (pending) {
            const [d, m, y] = pending.split("/");
            document.getElementById("editarDiaFecha").value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cargarDiaParaEditar();
            document._pendingEditDay = null;
        }
    } else alert("Contraseña incorrecta");
}

/* ------------------ DUPLICAR / DESHACER ------------------ */
function duplicarDiaAnterior() {
    const fechas = Object.keys(registros).sort((a, b) => parseDateDMY(a) - parseDateDMY(b));
    if (fechas.length === 0) return alert("Sin días previos para duplicar");
    const ultima = fechas[fechas.length - 1];
    const hoy = hoyFormato();
    registros[hoy] = JSON.parse(JSON.stringify(registros[ultima]));
    actionStack.push({ op: "dup", from: ultima, to: hoy });
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Duplicado al día de hoy");
}

function duplicarUnDia(dHyph) {
    const clave = dHyph.replace(/-/g, '/');
    const fechaNueva = prompt("Fecha para duplicar (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!fechaNueva) return;
    const newKey = formatKeyFromInputDate(fechaNueva);
    registros[newKey] = JSON.parse(JSON.stringify(registros[clave]));
    actionStack.push({ op: "dup", from: clave, to: newKey });
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Duplicado");
}

function undoUltimaAccion() {
    if (actionStack.length === 0) return alert("Nada para deshacer");
    const last = actionStack.pop();
    if (last.op === "add") {
        if (registros[last.dia]) registros[last.dia][last.tipo] = "";
    } else if (last.op === "del") {
        registros[last.dia] = JSON.parse(last.prev);
    } else if (last.op === "clear") {
        registros = JSON.parse(last.prev);
    } else if (last.op === "edit") {
        registros[last.dia] = JSON.parse(last.prev);
    } else if (last.op === "move") {
        registros[last.from] = JSON.parse(last.prev);
        delete registros[last.to];
    } else if (last.op === "dup") {
        delete registros[last.to];
    } else if (last.op === "adelDel") {
        adelanto = last.prev;
        localStorage.setItem(LS_ADELANTO, adelanto);
        document.getElementById("adelanto").value = adelanto;
    }
    localStorage.setItem(LS_REGISTROS, JSON.stringify(registros));
    actualizarTabla();
    alert("Deshecho");
}

/* ------------------ BACKUP ------------------ */
function backupGuardar() {
    try {
        localStorage.setItem(LS_BACKUP, JSON.stringify(registros));
    } catch (e) { }
}

/* ------------------ MODO / AUTO-DESCANSO ------------------ */
function toggleModoSimple() {
    modoSimple = document.getElementById("toggleModoSimple").checked;
    localStorage.setItem(LS_MODO_SIMPLE, JSON.stringify(modoSimple));
    actualizarTabla();
}

function guardarAjustesRapidos() {
    const v = parseInt(document.getElementById("autoDescansoMin").value) || 0;
    autoDescansoMin = v;
    localStorage.setItem(LS_AUTO_DESC, autoDescansoMin);
}

/* ------------------ BACK COMPAT / ONBOARDING ------------------ */
function setupModalFlow() {
    if (localStorage.getItem(LS_NAME)) {
        showApp();
    } else {
        document.getElementById("initialOverlay").style.display = "flex";
    }
}

function acceptAndContinue() {
    const n = document.getElementById("inputNombre").value.trim();
    if (n.length < 2 || !document.getElementById("chkAcepto").checked) return alert("Faltan datos");
    localStorage.setItem(LS_NAME, n);
    setUserName(n);
    document.getElementById("initialOverlay").style.display = "none";
    showApp();
}

function showApp() {
    document.getElementById("appContent").style.display = "block";
}

/* ------------------ LEGAL PANEL ------------------ */
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

/* ------------------ UI HELPERS ------------------ */
function toggleManual() {
    const b = document.getElementById("manualBox");
    b.style.display = b.style.display === "none" || b.style.display === "" ? "block" : "none";
}

function confirmarAdelantoInput() {
    confirmarAdelanto();
}
