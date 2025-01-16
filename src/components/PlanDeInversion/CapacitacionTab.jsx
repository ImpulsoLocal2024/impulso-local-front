import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

// Mapeo de "código" => "texto a mostrar"
const codeToText = {
  "224": "224 - Fortaleciendo mis capacidades",
  "225": "225 - Gestión Administrativa de mi negocio (La importancia y c",
  "226": "226 - Manejo eficiente del tiempo",
  "227": "227 - Conociendo el mercado para mi producto",
  "228": "228 - Finanzas saludables",
  "229": "229 - Separar finanzas personales y comerciales",
  "230": "230 - Entendiendo los conceptos básicos financieros",
  "231": "231 - Tu empresa, tu apuesta verde",
  "232": "232 - Accediendo a la oferta financiera",
  "233": "233 - Alistate para crecer",
  "234": "234 - Vitrinas que venden solas",
  "235": "235 - Transición a la sostenibilidad",
  "236": "236 - Construyendo cultura solidaria",
};

export default function CapacitacionTab({ id }) {
  // Aquí ya no usamos un array fijo de questions,
  // sino que lo construiremos en base a recommended_codes
  const [recommendedCodes, setRecommendedCodes] = useState([]); 
  const [record, setRecord] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Historial
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
          // No existe => creamos uno nuevo vacío
          setRecord(null);
          setRecordId(null);
          setRecommendedCodes([]);
        } else {
          const existingRecord = response.data[0];
          setRecord(existingRecord);
          setRecordId(existingRecord.id);

          // Asegurarnos de extraer recommended_codes (puede ser null)
          const codesArray = existingRecord.recommended_codes || [];
          setRecommendedCodes(codesArray);

          // Para cada code, si en la BD no existe la columna, 
          // hay que manejarlo con precaución. 
          // Este ejemplo asume que la BD sí tiene una columna 
          // para cada "texto" de la lista (p.ej. "224 - Fortaleciendo..."), 
          // o que la manejas de otra forma.
          codesArray.forEach((code) => {
            const questionText = codeToText[code] || code;
            if (existingRecord[questionText] === undefined) {
              // Si no existe, setearlo false en local (solo en front). 
              // Guardar en BD si deseas con put. 
              existingRecord[questionText] = false;
            }
          });

          setRecord({ ...existingRecord });
        }
      } catch (error) {
        console.error("Error obteniendo el registro de capacitación:", error);
        setRecord(null);
        setRecordId(null);
        setRecommendedCodes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  // Función para togglear una cápsula como completada/no completada
  // Asumiendo que en tu BD la columna se llama igual que en 'record' 
  // (ej. "224 - Fortaleciendo mis capacidades")
  const handleToggle = async (code) => {
    if (!recordId || !record) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }
      const questionText = codeToText[code] || code;

      // Actualizar local
      const currentVal = record[questionText] || false;
      const updatedVal = !currentVal;
      const updatedRecord = {
        ...record,
        [questionText]: updatedVal,
      };

      // Enviar al backend
      // Se asume que la columna en la BD se llama EXACTAMENTE questionText 
      // o algo similar. Ajusta según tu tabla real.
      await axios.put(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record/${recordId}`,
        updatedRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecord(updatedRecord);
    } catch (error) {
      console.error("Error toggling capacitación:", error);
      alert("Error al marcar la cápsula en la BD");
    }
  };

  // Calculamos el avance: de recommendedCodes, cuántos están en "true" en record
  let progress = 0;
  if (!loading && record && recommendedCodes.length > 0) {
    const completedCount = recommendedCodes.reduce((acc, code) => {
      const questionText = codeToText[code] || code;
      return acc + (record[questionText] ? 1 : 0);
    }, 0);
    progress = ((completedCount / recommendedCodes.length) * 100).toFixed(2);
  }

  // Si no hay recommendedCodes, no mostramos nada
  if (loading) {
    return <p>Cargando...</p>;
  }

  // Historial
  const fetchHistory = async () => {
    if (!recordId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = localStorage.getItem("token");
      const historyResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_capacitacion/record/${recordId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistory(historyResponse.data.history || []);
      setHistoryLoading(false);
    } catch (error) {
      console.error("Error obteniendo el historial:", error);
      setHistoryError("Error obteniendo el historial");
      setHistoryLoading(false);
    }
  };

  const handleOpenHistoryModal = async () => {
    await fetchHistory();
    setShowHistoryModal(true);
  };

  return (
    <div>
      <h3>Capacitación</h3>

      {recommendedCodes.length === 0 ? (
        <p>No hay cápsulas recomendadas por el diagnóstico.</p>
      ) : (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <h5>Porcentaje de avance</h5>
            <div
              className="progress"
              style={{ height: "20px", backgroundColor: "#e9ecef" }}
            >
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#28a745",
                }}
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {progress}%
              </div>
            </div>
          </div>

          <ul className="list-group mb-3">
            {recommendedCodes.map((code) => {
              const questionText = codeToText[code] || code;
              const isDone = record[questionText] || false;
              return (
                <li
                  key={code}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleToggle(code)}
                >
                  {questionText}
                  {isDone ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      ✔️
                    </span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      ❌
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Mostrar botón de historial solo si existe recordId */}
      {recordId && (
        <button
          type="button"
          className="btn btn-info btn-sm"
          onClick={handleOpenHistoryModal}
        >
          Ver Historial de Cambios
        </button>
      )}

      {showHistoryModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
        >
          <div
            className="modal-dialog modal-lg"
            role="document"
            style={{ maxWidth: "90%" }}
          >
            <div
              className="modal-content"
              style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            >
              <div className="modal-header">
                <h5 className="modal-title">Historial de Cambios</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowHistoryModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body" style={{ overflowY: "auto" }}>
                {historyError && (
                  <div className="alert alert-danger">{historyError}</div>
                )}
                {historyLoading ? (
                  <div>Cargando historial...</div>
                ) : history.length > 0 ? (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    <table className="table table-striped table-bordered table-sm">
                      <thead className="thead-light">
                        <tr>
                          <th>ID Usuario</th>
                          <th>Usuario</th>
                          <th>Fecha del Cambio</th>
                          <th>Tipo de Cambio</th>
                          <th>Campo</th>
                          <th>Valor Antiguo</th>
                          <th>Valor Nuevo</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id}>
                            <td>{item.user_id}</td>
                            <td>{item.username}</td>
                            <td>
                              {new Date(item.created_at).toLocaleString()}
                            </td>
                            <td>{item.change_type}</td>
                            <td>{item.field_name || "-"}</td>
                            <td>{item.old_value || "-"}</td>
                            <td>{item.new_value || "-"}</td>
                            <td>{item.description || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3">No hay historial de cambios.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

CapacitacionTab.propTypes = {
  id: PropTypes.string.isRequired,
};


