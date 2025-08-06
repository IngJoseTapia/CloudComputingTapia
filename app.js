const firebaseConfig = {
  apiKey: "AIzaSyC8bFyF-AxIWA-xDng4zvEB61lCR6h_xPA",
  authDomain: "protcja.firebaseapp.com",
  projectId: "protcja",
  storageBucket: "protcja.firebasestorage.app",
  messagingSenderId: "804525883948",
  appId: "1:804525883948:web:d4785636c0be4b12108789",
  measurementId: "G-9VMVHXC4PZ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Usuario registrado"))
    .catch(e => alert(e.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Bienvenido"))
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("reserva-section").style.display = "block";
    document.getElementById("user-info").innerText = `Usuario: ${user.email}`;
    mostrarReservas(user.uid);
  } else {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("reserva-section").style.display = "none";
  }
});

function reservar() {
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const lab = document.getElementById("laboratorio").value;
  const user = auth.currentUser;

  if (user) {
    db.collection("reservas").add({
      uid: user.uid,
      email: user.email,
      fecha,
      hora,
      laboratorio: lab
    }).then(() => {
      alert("Reservación registrada");
      mostrarReservas(user.uid);
    });
  }
}

function mostrarReservas(uid) {
  db.collection("reservas").where("uid", "==", uid).get().then(snapshot => {
    const lista = document.getElementById("lista-reservas");
    lista.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerText = `${data.fecha} - ${data.hora} - ${data.laboratorio}`;
      lista.appendChild(li);
    });
  });
}