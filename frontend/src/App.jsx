import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import logo from "./assets/logo-fasty.png";

/* ------------------------------------------------------------------ */
/* CONFIGURACIÓN — cambia estos valores cuando los tengas listos       */
/* ------------------------------------------------------------------ */
// URL a la que lleva el botón "Agenda en línea".
// Mientras esté vacía, usa el flujo anterior (backend -> /citas).
const AGENDA_URL = "";

// Número de WhatsApp con código de país, sin + ni espacios (Colombia = 57)
const WHATSAPP = "573000000000";
const INSTAGRAM = "https://instagram.com/";
const FACEBOOK = "https://facebook.com/";

/* CAMBIO (sesión): configuración del inicio de sesión.
   ⚠️ Ajusta estas rutas a las que tenga tu server.js.
   Se espera JSON: { ok: true, usuario: { nombre, usuario } } o { ok: false, mensaje }.
   El backend es quien guarda usuarios y sesiones en PostgreSQL. */
const API = "http://localhost:3000";
const AUTH = {
  login: "/api/auth/login", // POST { usuario, password }
  registro: "/api/auth/registro", // POST { nombre, usuario, password }
  logout: "/api/auth/logout", // POST
  sesion: "/api/auth/me", // GET -> devuelve el usuario si hay sesión activa
};
/* CAMBIO (sesión): URL del perfil. TODAVÍA NO EXISTE.
   Cuando la crees, agrega su <Route> dentro de function App (abajo). */
const RUTA_PERFIL = "/perfil";
/* CAMBIO (sesión): imagen del ícono de usuario. Va en la carpeta /public
   (public/icono-usuario.png), igual que /hero-bg.jpg */
const ICONO_USUARIO = "/icono-usuario.png";

const SERVICIOS = [
  {
    nombre: "Corte de Cabello",
    detalle: "Corte clásico o moderno a tu medida.",
  },
  {
    nombre: "Corte de Cabello y Barba",
    detalle: "Corte completo más perfilado y arreglo de barba.",
  },
  {
    nombre: "Corte de Cabello con Tijeras",
    detalle: "Trabajo a tijera para un acabado más natural.",
  },
  {
    nombre: "Corte para Niños",
    detalle: "Corte cuidadoso para los más pequeños.",
  },
  {
    nombre: "Rapada o Afeitada de Cabeza y Barba",
    detalle: "Afeitado limpio con toalla caliente.",
  },
];

