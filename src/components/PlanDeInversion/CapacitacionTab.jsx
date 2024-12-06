import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function CapacitacionTab({ id }) {
  // Lista de cápsulas (preguntas) a mostrar
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

  const [answers, setAnswers] = useState({});
  const [recordIds, setRecordIds] = useState({});
  const [loading, setLoading] = useState(true);

  // Cargar registros existentes
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const records = response.data.reduce(
          (acc, record) => {
            acc.answers[record.Pregunta.trim()] = record.Respuesta; // Suponiendo Respuesta es booleano
            acc.recordIds[record.Pregunta.trim()] = record.id;
            return acc;
          },
          { answers: {}, recordIds: {} }
        );

        setAnswers(records.answers);
        setRecordIds(records.recordIds);
      } catch (error) {
        console.error("Error obteniendo registros de capacitación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [id]);

  const handleToggle = (questionText) => {
    setAnswers((prev) => ({ ...prev, [questionText]: !prev[questionText] }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      const newRecordIds = { ...recordIds };
      const requests = questions.map(async (q) => {
        const currentAnswer = answers[q] === undefined ? false : answers[q];
        const requestData = {
          caracterizacion_id: id,
          Pregunta: q,
          Respuesta: currentAnswer,
          Puntaje: currentAnswer ? 1 : 0,
        };

        if (newRecordIds[q]) {
          // Actualizar registro existente
          await axios.put(
            `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record/${newRecordIds[q]}`,
            requestData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          // Crear nuevo registro
          const response = await axios.post(
            `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record`,
            requestData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          newRecordIds[q] = response.data.id;
        }
      });

      await Promise.all(requests);
      setRecordIds(newRecordIds);
      alert("Capacitación guardada exitosamente");
    } catch (error) {
      console.error("Error guardando la capacitación:", error);
      alert("Hubo un error al guardar la capacitación");
    }
  };

  const completedCount = questions.reduce((count, q) => count + (answers[q] ? 1 : 0), 0);
  const progress = ((completedCount / questions.length) * 100).toFixed(2);

  return (
    <div>
      <h3>Capacitación</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div>
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
                {answers[q] ? (
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
      )}
    </div>
  );
}

CapacitacionTab.propTypes = {
  id: PropTypes.string.isRequired,
};
