// PublicRecordCreate.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/PublicRecordCreate.css';

export default function PublicRecordCreate() {
  const { tableName } = useParams();
  const navigate = useNavigate();

  const [newRecord, setNewRecord] = useState({});
  const [fields, setFields] = useState([]);
  const [relatedData, setRelatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileList, setFileList] = useState([]);

  // Estados para validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({});
  const typingTimeoutRef = useRef({});

  const fileTypeOptions = [
    "Copia de documento de identidad",
    "Factura de servicio publico",
    "Evidencia de existencia de mínimo un año",
    "Registro Cámara de Comercio (solo si aplica)",
    "RUT",
    "Certificado de ventas",
    "Evidencia generación de empleo",
    "Certificación discapacidad expedida por Secretaria de Salud (Si aplica)",
    "Certificado de cuidador (Si aplica)",
    "Certificado de Población indígena (Si aplica)",
    "Certificación de RIVI (Si aplica)",
    "Antecedentes policía",
    "Antecedentes procuraduría",
    "Antecedentes contraloría",
    "Otros"
  ];

  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  const fieldLabels = {
    [normalize("Nombres")]: "Nombres",
    [normalize("Apellidos")]: "Apellidos",
    [normalize("Tipo de identificacion")]: "Tipo de identificación",
    [normalize("Numero de identificacion")]: "Número de identificación",
    [normalize("Fecha de nacimiento")]: "Fecha de nacimiento (DD/MM/AAAA)",
    [normalize("Edad")]: "Edad",
    [normalize("Sexo")]: "Sexo",
    [normalize("Telefono fijo")]: "Teléfono fijo",
    [normalize("Celular")]: "Celular",
    [normalize("Celular 2")]: "Celular 2 (puede ser el de un familiar)",
    [normalize("Correo electronico")]: "Correo electrónico",
    [normalize("Direccion")]: "Dirección de residencia",
    [normalize("Barrio")]: "Barrio de residencia",
    [normalize("Localidad de residencia")]: "Localidad de residencia",
    [normalize("Nivel educativo del empresario")]: "Nivel educativo del empresario",
    [normalize("Presenta algun tipo de discapacidad")]: "¿Presenta algún tipo de discapacidad?",
    [normalize("Grupo etnico")]: "Grupo étnico",
    [normalize("Es victima del conflicto armado")]: "¿Es víctima del conflicto armado?",
    [normalize("Es cuidador de alguna de las siguientes personas")]: "¿Es cuidador de alguna de las siguientes personas?",
    [normalize("Identidad de genero")]: "Identidad de género",
    [normalize("Personas a cargo")]: "Personas a cargo",
    [normalize("Nombre del emprendimiento")]: "Nombre de la unidad de negocio",
    [normalize("Fecha de inicio actividad economica")]: "Fecha de inicio actividad económica",
    [normalize("Esta registrado y renovado ante la Camara de Comercio")]: "¿Su unidad de negocio está registrado ante la Cámara de Comercio?",
    [normalize("Logro renovar la matricula del negocio a comienzos del 2023")]: "¿Logró renovar la matrícula del negocio a comienzos del  2024?",
    [normalize("Fecha de registro en Cámara de Comercio")]: "Fecha de registro en Cámara de Comercio (DD/MM/AAAA)",
    [normalize("NIT")]: "NIT (sin dígito de verificación)",
    [normalize("Localidad de la unidad de negocio")]: "Localidad de la unidad de negocio",
    [normalize("Direccion de la unidad de negocio")]: "Dirección en donde se desarrolla la actividad de la unidad de negocio (debe coincidir con el servicio público que va a adjuntar más adelante)",
    [normalize("En esta direccion tambien es su vivienda")]: "¿En esta dirección también es su vivienda?",
    [normalize("Barrio de la unidad de negocio")]: "Barrio de la unidad de negocio",
    [normalize("Telefono fijo de la unidad de negocio")]: "Teléfono fijo de la unidad de negocio",
    [normalize("El negocio se encuentra ubicado en area")]: "¿El negocio se encuentra ubicado en área?",
    [normalize("Estrato socioeconomico de su unidad de negocio")]: "Estrato socioeconómico de su unidad de negocio",
    [normalize("Cuanto tiempo de funcionamiento tiene su emprendimiento")]: "¿Cuánto tiempo de funcionamiento tiene su unidad de negocio?",
    [normalize("Vendedor informal o ambulante registrado en el HEMI con RIVI")]: "¿Usted es vendedor informal/ambulante registrado en el HEMI con RIVI de la localidad por la cual usted se postula?",
    [normalize("Cuantas personas trabajan directamente en el emprendimiento")]: "¿Cuántas personas trabajan directamente en su unidad de negocio, incluyéndolo a usted?",
    [normalize("En que sector productivo se encuentra su emprendimiento")]: "¿En qué sector productivo se encuentra su unidad de negocio?",
    [normalize("Cual es la oferta de productos o servicios de su negocio")]: "¿Cuál es la oferta de productos o servicios de su unidad de negocio?",
    [normalize("Realiza actividades sostenibles y en proceso de reconversion")]: "¿Su unidad de negocio realiza actividades sostenibles y en proceso de reconversión dirigidas al cuidado del medio ambiente?",
    [normalize("Actividad que Ud. Implementa sostenible y de reconversion")]: "¿Cuál es esa actividad que Ud. implementa que es sostenible y en proceso de reconversión dirigidas al cuidado del medio ambiente?",
    [normalize("Tiene acceso a internet y a un dispositivo")]: "¿Tiene acceso a internet y/o a un dispositivo que le permita acceder a las cápsulas de conocimiento?",
    [normalize("Cuenta con plan de datos en su celular")]: "¿Cuenta con plan de datos en su celular?",
    [normalize("Dispone de una cuenta bancaria o billetera electronica")]: "¿Dispone de una cuenta bancaria o algún servicio de billetera electrónica que le permita recibir el incentivo económico?",
    [normalize("Cual")]: "¿Cuál?",
    [normalize("Numero de clientes actuales")]: "Número de clientes actuales",
    [normalize("Valor de ventas promedio mensual")]: "Valor de ventas promedio mensual",
    [normalize("Cuanto tiempo dispone para el proceso de formacion y PI")]: "¿De cuánto tiempo dispone para dedicarle al proceso de formación y realización del plan de inversión?",
    [normalize("Para la comercializacion de su producto utiliza canales como")]: "Para la comercialización de su producto utiliza canales como:",
    [normalize("El dueño del emprendimiento es funcionario publico")]: "¿El dueño del emprendimiento es funcionario público?"
  };

  const dateFields = new Set([
    normalize("Fecha de nacimiento"),
    normalize("Fecha de inicio actividad economica"),
    normalize("Fecha de registro en Cámara de Comercio")
  ]);

  useEffect(() => {
    const fetchFieldsData = async () => {
      try {
        const fieldsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/fields`
        );

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
        console.error('Error obteniendo los datos de los campos:', error);
        setError('Error obteniendo los datos de los campos');
        setLoading(false);
      }
    };

    fetchFieldsData();
  }, [tableName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedColumnName = normalize(name);

    let newValue = value;

    // Si es un campo de fecha, formatear a 'dd/mm/aaaa'
    if (dateFields.has(normalizedColumnName) && value) {
      const [year, month, day] = value.split('-');
      newValue = `${day}/${month}/${year}`;
    }

    setNewRecord({ ...newRecord, [name]: newValue });

    // Validación en tiempo real para 'Numero de identificacion' y 'Correo electronico'
    if (
      normalizedColumnName === normalize('Numero de identificacion') ||
      normalizedColumnName === normalize('Correo electronico')
    ) {
      // Limpiar el timeout previo si existe
      if (typingTimeoutRef.current[name]) {
        clearTimeout(typingTimeoutRef.current[name]);
      }

      // Establecer un nuevo timeout
      typingTimeoutRef.current[name] = setTimeout(() => {
        validateField(name, newValue);
      }, 500); // 500 ms de retraso después de que el usuario deja de escribir
    }
  };

  const validateField = async (fieldName, fieldValue) => {
    try {
      const response = await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/validate`,
        { fieldName, fieldValue }
      );

      if (response.data.exists) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: `${fieldLabels[normalize(fieldName)] || fieldName} ya está registrado.`
        }));
      } else {
        setValidationErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error validando el campo:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFileList([...fileList, { file: selectedFile, name: '', type: '' }]);
    }
    e.target.value = null;
  };

  const handleFileNameChange = (e, index) => {
    const updatedFileList = [...fileList];
    updatedFileList[index].name = e.target.value;
    setFileList(updatedFileList);
  };

  const handleFileTypeChange = (e, index) => {
    const updatedFileList = [...fileList];
    updatedFileList[index].type = e.target.value;
    setFileList(updatedFileList);
  };

  const handleRemoveFile = (index) => {
    const updatedFileList = [...fileList];
    updatedFileList.splice(index, 1);
    setFileList(updatedFileList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    // Verificar si hay errores de validación
    if (Object.keys(validationErrors).length > 0) {
      setError('Por favor, corrija los errores antes de enviar el formulario.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const recordResponse = await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/create`,
        newRecord,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdRecordId = recordResponse.data?.record?.id || recordResponse.data?.id;

      if (!createdRecordId) {
        throw new Error('No se pudo obtener el ID del registro creado.');
      }

      if (fileList.length > 0) {
        const uploadPromises = fileList.map((fileItem) => {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('fileName', fileItem.name || fileItem.file.name);

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
    <div className="container-fluid d-flex">
      <aside className="sidebar bg-red">
        <h2>Inscripción</h2>
      </aside>
      <main className="form-wrapper">
        <section className="form-header">
          <h1>Crear Nuevo Registro (Acceso Público)</h1>
        </section>
        <section className="form-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <form onSubmit={handleSubmit} className="custom-form">
              {fields.map((field) => {
                const normalizedColumnName = normalize(field.column_name);

                if (normalizedColumnName === 'id') {
                  return null;
                }

                return (
                  <div className="form-group" key={field.column_name}>
                    <label>{fieldLabels[normalizedColumnName] || field.column_name}</label>
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
                      <>
                        <input
                          type={dateFields.has(normalizedColumnName) ? "date" : "text"}
                          name={field.column_name}
                          value={dateFields.has(normalizedColumnName) && newRecord[field.column_name] ? newRecord[field.column_name].split('/').reverse().join('-') : newRecord[field.column_name] || ''}
                          onChange={handleChange}
                          className="form-control"
                        />
                        {validationErrors[field.column_name] && (
                          <div className="text-danger">{validationErrors[field.column_name]}</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <div className="form-group">
                <label>Seleccionar archivo para subir</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
              </div>

              {fileList.map((fileItem, index) => (
                <div className="form-group" key={index}>
                  <label>Archivo: {fileItem.file.name}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fileItem.name}
                    onChange={(e) => handleFileNameChange(e, index)}
                    placeholder="Ingresa un nombre para el archivo"
                  />
                  <select
                    className="form-control mt-2"
                    value={fileItem.type}
                    onChange={(e) => handleFileTypeChange(e, index)}
                  >
                    <option value="">-- Selecciona el tipo de archivo --</option>
                    {fileTypeOptions.map((typeOption, idx) => (
                      <option key={idx} value={typeOption}>{typeOption}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-danger mt-2"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}

              <button type="submit" className="btn btn-primary">
                Guardar Registro y Subir Archivos
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}





