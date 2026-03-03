// ===============================
// IMPORTACIONES FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ===============================
// CONFIGURACIÓN FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// VARIABLES GLOBALES
// ===============================
let usuarioActual = null;
let balance = 0;
let tipoActual = "";

// ===============================
// REGISTRO
// ===============================
window.registrar = async function(){

  try {
    const nombre = document.getElementById("nombreRegistro").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const balanceInicial = parseFloat(document.getElementById("balanceInicial").value);

    if(!nombre || !email || !password || isNaN(balanceInicial)){
      alert("Completa todos los campos");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: nombre,
      balance: balanceInicial
    });

    alert("Registro exitoso");
    window.location.href = "dashboard.html";

  } catch(error){
    alert("Error: " + error.message);
  }
};


// ===============================
// LOGIN
// ===============================
window.login = async function(){

  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "dashboard.html";

  } catch(error){
    alert("Error: " + error.message);
  }
};


// ===============================
// CERRAR SESIÓN
// ===============================
window.logout = async function(){
  await signOut(auth);
  window.location.href = "login.html";
};


// ===============================
// PROTEGER DASHBOARD
// ===============================
onAuthStateChanged(auth, async (user) => {

  if(user){
    usuarioActual = user;

    // Si estamos en dashboard
    if(window.location.pathname.includes("dashboard")){

      const docSnap = await getDoc(doc(db, "usuarios", user.uid));

      if(docSnap.exists()){
        const datos = docSnap.data();
        balance = datos.balance;

        document.getElementById("bienvenida").innerText = "Bienvenido " + datos.nombre;
        document.getElementById("balance").innerText = "Balance: $" + balance;
      }
    }

  } else {
    // Si NO hay sesión y estamos en dashboard
    if(window.location.pathname.includes("dashboard")){
      window.location.href = "login.html";
    }
  }

});


// ===============================
// MOSTRAR FORMULARIO
// ===============================
window.mostrarFormulario = function(tipo){
  tipoActual = tipo;
  document.getElementById("formulario").style.display = "block";
};


// ===============================
// GUARDAR TRANSACCIÓN
// ===============================
window.guardarTransaccion = async function(){

  try {

    const fecha = document.getElementById("fecha").value;
    const concepto = document.getElementById("concepto").value;
    const monto = parseFloat(document.getElementById("monto").value);

    if(!fecha || !concepto || isNaN(monto)){
      alert("Completa todos los campos");
      return;
    }

    // Validar fondos
    if(tipoActual !== "Deposito" && monto > balance){
      alert("Fondos insuficientes");
      return;
    }

    // Actualizar balance
    if(tipoActual === "Deposito"){
      balance += monto;
    } else {
      balance -= monto;
    }

    // Actualizar en Firestore
    await updateDoc(doc(db, "usuarios", usuarioActual.uid), {
      balance: balance
    });

    // Guardar transacción
    await addDoc(collection(db, "usuarios", usuarioActual.uid, "transacciones"), {
      tipo: tipoActual,
      fecha: fecha,
      concepto: concepto,
      monto: monto
    });

    document.getElementById("balance").innerText = "Balance: $" + balance;

    alert("Transacción guardada");

    // Limpiar campos
    document.getElementById("fecha").value = "";
    document.getElementById("concepto").value = "";
    document.getElementById("monto").value = "";

  } catch(error){
    alert("Error: " + error.message);
  }

};


// ===============================
// VER HISTORIAL
// ===============================
window.verHistorial = async function(){

  const querySnapshot = await getDocs(collection(db, "usuarios", usuarioActual.uid, "transacciones"));

  let html = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    html += `
      <div class="transaccion">
        ${data.fecha} | ${data.tipo} | ${data.concepto} | $${data.monto}
      </div>
    `;
  });

  document.getElementById("historial").innerHTML = html;

};