/* ------------------------------------------------------------------ */
/* Pantalla de carga                                                   */
/* ------------------------------------------------------------------ */
function Carga({ visible }) {
  return (
    <div
      className={`carga ${visible ? "" : "carga--oculta"}`}
      aria-hidden={!visible}
    >
      <img src={logo} alt="Fasty Barbershop" className="carga__logo" />
      <p className="carga__texto">Cargando</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Íconos simples                                                      */
/* CAMBIO (sesión): IconoInstagram e IconoFacebook ya no se muestran   */
/* en el nav (los reemplazó el botón "Iniciar sesión"); se conservan   */
/* aquí por si los quieres usar en otro lado.                          */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line no-unused-vars
const IconoInstagram = () => (
  <svg
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// eslint-disable-next-line no-unused-vars
const IconoFacebook = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3c-3 0-4.5 1.8-4.5 4.4V8H7v3.5h2.5V22H14V11.5h2.8L17.3 8H14z" />
  </svg>
);

const IconoWhatsapp = () => (
  <svg
    viewBox="0 0 32 32"
    width="34"
    height="34"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 3.5A12.5 12.5 0 0 0 5.2 22.3L3.5 28.5l6.400-1.700A12.500 12.500 0 1 0 16 3.500z" />
    <path
      d="M12 10.500c-.5 1.200-.2 2.800 1.300 4.700 1.600 2 3.400 3.100 5.200 3.400.9.100 2-.6 2.200-1.400l-2.200-1.200-1.100.9c-1.300-.6-2.400-1.700-3-3l.9-1.100-1.100-2.300z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* CAMBIO (sesión): llamada al backend (envía/recibe la cookie de      */
/* sesión). Requiere en el backend:                                    */
/* cors({ origin: "http://localhost:5174", credentials: true })        */
/* ------------------------------------------------------------------ */
async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data.ok === false) {
    throw new Error(data.mensaje || data.message || "No se pudo completar.");
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* CAMBIO (sesión): ventana de iniciar sesión / crear cuenta           */
/* ------------------------------------------------------------------ */
function ModalSesion({ onCerrar, onExito }) {
  const [modo, setModo] = useState("ingresar"); // "ingresar" | "crear"
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      // Si es registro, primero se crea la cuenta en la BD
      if (modo === "crear") {
        await peticion(AUTH.registro, {
          method: "POST",
          body: JSON.stringify({ nombre, usuario, password }),
        });
      }
      // Luego se inicia sesión (el backend guarda la sesión en PostgreSQL)
      const data = await peticion(AUTH.login, {
        method: "POST",
        body: JSON.stringify({ usuario, password }),
      });
      onExito(data.usuario ?? data.user ?? { usuario });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="modal"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="modal__caja" role="dialog" aria-modal="true">
        <button
          className="modal__cerrar"
          onClick={onCerrar}
          aria-label="Cerrar ventana"
        >
          ×
        </button>

        <h2 className="modal__titulo">
          {modo === "ingresar" ? "Ingresar a mi cuenta" : "Crear mi cuenta"}
        </h2>

        <div className="modal__pestanas">
          <button
            className={modo === "ingresar" ? "activa" : ""}
            onClick={() => {
              setModo("ingresar");
              setError("");
            }}
          >
            Ingresar
          </button>
          <button
            className={modo === "crear" ? "activa" : ""}
            onClick={() => {
              setModo("crear");
              setError("");
            }}
          >
            Crear cuenta
          </button>
        </div>

        <form className="modal__form" onSubmit={enviar}>
          {modo === "crear" && (
            <label>
              Nombre
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Usuario
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Contraseña
            <span className="modal__campo-pass">
              <input
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  modo === "ingresar" ? "current-password" : "new-password"
                }
                required
              />
              <button type="button" onClick={() => setVerPassword((v) => !v)}>
                {verPassword ? "Ocultar" : "Mostrar"}
              </button>
            </span>
          </label>

          {error && (
            <p className="modal__error" role="alert">
              {error}
            </p>
          )}

          <button className="boton-oro" type="submit" disabled={enviando}>
            {enviando
              ? "Un momento..."
              : modo === "ingresar"
                ? "Ingresar"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (sesión): ícono + nombre del usuario con menú desplegable    */
/* ------------------------------------------------------------------ */
function MenuUsuario({ usuario, onPerfil, onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  // Cierra el menú al hacer clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (!contenedor.current?.contains(e.target)) setAbierto(false);
    };
    const escape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div className="usuario" ref={contenedor}>
      <button
        className="usuario__boton"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <img src={ICONO_USUARIO} alt="" className="usuario__icono" />
        <span className="usuario__nombre">
          {usuario.nombre || usuario.usuario || "Mi cuenta"}
        </span>
      </button>

      {abierto && (
        <div className="usuario__menu">
          <button
            onClick={() => {
              setAbierto(false);
              onPerfil();
            }}
          >
            Ver perfil
          </button>
          <button
            onClick={() => {
              setAbierto(false);
              onSalir();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página de inicio                                                    */
/* ------------------------------------------------------------------ */
function Inicio() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [servicioAbierto, setServicioAbierto] = useState(null);
  // CAMBIO (sesión): usuario logueado (null = nadie) y ventana de login
  const [usuario, setUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // La pantalla de carga se muestra mínimo 2.4 s y espera a que cargue la página
  useEffect(() => {
    const minimo = new Promise((r) => setTimeout(r, 2400));
    const listo = new Promise((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
    });
    Promise.all([minimo, listo]).then(() => setCargando(false));
  }, []);

  // Bloquea el scroll mientras carga
  // CAMBIO (sesión): también mientras la ventana de login está abierta
  useEffect(() => {
    document.body.style.overflow = cargando || modalAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cargando, modalAbierto]);

  // CAMBIO (sesión): al abrir la página, pregunta al backend si ya hay sesión
  useEffect(() => {
    peticion(AUTH.sesion)
      .then((data) => setUsuario(data.usuario ?? data.user ?? null))
      .catch(() => setUsuario(null));
  }, []);

  // CAMBIO (sesión): login correcto -> guarda el usuario y cierra la ventana
  const alIniciarSesion = (u) => {
    setUsuario(u);
    setModalAbierto(false);
  };

  // CAMBIO (sesión): cerrar sesión (el backend la elimina de la BD)
  const cerrarSesion = async () => {
    try {
      await peticion(AUTH.logout, { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUsuario(null);
      setMenuAbierto(false);
    }
  };

  // CAMBIO (sesión): "Ver perfil" lleva a RUTA_PERFIL (aún no creada)
  const verPerfil = () => {
    setMenuAbierto(false);
    navigate(RUTA_PERFIL);
  };

  // Botón "Agenda en línea"
  const irAAgenda = async () => {
    setMenuAbierto(false);

    // Cuando tengas la URL final, solo llena AGENDA_URL arriba
    if (AGENDA_URL) {
      window.location.href = AGENDA_URL;
      return;
    }

    // Mientras tanto: el backend decide la ruta (flujo que ya tenías)
    try {
      const respuesta = await fetch("http://localhost:3000/api/ir-citas");
      const data = await respuesta.json();
      if (data.ok) navigate(data.url);
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
    }
  };

  return (
    <>
      <Carga visible={cargando} />

      {/* CAMBIO (sesión): ventana de login/registro sobre la misma URL */}
      {modalAbierto && (
        <ModalSesion
          onCerrar={() => setModalAbierto(false)}
          onExito={alIniciarSesion}
        />
      )}

      {/* ---------- Barra de navegación ---------- */}
      <header className="nav">
        <div className="nav__interior">
          <a
            href="#inicio"
            className="nav__logo"
            aria-label="Fasty Barbershop, inicio"
          >
            <img src={logo} alt="" />
          </a>

          <button
            className="nav__hamburguesa"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-label="Abrir menú"
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            className={`nav__links ${menuAbierto ? "nav__links--abierto" : ""}`}
          >
            <a href="#inicio" onClick={() => setMenuAbierto(false)}>
              Inicio
            </a>
            <a href="#barberia" onClick={() => setMenuAbierto(false)}>
              La Barbería
            </a>
            <a href="#servicios" onClick={() => setMenuAbierto(false)}>
              Servicios
            </a>
            <button className="nav__enlace-boton" onClick={irAAgenda}>
              Agenda en Línea
            </button>
            <a href="#contacto" onClick={() => setMenuAbierto(false)}>
              Contacto
            </a>

            {/* CAMBIO (sesión): aquí estaban los íconos de Instagram y Facebook.
                Sin sesión -> botón "Iniciar sesión".
                Con sesión -> ícono + nombre con menú (Ver perfil / Cerrar sesión). */}
            {usuario ? (
              <MenuUsuario
                usuario={usuario}
                onPerfil={verPerfil}
                onSalir={cerrarSesion}
              />
            ) : (
              <button
                className="nav__sesion"
                onClick={() => {
                  setMenuAbierto(false);
                  setModalAbierto(true);
                }}
              >
                Iniciar sesión
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section id="inicio" className="hero">
          <div className="hero__contenido">
            <div className="hero__superior">
              <span className="hero__linea" />
              <span>BARBERSHOP</span>
              <span className="hero__linea" />
            </div>

            <h1 className="hero__titulo">
              <span className="hero__rombo" aria-hidden="true" />
              Fasty
              <span className="hero__rombo" aria-hidden="true" />
            </h1>

            <p className="hero__lema">
              Estilo y perfección en cada corte y afeitado
            </p>

            <a href="#barberia" className="hero__flecha" aria-label="Bajar">
              <svg
                viewBox="0 0 40 20"
                width="44"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 3l18 14L38 3" />
              </svg>
            </a>

            <button className="boton-oro" onClick={irAAgenda}>
              Agenda en línea
            </button>
          </div>
        </section>

        {/* ---------- La Barbería ---------- */}
        <section id="barberia" className="seccion">
          <h2 className="seccion__titulo">La Barbería</h2>
          <p className="seccion__texto">
            Escribe aquí la historia de Fasty Barbershop: quiénes son, cuánto
            tiempo llevan cortando y qué los hace diferentes.
          </p>
        </section>

        {/* ---------- Servicios ---------- */}
        <section id="servicios" className="seccion seccion--clara">
          <h2 className="seccion__titulo seccion__titulo--oscuro">Servicios</h2>

          <div className="servicios">
            <button className="boton-oro servicios__agenda" onClick={irAAgenda}>
              Agenda en línea
            </button>

            {SERVICIOS.map((s, i) => {
              const abierto = servicioAbierto === i;
              return (
                <div key={s.nombre} className="servicio">
                  <button
                    className="servicio__cabecera"
                    onClick={() => setServicioAbierto(abierto ? null : i)}
                    aria-expanded={abierto}
                  >
                    <span>{s.nombre}</span>
                    <svg
                      className={`servicio__flecha ${abierto ? "servicio__flecha--abierta" : ""}`}
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 8l8 8 8-8" />
                    </svg>
                  </button>
                  <div
                    className={`servicio__cuerpo ${abierto ? "servicio__cuerpo--abierto" : ""}`}
                  >
                    <p>{s.detalle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- Contacto ---------- */}
        <section id="contacto" className="seccion">
          <h2 className="seccion__titulo">Contacto</h2>
          <p className="seccion__texto">
            Dirección, horarios y teléfono de la barbería.
          </p>
        </section>
      </main>

      <footer className="pie">
        © {new Date().getFullYear()} Fasty Barbershop
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        className="whatsapp"
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <IconoWhatsapp />
      </a>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Página de citas (temporal)                                          */
/* ------------------------------------------------------------------ */
function Citas() {
  const navigate = useNavigate();

  return (
    <div className="citas">
      <img src={logo} alt="Fasty Barbershop" className="citas__logo" />
      <h1 className="seccion__titulo">Sección de Citas</h1>
      <p className="seccion__texto">
        Aquí el usuario elige su barbero, servicio y fecha.
      </p>
      <button className="boton-oro" onClick={() => navigate("/")}>
        Volver a Inicio
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rutas                                                               */
/* ------------------------------------------------------------------ */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/citas" element={<Citas />} />
        {/* CAMBIO (sesión): PENDIENTE — cuando crees la página de perfil,
            importa el componente y agrega:
            <Route path={RUTA_PERFIL} element={<Perfil />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
