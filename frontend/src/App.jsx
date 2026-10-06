import { useEffect, useState } from "react";
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
/* ------------------------------------------------------------------ */
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
/* Página de inicio                                                    */
/* ------------------------------------------------------------------ */
function Inicio() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [servicioAbierto, setServicioAbierto] = useState(null);

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
  useEffect(() => {
    document.body.style.overflow = cargando ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cargando]);

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

            <span className="nav__redes">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <IconoInstagram />
              </a>
              <a
                href={FACEBOOK}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <IconoFacebook />
              </a>
            </span>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
