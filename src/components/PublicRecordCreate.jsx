// PublicRecordCreate.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/DynamicRecordEdit.css';

export default function PublicRecordCreate() {
  const { tableName } = useParams();
  const navigate = useNavigate();

  const [newRecord, setNewRecord] = useState({});
  const [fields, setFields] = useState([]);
  const [relatedData, setRelatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para manejo de archivos
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState({});
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Mapeo de nombres personalizados para los campos
  const fieldLabels = {
    // Mapeo de campos personalizado como antes...
  };

  // Obtener los campos de la tabla y datos relacionados
  useEffect(() => {
    const fetchFieldsData = async () => {
      try {
        const fieldsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/fields`
        );

        // Filtrar los campos para excluir 'Estado', 'Asesor' e 'ID'
        const filteredFields = fieldsResponse.data.filter(
          (field) => !['estado', 'asesor', 'id'].includes(field.column_name.toLowerCase())
        );
        setFields(filteredFields);

        const relatedDataResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/related-data`
        );
        setRelatedData(relatedDataResponse.data.relatedData || {});
        setLoading(false);
      } catch (error) {
        setError('Error obteniendo los datos de los campos');
        setLoading(false);
      }
    };

    fetchFieldsData();
  }, [tableName]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setNewRecord({ ...newRecord, [e.target.name]: e.target.value });
  };

  // Manejar cambios en los archivos
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  // Manejar cambios en los nombres de los archivos
  const handleFileNameChange = (e, index) => {
    setFileNames({
      ...fileNames,
      [index]: e.target.value,
    });
  };

  // Manejar envío del formulario y subida de archivos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');

      // Primero, crear el registro
      const recordResponse = await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/create`,
        newRecord,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Verificar que el registro se haya creado correctamente y que contenga un 'id'
      const createdRecordId = recordResponse.data?.record?.id || recordResponse.data?.id;

      if (!createdRecordId) {
        throw new Error('No se pudo obtener el ID del registro creado.');
      }

      // Subir cada archivo con su nombre si hay archivos seleccionados
      if (files.length > 0) {
        const uploadPromises = files.map((file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', fileNames[index] || file.name);

          return axios.post(
            `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/${createdRecordId}/upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        });

        // Esperar a que todas las subidas de archivos finalicen
        await Promise.all(uploadPromises);
      }

      setSuccessMessage('Registro y archivos subidos exitosamente');
      setTimeout(() => {
        navigate(`/table/${tableName}`);
      }, 2000);
    } catch (error) {
      console.error('Error creando el registro o subiendo los archivos:', error);
      setError('Error creando el registro o subiendo los archivos');
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Crear Nuevo Registro (Acceso Público)</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {fields.map((field) => (
                <div className="form-group" key={field.column_name}>
                  <label>{fieldLabels[field.column_name] || field.column_name}</label>
                  {Array.isArray(relatedData[field.column_name]) ? (
                    <select
                      className="form-control"
                      name={field.column_name}
                      value={newRecord[field.column_name] || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Selecciona una opción --</option>
                      {relatedData[field.column_name].map((relatedRecord) => (
                        <option key={relatedRecord.id} value={relatedRecord.id}>
                          {relatedRecord.displayValue || `ID: ${relatedRecord.id}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={field.column_name}
                      value={newRecord[field.column_name] || ''}
                      onChange={handleChange}
                      className="form-control"
                    />
                  )}
                </div>
              ))}

              <div className="form-group">
                <label>Seleccionar archivos para subir</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  onChange={handleFileChange}
                />
              </div>

              {files.map((file, index) => (
                <div className="form-group" key={index}>
                  <label>Nombre para el archivo: {file.name}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fileNames[index] || ''}
                    onChange={(e) => handleFileNameChange(e, index)}
                    placeholder="Ingresa un nombre para el archivo"
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-primary">
                Guardar Registro y Subir Archivos
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}





