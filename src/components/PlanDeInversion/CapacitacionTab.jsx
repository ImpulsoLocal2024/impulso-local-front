import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function CapacitacionTab({ id }) {
  const questions = [
    "224 - Fortaleciendo mis capacidades",
    "225 - Gestión Administrativa de mi negocio (La importancia y consejos para un buen manejo documental)",
    "226 - Manejo eficiente del tiempo.",
    "227 - Conociendo el mercado para mi producto",
    "228 - Finanzas saludables",
    "229 - Separar finanzas personales y comerciales",
    "230 - Entendiendo los conceptos básicos financieros",
    "231 - Tu empresa, tu apuesta verde",
    "232 - Accediendo a la oferta financiera",
    "233 - Alistate para crecer",
    "234 - Vitrinas que venden solas",
    "235 - Transición a la sostenibilidad",
    "236 - Construyendo cultura solidaria",
  ];

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const totalQuestions = questions.length;

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Suponemos que si no existe registro, la API devuelve algún objeto vacío o 404.
        // Ajustar según el comportamiento real de la API.
        let data;
        if (response.data) {
          data = response.data;
        } else {
          // Si no existe el registro, creamos uno por defecto con todos los campos en false
          data = { caracterizacion_id: id };
          questions.forEach((q) => {
            data[q] = false;
          });
        }

        // Si hay campos que no existen, asegúrate de inicializarlos en false.
        questions.forEach((q) => {
          if (data[q] === undefined || data[q] === null) {
            data[q] = false;
          }
        });

        setRecord(data);
      } catch (error) {
        console.error("Error obteniendo el registro de capacitación:", error);
        // Si la respuesta es 404 o no hay datos, creamos uno vacío.
        // Ajustar según necesidad.
        let data = { caracterizacion_id: id };
        questions.forEach((q) => {
          data[q] = false;
        });
        setRecord(data);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const handleToggle = (questionText) => {
    setRecord((prev) => ({
      ...prev,
      [questionText]: !prev[questionText],
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      // Enviamos todo el objeto de `record` al backend.
      // Si la API espera PUT si ya existe y POST si no existe,
      // debemos tener una lógica para saber si existe. Por ejemplo,
      // si la API nos da un id interno del registro.
      // Aquí asumimos que con un PUT actualizamos o creamos. Ajustar según tu API.

      await axios.put(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record`,
        record,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Capacitación guardada exitosamente");
    } catch (error) {
      console.error("Error guardando la capacitación:", error);
      alert("Hubo un error al guardar la capacitación");
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  // Calcular progreso
  const completedCount = questions.reduce((count, q) => count + (record[q] ? 1 : 0), 0);
  const progress = ((completedCount / totalQuestions) * 100).toFixed(2);

  return (
    <div>
      <h3>Capacitación</h3>

      <div style={{ marginBottom: "1rem" }}>
        <h5>Porcentaje de avance</h5>
        <div className="progress" style={{ height: "20px", backgroundColor: "#e9ecef" }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%`, backgroundColor: "#28a745" }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {progress}%
          </div>
        </div>
      </div>

      <ul className="list-group mb-3">
        {questions.map((q) => (
          <li
            key={q}
            className="list-group-item d-flex justify-content-between align-items-center"
            style={{ cursor: "pointer" }}
            onClick={() => handleToggle(q)}
          >
            {q}
            {record[q] ? (
              <span style={{ color: "green", fontWeight: "bold" }}>✔️</span>
            ) : (
              <span style={{ color: "red", fontWeight: "bold" }}>❌</span>
            )}
          </li>
        ))}
      </ul>

      <button className="btn btn-primary" onClick={handleSubmit}>
        Guardar
      </button>
    </div>
  );
}

CapacitacionTab.propTypes = {
  id: PropTypes.string.isRequired,
};

