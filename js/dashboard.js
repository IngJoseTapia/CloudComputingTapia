const SUPABASE_URL = "https://ahtgshcjkcpwxwlivpkx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodGdzaGNqa2Nwd3h3bGl2cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDY1MzksImV4cCI6MjA3MDA4MjUzOX0.iyXYz7aWkwd7qNXImHaT5r-OCO6tZwJSFuBhn6ZJNy4";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const clase = document.getElementById("clase").value;

  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client.from("estudiantes").insert({
    nombre,
    correo,
    clase,
    user_id: user.id,
  });

  if (error) {
    alert("Error al agregar: " + error.message);
  } else {
    alert("Estudiante agregado");
    cargarEstudiantes();
  }
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("id, nombre, correo, clase")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.classList.add("estudiante-item");

    item.innerHTML = `
      <div class="estudiante-info">
        <strong>${est.nombre}</strong><br>
        <small>${est.clase || "Sin clase asignada"}</small>
      </div>
      <div class="estudiante-acciones">
        <button class="btn btn-primario" onclick="editarEstudiante('${est.id}', '${est.nombre}', '${est.correo}', '${est.clase}')">✏️ Editar</button>
        <button class="btn btn-peligro" onclick="eliminarEstudiante('${est.id}')">🗑️ Eliminar</button>
      </div>
    `;

    lista.appendChild(item);
  });
}

cargarEstudiantes();

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`;
  const { error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, { cacheControl: "3600", upsert: false });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos();
  }
}

async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data, error } = await client.storage.from("tareas").list(`${user.id}`, { limit: 20 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  data.forEach(async (archivo) => {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60);

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      return;
    }

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  });
}

listarArchivos();

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que deseas eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("Estudiante eliminado correctamente");
    cargarEstudiantes();
  }
}

async function editarEstudiante(id, nombreActual, correoActual, claseActual) {
  const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
  const nuevoCorreo = prompt("Nuevo correo:", correoActual);
  const nuevaClase = prompt("Nueva clase:", claseActual);

  if (!nuevoNombre || !nuevoCorreo || !nuevaClase) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const { error } = await client
    .from("estudiantes")
    .update({
      nombre: nuevoNombre,
      correo: nuevoCorreo,
      clase: nuevaClase
    })
    .eq("id", id);

  if (error) {
    alert("Error al actualizar: " + error.message);
  } else {
    alert("Estudiante actualizado correctamente");
    cargarEstudiantes();
  }
}
