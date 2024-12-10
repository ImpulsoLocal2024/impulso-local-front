import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function CapacitacionTab({ id }) {
  const questions = [
    "224 - Fortaleciendo mis capacidades",
    "225 - Gestión Administrativa de mi negocio (La importancia y c",
    "226 - Manejo eficiente del tiempo",
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

  // Estados para historial
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
          let newRecord = { caracterizacion_id: id };
          questions.forEach((q) => {
            newRecord[q] = false;
          });
          setRecord(newRecord);
          setRecordId(null);
        } else {
          const existingRecord = response.data[0];
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

      // Agregar user_id para el historial
      const userId = localStorage.getItem('id');
      const recordData = { ...record, user_id: userId };

      if (recordId) {
        // Actualizar registro existente
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record/${recordId}`,
          recordData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Capacitación guardada exitosamente");
      } else {
        // Crear nuevo registro
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record`,
          recordData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  // Calcular progreso
  if (loading) {
    return <p>Cargando...</p>;
  }

  const completedCount = questions.reduce((count, q) => count + (record[q] ? 1 : 0), 0);
  const progress = ((completedCount / totalQuestions) * 100).toFixed(2);

  // Función para obtener el historial del registro actual
  const fetchHistory = async () => {
    if (!recordId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = localStorage.getItem('token');
      const historyResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_capacitacion/record/${recordId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setHistory(historyResponse.data.history || []);
      setHistoryLoading(false);
    } catch (error) {
      console.error('Error obteniendo el historial:', error);
      setHistoryError('Error obteniendo el historial');
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

      {/* Mostrar botón de historial solo si existe recordId */}
      {recordId && (
        <button
          type="button"
          className="btn btn-info btn-sm ml-2"
          onClick={handleOpenHistoryModal}
        >
          Ver Historial de Cambios
        </button>
      )}

      {showHistoryModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg" role="document" style={{ maxWidth: '90%' }}>
            <div
              className="modal-content"
              style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
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
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                {historyError && (
                  <div className="alert alert-danger">{historyError}</div>
                )}
                {historyLoading ? (
                  <div>Cargando historial...</div>
                ) : history.length > 0 ? (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: '400px', overflowY: 'auto' }}
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
                            <td>{new Date(item.created_at).toLocaleString()}</td>
                            <td>{item.change_type}</td>
                            <td>{item.field_name || '-'}</td>
                            <td>{item.old_value || '-'}</td>
                            <td>{item.new_value || '-'}</td>
                            <td>{item.description || '-'}</td>
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


