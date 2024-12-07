import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

export default function FormulacionTab({ id }) {
  const [fields, setFields] = useState([]);
  const [data, setData] = useState({});
  const [tableName] = useState('pi_formulacion');
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const montoDisponible = 3000000; // 3 millones

  // Función para obtener archivos
  const fetchFiles = useCallback(async (currentRecordId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const filesResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${currentRecordId}/files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Aquí podrías agregar params si fuese necesario, por ejemplo source.
          // params: {
          //   source: 'formulacion',
          // },
        }
      );
      setUploadedFiles(filesResponse.data.files);
    } catch (error) {
      console.error('Error obteniendo los archivos:', error);
      setError('Error obteniendo los archivos');
    }
  }, [tableName]);

  useEffect(() => {
    const fetchFieldsAndData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Obtener campos
        const fieldsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/fields`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFields(fieldsResponse.data);

        // Obtener registros
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
          await fetchFiles(existingRecord.id); // Obtener archivos usando el recordId
        } else {
          setUploadedFiles([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error obteniendo los campos o datos:', error);
        setError('Error obteniendo los campos o datos');
        setLoading(false);
      }
    };

    fetchFieldsAndData();
  }, [tableName, id, fetchFiles]);

  const handleChange = (field, value) => {
    const updatedData = { ...data, [field]: value, caracterizacion_id: id };
    setData(updatedData);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (recordId) {
        // Actualizar registro existente
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record/${recordId}`,
          { ...data, caracterizacion_id: id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('Registro actualizado exitosamente');
      } else {
        // Crear nuevo registro
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record`,
          { ...data, caracterizacion_id: id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRecordId(createResponse.data.id);
        await fetchFiles(createResponse.data.id);
        alert('Registro creado exitosamente');
      }
    } catch (error) {
      console.error('Error guardando los datos:', error);
      setError('Error guardando los datos');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !fileName) {
      alert('Por favor, ingresa un nombre y selecciona un archivo');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('caracterizacion_id', id);
      // formData.append('source', 'formulacion'); // Si el backend lo necesita

      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${recordId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      await fetchFiles(recordId);
      setFile(null);
      setFileName('');
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
      setError('Error subiendo el archivo');
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!recordId) {
      alert('No hay registro asociado para eliminar un archivo.');
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${recordId}/file/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchFiles(recordId);
      } catch (error) {
        console.error('Error eliminando el archivo:', error);
        setError('Error eliminando el archivo');
      }
    }
  };

  // Calcular montos y contrapartida (ejemplo similar a lo anterior)
  const cantidad = data["Cantidad"] ? parseInt(data["Cantidad"], 10) : 0;
  const valorUnitario = data["Valor Unitario"] ? parseFloat(data["Valor Unitario"]) : 0;
  const valorTotal = cantidad * valorUnitario;
  const contrapartida = valorTotal > montoDisponible ? valorTotal - montoDisponible : 0;

  return (
    <div>
      <h3>Formulación del Plan de Inversión</h3>
      {loading ? (
        <p>Cargando campos...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          {/* Campos de la tabla (ejemplo simple) */}
          <div className="form-group">
            <label>Rubro</label>
            <input
              type="text"
              className="form-control"
              value={data["Rubro"] || ""}
              onChange={(e) => handleChange("Rubro", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Elemento</label>
            <input
              type="text"
              className="form-control"
              value={data["Elemento"] || ""}
              onChange={(e) => handleChange("Elemento", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              className="form-control"
              value={data["Descripción"] || ""}
              onChange={(e) => handleChange("Descripción", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Cantidad</label>
            <input
              type="number"
              className="form-control"
              value={data["Cantidad"] || ""}
              onChange={(e) => handleChange("Cantidad", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Valor Unitario</label>
            <input
              type="number"
              className="form-control"
              value={data["Valor Unitario"] || ""}
              onChange={(e) => handleChange("Valor Unitario", e.target.value)}
            />
          </div>

          <button className="btn btn-primary mt-2" onClick={handleSave}>
            Guardar cambios
          </button>

          <hr />

          <h5>Resumen de la inversión</h5>
          <p><strong>Valor Total:</strong> ${valorTotal.toLocaleString()}</p>
          <p><strong>Monto disponible:</strong> $3.000.000</p>
          <p style={{color: contrapartida > 0 ? "red" : "black"}}>
            <strong>Contrapartida:</strong> ${contrapartida.toLocaleString()}
          </p>

          <hr />

          <h5>Archivos adicionales</h5>
          {!showUploadForm && (
            <button
              className="btn btn-primary btn-sm btn-block mb-2"
              onClick={() => setShowUploadForm(true)}
              disabled={!recordId} // No subir archivos si no hay recordId
            >
              Subir documento
            </button>
          )}

          {showUploadForm && (
            <form onSubmit={handleFileUpload}>
              <div className="form-group">
                <label>Nombre del archivo</label>
                <input
                  type="text"
                  className="form-control"
                  value={fileName}
                  onChange={handleFileNameChange}
                />
              </div>
              <div className="form-group">
                <label>Seleccionar archivo</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
              </div>
              <button type="submit" className="btn btn-success btn-sm btn-block mb-2">
                Cargar archivo
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-block"
                onClick={() => setShowUploadForm(false)}
              >
                Cancelar
              </button>
            </form>
          )}

          {uploadedFiles.length > 0 ? (
            <ul className="list-group mt-3">
              {uploadedFiles.map((file) => (
                <li
                  key={file.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{file.name}</strong>
                    <br />
                    <a
                      href={`https://impulso-local-back.onrender.com${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver archivo
                    </a>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleFileDelete(file.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay archivos subidos aún.</p>
          )}
        </div>
      )}
    </div>
  );
}

FormulacionTab.propTypes = {
  id: PropTypes.string.isRequired,
};
