import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, doc, setDoc, getDoc, 
  updateDoc, collection, addDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeUkKN-HoCsBZ75Hix4sO2_AUtCGrGtx0",
  authDomain: "control-gastos-f7bc2.firebaseapp.com",
  projectId: "control-gastos-f7bc2",
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioActual = null;
let balance = 0;
let tipoActual = "";

// REGISTRO
window.registrar = async function(){
  const nombre = document.getElementById("nombreRegistro").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const balanceInicial = parseFloat(document.getElementById("balanceInicial").value);

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "usuarios", user.uid), {
    nombre: nombre,
    balance: balanceInicial
  });

  alert("Usuario registrado");
}

// LOGIN
window.login = async function(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, password);
}

// DETECTAR SESION ACTIVA
onAuthStateChanged(auth, async (user) => {
  if(user){
    usuarioActual = user;
    document.getElementById("auth").style.display="none";
    document.getElementById("app").style.display="block";

    const docSnap = await getDoc(doc(db, "usuarios", user.uid));
    const datos = docSnap.data();

    balance = datos.balance;
    document.getElementById("bienvenida").innerText = "Bienvenido " + datos.nombre;
    document.getElementById("balance").innerText = "Balance: $" + balance;
  }
});

// CERRAR SESION
window.logout = function(){
  signOut(auth);
  location.reload();
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
    alert("Fondos insuficientes");
    return;
  }

  if(tipoActual === "Deposito"){
    balance += monto;
  } else {
    balance -= monto;
  }

  await updateDoc(doc(db, "usuarios", usuarioActual.uid), {
    balance: balance
  });

  await addDoc(collection(db, "usuarios", usuarioActual.uid, "transacciones"), {
    tipo: tipoActual,
    fecha: fecha,
    concepto: concepto,
    monto: monto
  });

  document.getElementById("balance").innerText = "Balance: $" + balance;
  alert("Transacción guardada");
}

window.verHistorial = async function(){
  const querySnapshot = await getDocs(collection(db, "usuarios", usuarioActual.uid, "transacciones"));
  let html = "<h3>Historial</h3>";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    html += `<p>${data.fecha} - ${data.tipo} - ${data.concepto} - $${data.monto}</p>`;
  });

  document.getElementById("historial").innerHTML = html;
}
