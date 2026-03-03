import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeUkKN-HoCsBZ75Hix4sO2_AUtCGrGtx0",
  authDomain: "control-gastos-f7bc2.firebaseapp.com",
  projectId: "control-gastos-f7bc2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let balance = 0;
let tipoActual = "";

window.guardarUsuario = function(){
  const nombre = document.getElementById("nombre").value;
  balance = parseFloat(document.getElementById("balanceInicial").value);

  document.getElementById("bienvenida").innerText = "Bienvenido " + nombre;
  document.getElementById("balance").innerText = "Balance: $" + balance;

  document.getElementById("registro").style.display="none";
  document.getElementById("menu").style.display="block";
}

window.mostrarFormulario = function(tipo){
  tipoActual = tipo;
  document.getElementById("formulario").style.display="block";
}

window.guardarTransaccion = async function(){
  const fecha = document.getElementById("fecha").value;
  const concepto = document.getElementById("concepto").value;
  const monto = parseFloat(document.getElementById("monto").value);

  if(tipoActual !== "Deposito" && monto > balance){
    alert("No tienes suficiente balance");
    return;
  }

  if(tipoActual === "Deposito"){
    balance += monto;
  } else {
    balance -= monto;
  }

  document.getElementById("balance").innerText = "Balance: $" + balance;

  await addDoc(collection(db, "transacciones"), {
    tipo: tipoActual,
    fecha: fecha,
    concepto: concepto,
    monto: monto
  });

  alert("Transacción guardada");
}

window.verHistorial = async function(){
  const querySnapshot = await getDocs(collection(db, "transacciones"));
  let html = "<h3>Historial</h3>";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    html += `<p>${data.fecha} - ${data.tipo} - ${data.concepto} - $${data.monto}</p>`;
  });

  document.getElementById("historial").innerHTML = html;

}
