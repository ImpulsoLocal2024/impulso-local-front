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

  // Función para normalizar los nombres de los campos
  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD") // Normaliza los caracteres unicode
      .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
      .replace(/[^a-z0-9]/g, '_') // Reemplaza caracteres especiales por guiones bajos
      .replace(/_+/g, '_') // Reemplaza múltiples guiones bajos por uno solo
      .trim();
  };

  // Mapeo de nombres personalizados para los campos
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
        console.error('Error obteniendo los datos de los campos:', error);
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
              {fields.map((field) => {
                const normalizedColumnName = normalize(field.column_name);

                // Excluir el campo 'id' por si acaso
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
                      <input
                        type="text"
                        name={field.column_name}
                        value={newRecord[field.column_name] || ''}
                        onChange={handleChange}
                        className="form-control"
                      />
                    )}
                  </div>
                );
              })}

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





