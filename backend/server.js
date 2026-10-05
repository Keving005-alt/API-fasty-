require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto"); // CAMBIO: módulo nativo de Node para hashear contraseñas (no necesita npm install)
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NUEVO: permite que el frontend (localhost:5173) llame al backend (localhost:3000)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Conexión a Neon PostgreSQL usando la URL del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido para conexiones a Neon desde Node.js
  },
});

// ---------------------------------------------------------------
// CAMBIO: funciones para NO guardar la contraseña en texto plano
// Se guarda como "salt:hash" dentro de la misma columna password
// ---------------------------------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex"); // CAMBIO: sal aleatoria única por usuario
  const hash = crypto.scryptSync(password, salt, 64).toString("hex"); // CAMBIO: hash con scrypt
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  // CAMBIO: compatibilidad con usuarios viejos que quedaron en texto plano
  if (!stored.includes(":")) return password === stored;

  const [salt, hash] = stored.split(":");
  const attempt = crypto.scryptSync(password, salt, 64);
  // CAMBIO: comparación segura contra ataques de tiempo
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

// 1. RUTA PRINCIPAL (sin cambios): sirve el menú principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 2. RUTA REGISTRO
// CAMBIO: ahora responde JSON en vez de redirigir, para que el modal muestre
// el resultado sin salir del menú principal
app.post("/registro", async (req, res) => {
  const usuario = (req.body.usuario || "").trim(); // CAMBIO: trim para quitar espacios
  const password = req.body.password || "";

  // CAMBIO: validación básica en el servidor
  if (usuario.length < 3) {
    return res.status(400).json({
      ok: false,
      error: "El usuario debe tener al menos 3 caracteres.",
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    await pool.query(
      "INSERT INTO usuarios (usuario, password) VALUES ($1, $2)",
      [usuario, hashPassword(password)], // CAMBIO: se guarda el hash, no la contraseña
    );

    // CAMBIO: respuesta JSON; el registro deja al usuario con la sesión iniciada
    res.status(201).json({ ok: true, usuario });
  } catch (err) {
    console.error("🔴 ERROR EN NEON POSTGRESQL:", err);

    // CAMBIO: 23505 = violación de UNIQUE en PostgreSQL (usuario repetido)
    if (err.code === "23505") {
      return res.status(409).json({
        ok: false,
        error: "Ese usuario ya existe. Elige otro nombre.",
      });
    }
    // CAMBIO: error en JSON en lugar de HTML
    res.status(500).json({
      ok: false,
      error: "No pudimos registrar tu cuenta. Intenta de nuevo.",
    });
  }
});

// 3. RUTA LOGIN
// CAMBIO: también responde JSON para el modal
app.post("/login", async (req, res) => {
  const usuario = (req.body.usuario || "").trim(); // CAMBIO: trim
  const password = req.body.password || "";

  try {
    // CAMBIO: se busca solo por usuario; la contraseña se verifica en Node con el hash
    const result = await pool.query(
      "SELECT usuario, password FROM usuarios WHERE usuario = $1",
      [usuario],
    );

    const fila = result.rows[0];

    if (fila && verifyPassword(password, fila.password)) {
      // CAMBIO: si la cuenta era antigua (texto plano), se actualiza a hash automáticamente
      if (!fila.password.includes(":")) {
        await pool.query(
          "UPDATE usuarios SET password = $1 WHERE usuario = $2",
          [hashPassword(password), usuario],
        );
      }
      res.json({ ok: true, usuario: fila.usuario }); // CAMBIO: JSON en vez de redirect
    } else {
      // CAMBIO: mismo mensaje exista o no el usuario (no revela cuál falló)
      res
        .status(401)
        .json({ ok: false, error: "Usuario o contraseña incorrectos." });
    }
  } catch (err) {
    console.error("🔴 ERROR EN LOGIN:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." }); // CAMBIO: JSON
  }
});

// NUEVO: endpoint que le indica al frontend a qué URL debe ir
app.get("/api/ir-citas", (req, res) => {
  res.json({ ok: true, url: "/citas" });
});

// 4. RUTA PÁGINA PRINCIPAL (sin cambios)
// Nota: el frontend ya no redirige aquí; el menú principal muestra el saludo.
// Se deja por si la quieres usar más adelante como panel privado.
app.get("/principal", (req, res) => {
  const usuario = req.query.usuario || "Usuario";
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Página Principal</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1>🎉 ¡Bienvenido a la Página Principal, ${usuario}!</h1>
        <p>Has accedido correctamente estando autenticado en la base de datos FASTYAPI en la nube.</p>
        <br/>
        <a href="/">Cerrar Sesión</a>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
