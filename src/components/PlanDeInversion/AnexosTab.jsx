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
  const [uploadedFile, setUploadedFile] = useState(null); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recordData = response.data[0] || null;

      if (recordData) {
        // Existe el registro
        setData(recordData);
        setOriginalData({ ...recordData });
      } else {
        // Crear registro
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/${tableName}/record`,
          { caracterizacion_id: id, user_id: localStorage.getItem('id') }, // Agregar user_id al crear el registro
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newRecord = createResponse.data.record || createResponse.data; 
        setData({ ...newRecord });
        setOriginalData({ ...newRecord });
      }

      await fetchFileFromBackend();

      setLoading(false);
    } catch (err) {
      console.error("Error obteniendo datos de Anexos:", err);
      setError("Error obteniendo datos");
      setLoading(false);
    }
  };

  const fetchFileFromBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const filesResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${id}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allFiles = filesResponse.data.files || [];
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
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      // Si necesitas actualizar algo adicional, aquí lo harías con un PUT, 
      // enviando user_id si es necesario. Si no hace falta, solo el alert.
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
      const userId = localStorage.getItem('id');
      const fileNameWithPrefix = `anexos_${fileName}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileNameWithPrefix);
      formData.append('caracterizacion_id', id);
      formData.append('user_id', userId); // Agregar el user_id aquí

      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${id}/upload`,
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
        const userId = localStorage.getItem('id');
        await axios.delete(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${id}/file/${uploadedFile.id}?user_id=${userId}`,
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
