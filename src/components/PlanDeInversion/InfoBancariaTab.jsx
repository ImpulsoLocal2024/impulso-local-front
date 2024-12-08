import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

export default function AnexosTab({ id }) {
  const [data, setData] = useState({});
  const [tableName] = useState('pi_anexos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null); // para el archivo ya subido
  const [recordId, setRecordId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        setLoading(false);
        return;
      }

      // Obtener registro pi_anexos
      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recordData = response.data[0] || null;

      if (recordData) {
        // Existe el registro
        setRecordId(recordData.id);
        setData(recordData);
        setOriginalData({ ...recordData });
      } else {
        // No existe el registro, crear uno
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record`,
          { caracterizacion_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecordId(createResponse.data.id);
        setData({ caracterizacion_id: id });
        setOriginalData({ caracterizacion_id: id });
      }

      // Obtener archivos asociados
      await fetchFileFromBackend();

      setLoading(false);
    } catch (err) {
      console.error("Error obteniendo datos de Anexos:", err);
      setError("Error obteniendo datos");
      setLoading(false);
    }
  };

  const fetchFileFromBackend = async () => {
    // Esta función obtiene todos los archivos y filtra el que tenga el prefijo 'anexos_'
    try {
      const token = localStorage.getItem('token');
      if (!token || !recordId) return;

      const filesResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${recordId}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allFiles = filesResponse.data.files || [];
      // Filtrar el archivo cuyo nombre contenga 'anexos_'
      const anexoFile = allFiles.find(f => f.name.includes('anexos_')) || null;
      setUploadedFile(anexoFile);

    } catch (error) {
      console.error('Error obteniendo el archivo:', error);
      setError('Error obteniendo el archivo');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCancel = () => {
    if (originalData) {
      setData({ ...originalData });
      setFile(null);
      setFileName("");
      fetchData();
    }
  };

  const handleSave = async () => {
    // Aquí podrías guardar datos adicionales si la tabla pi_anexos tuviera campos editables.
    // En este caso, imitamos la lógica de InfoBancariaTab: guarda el registro si recordId existe o crea si no.
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      const requestData = {
        caracterizacion_id: id,
        // Agregar aquí otros campos si existen en pi_anexos
      };

      if (recordId) {
        // Actualizar (PUT)
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record/${recordId}`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Crear (POST)
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecordId(createResponse.data.id);
      }

      alert("Información guardada exitosamente");
      await fetchData();
    } catch (err) {
      console.error("Error guardando la información:", err);
      setError("Error guardando la información");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !fileName) {
      alert('Por favor, ingresa un nombre y selecciona un archivo');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Agregamos el prefijo 'anexos_' al nombre del archivo
      const fileNameWithPrefix = `anexos_${fileName}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileNameWithPrefix);
      formData.append('caracterizacion_id', id);

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

      alert("Archivo subido exitosamente");
      await fetchFileFromBackend();
      setFile(null);
      setFileName("");
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
      setError('Error subiendo el archivo');
    }
  };

  const handleFileDelete = async () => {
    if (!uploadedFile) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${recordId}/file/${uploadedFile.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchFileFromBackend();
      } catch (error) {
        console.error('Error eliminando el archivo:', error);
        setError('Error eliminando el archivo');
      }
    }
  };

  return (
    <div>
      <h3>Anexos</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div style={{ maxWidth: '600px' }}>
          <div className="card p-3 mb-3">
            <h5>Archivos adicionales</h5>

            <div className="mb-2">
              <label><strong>Adjuntar archivo</strong></label><br/>
              {uploadedFile ? (
                <div className="mb-2">
                  <a
                    href={`https://impulso-local-back.onrender.com${uploadedFile.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: '10px' }}
                  >
                    Ver archivo
                  </a>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleFileDelete}
                  >
                    Eliminar archivo
                  </button>
                </div>
              ) : (
                <p className="mb-2">No hay archivo adjunto</p>
              )}

              {file ? (
                <form onSubmit={handleFileUpload}>
                  <div className="form-group mb-2">
                    <label>Nombre del archivo</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Nombre del archivo sin extensión"
                    />
                  </div>
                  <button type="submit" className="btn btn-success btn-sm me-2">
                    Cargar archivo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setFile(null); setFileName(""); }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="mt-2">
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AnexosTab.propTypes = {
  id: PropTypes.string.isRequired,
};

