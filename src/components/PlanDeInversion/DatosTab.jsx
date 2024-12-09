import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

export default function DatosTab({ id }) {
  const [fields, setFields] = useState([]);
  const [data, setData] = useState({ caracterizacion_id: id });
  const [tableName] = useState('pi_datos');
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [error, setError] = useState(null);

  // Estados para historial
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Obtener el rol del usuario
  const getLoggedUserRoleId = () => {
    return localStorage.getItem('role_id') || null;
  };
  const role = getLoggedUserRoleId();

  useEffect(() => {
    const fetchFieldsAndData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        // Obtener campos de la tabla (vía PI)
        const fieldsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/fields`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFields(fieldsResponse.data);

        // Obtener registro existente filtrado por caracterizacion_id
        const recordsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/records?caracterizacion_id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (recordsResponse.data.length > 0) {
          const existingRecord = recordsResponse.data[0];
          setData(existingRecord);
          setRecordId(existingRecord.id);
        } else {
          setData((prevData) => ({ ...prevData, caracterizacion_id: id }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error obteniendo los campos o datos:', error);
        setError('Error obteniendo los campos o datos');
        setLoading(false);
      }
    };

    fetchFieldsAndData();
  }, [tableName, id]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const recordData = { ...data, caracterizacion_id: id };

      if (recordId) {
        // Actualizar registro existente
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record/${recordId}`,
          recordData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('Datos actualizados exitosamente');
      } else {
        // Crear nuevo registro
        // Si el controlador espera 'user_id', usar user_id:
        const userId = localStorage.getItem('id');
        recordData.user_id = userId; // Si el backend espera user_id
        // Si el backend espera 'id', entonces usa:
        // recordData.id = userId;

        await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record`,
          recordData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('Datos guardados exitosamente');
      }
    } catch (error) {
      console.error('Error guardando los datos:', error);
      setError('Error guardando los datos');
    }
  };

  // Función para obtener el historial
  const fetchHistory = async () => {
    if (!recordId) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const historyResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${recordId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      <h3>Datos</h3>
      {loading ? (
        <p>Cargando campos...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          <form onSubmit={handleSubmit}>
            {fields
              .filter((field) => field.column_name !== 'id')
              .map((field) => (
                <div className="form-group" key={field.column_name}>
                  <label>{field.column_name}</label>
                  <input
                    type="text"
                    name={field.column_name}
                    className="form-control"
                    value={data[field.column_name] || ''}
                    onChange={handleChange}
                    readOnly={field.column_name === 'caracterizacion_id'}
                  />
                </div>
              ))}
            <button type="submit" className="btn btn-primary">
              {recordId ? 'Actualizar' : 'Guardar'}
            </button>
          </form>

          {recordId && role !== '3' && (
            <button
              type="button"
              className="btn btn-info btn-sm mt-3"
              onClick={handleOpenHistoryModal}
            >
              Ver Historial de Cambios
            </button>
          )}
        </div>
      )}

      {showHistoryModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg" role="document" style={{ maxWidth: '90%' }}>
            <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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

DatosTab.propTypes = {
  id: PropTypes.string.isRequired,
};

