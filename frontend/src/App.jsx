import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";

// 1. Componente de la página principal (Inicio)
function Inicio() {
  const navigate = useNavigate();

  // NUEVO: llama al backend y navega a la URL que este responde
  const irACitas = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/api/ir-citas");
      const data = await respuesta.json();

      if (data.ok) {
        navigate(data.url); // el backend decide la ruta (/citas)
      }
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Página Principal - FASTY</h1>

      {/* OPCIÓN A: Usando el componente <Link> (Ideal para navegaciones directas) */}
      <Link
        to="/citas"
        style={{
          display: "inline-block",
          margin: "10px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Ir a Citas (vía Link)
      </Link>

      <br />
      <br />

      {/* OPCIÓN B: Usando un <button> tradicional con evento onClick (Ideal si ejecutas funciones JS antes de ir) */}
      <button
        // ANTES: onClick={() => navigate("/citas")}
        // AHORA (NUEVO): llama a la función que consulta el backend
        onClick={irACitas}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Ir a Citas (vía onClick con useNavigate)
      </button>
    </div>
  );
}

// 2. Componente para la página de Citas
function Citas() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Sección de Citas</h1>
      <p>Aquí el usuario elige su barbero, servicio y fecha.</p>

      {/* Botón para volver al inicio */}
      <button onClick={() => navigate("/")}>Volver a Inicio</button>
    </div>
  );
}

// 3. Configuración principal de las rutas del sitio
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Define la ruta / para el inicio */}
        <Route path="/" element={<Inicio />} />

        {/* Define la ruta /citas para la vista de citas */}
        <Route path="/citas" element={<Citas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
