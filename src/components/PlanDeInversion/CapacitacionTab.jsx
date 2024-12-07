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
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const totalQuestions = questions.length;

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data || response.data.length === 0) {
          // No existe el registro en BD, inicializamos uno en memoria con todos false
          let newRecord = { caracterizacion_id: id };
          questions.forEach((q) => {
            newRecord[q] = false;
          });
          setRecord(newRecord);
          setRecordId(null);
        } else {
          // Existe al menos un registro, tomamos el primero
          const existingRecord = response.data[0];

          // Asegurar que todas las preguntas existan, si no, ponerlas en false
          questions.forEach((q) => {
            if (existingRecord[q] === undefined || existingRecord[q] === null) {
              existingRecord[q] = false;
            }
          });

          setRecord(existingRecord);
          setRecordId(existingRecord.id);
        }
      } catch (error) {
        console.error("Error obteniendo el registro de capacitación:", error);
        // Si hay error (ej: 404), creamos uno en memoria sin guardarlo aún
        let newRecord = { caracterizacion_id: id };
        questions.forEach((q) => {
          newRecord[q] = false;
        });
        setRecord(newRecord);
        setRecordId(null);
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
    if (!record) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      if (recordId) {
        // Actualizar registro existente
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record/${recordId}`,
          record,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // No sobrescribimos el estado con la respuesta, confiamos en el estado local
        alert("Capacitación guardada exitosamente");
      } else {
        // Crear nuevo registro
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record`,
          record,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Ajustar recordId con el devuelto por el backend
        if (createResponse.data && createResponse.data.id) {
          setRecordId(createResponse.data.id);
        }
        alert("Capacitación guardada exitosamente");
      }
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

