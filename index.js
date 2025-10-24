const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");
const cors = require("cors");

// 🔹 Inicializar Firebase Admin
let serviceAccount;

if (process.env.FIREBASE_KEY) {
  // Para Render: reemplaza los \n por saltos de línea reales
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
} else {
  // Para local: usa el archivo físico
  serviceAccount = require("./firebase_key.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Ruta principal: mostrar productos
app.get("/productos", async (req, res) => {
  try {
    const items = await db.collection("productos").get();

    const productos = items.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        costo: parseFloat(data.costo) || 0,
        imagen: data.imagen || "https://via.placeholder.com/150"
      };
    });

    res.render("inicio", {
      titulo: "Página de inicio",
      mensaje: "Bienvenido a nuestra tienda",
      productos
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Formulario para agregar producto
app.get("/productos/add", (req, res) => {
  res.render("form", {
    producto: null,
    nombre: "Crear producto"
  });
});

// 🔹 Guardar producto
app.post("/productos/add", async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen } = req.body;

    if (!nombre || !precio) {
      return res.status(400).send("Nombre y precio son obligatorios");
    }

    await db.collection("productos").add({
      nombre,
      descripcion: descripcion || "",
      costo: parseFloat(precio),
      imagen: imagen || "https://via.placeholder.com/150"
    });

    res.redirect("/productos");
  } catch (error) {
    console.error("Error al guardar producto:", error);
    res.status(500).send("Error al guardar producto");
  }
});

// 🔹 Redirección raíz → /productos
app.get("/", (req, res) => res.redirect("/productos"));

// 🔹 Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
