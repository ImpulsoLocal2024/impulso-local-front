// PublicRecordCreate.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/PublicRecordCreate.css';

function Modal({ show, onClose, message, type }) {
  if (!show) return null;

  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: type === 'success' ? 'green' : 'red',
    color: 'white',
    padding: '20px',
    zIndex: 1000,
    borderRadius: '5px',
    maxWidth: '80%',
    maxHeight: '80%',
    overflowY: 'auto',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
        <button onClick={onClose} className="btn btn-light">
          Cerrar
        </button>
      </div>
    </>
  );
}

export default function PublicRecordCreate() {
  const { tableName } = useParams();
  const navigate = useNavigate();

  const [newRecord, setNewRecord] = useState({});
  const [fields, setFields] = useState([]);
  const [relatedData, setRelatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [fileList, setFileList] = useState([]);

  // Estados para validación
  const [fieldErrors, setFieldErrors] = useState({});
  const typingTimeoutRef = useRef({});

  // Estado para el checkbox de aceptación de términos
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState(''); // 'error' o 'success'

  const fileTypeOptions = [
    'Copia de documento de identidad por ambas caras',
    'Factura de servicio publico por ambas caras',
    'Evidencia de existencia de mínimo un año',
    'Registro Cámara de Comercio (Solo si aplica)',
    'RUT',
    'Certificación discapacidad expedida por Secretaria de Salud (Solo si aplica)',
    'Certificado de cuidador (Solo si aplica)',
    'Certificado de Población indígena (Solo si aplica)',
    'Certificación de RIVI (Solo si aplica)',
    'Antecedentes Policía',
    'Antecedentes Procuraduría',
    'Antecedentes Contraloría',
    'Otros',
  ];

  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  const fieldLabels = {
    [normalize('Nombres')]: 'Nombres',
    [normalize('Apellidos')]: 'Apellidos',
    [normalize('Tipo de identificacion')]: 'Tipo de identificación',
    [normalize('Numero de identificacion')]: 'Número de identificación',
    [normalize('Fecha de nacimiento')]: 'Fecha de nacimiento (DD/MM/AAAA)',
    [normalize('Edad')]: 'Edad',
    [normalize('Sexo')]: 'Sexo',
    [normalize('Telefono fijo')]: 'Teléfono fijo',
    [normalize('Celular')]: 'Celular',
    [normalize('Celular 2')]: 'Celular 2 (puede ser el de un familiar)',
    [normalize('Correo electronico')]: 'Correo electrónico',
    [normalize('Direccion')]: 'Dirección de residencia',
    [normalize('Barrio')]: 'Barrio de residencia',
    [normalize('Localidad de residencia')]: 'Localidad de residencia',
    [normalize('Nivel educativo del empresario')]:
      'Nivel educativo del emprendedor',
    [normalize('Presenta algun tipo de discapacidad')]:
      '¿Presenta algún tipo de discapacidad?',
    [normalize('Grupo etnico')]: 'Grupo étnico',
    [normalize('Es victima del conflicto armado')]:
      '¿Es víctima del conflicto armado?',
    [normalize('Es cuidador de alguna de las siguientes personas')]:
      '¿Es cuidador de alguna de las siguientes personas?',
    [normalize('Identidad de genero')]: 'Identidad de género',
    [normalize('Personas a cargo')]: 'Personas a cargo',
    [normalize('Nombre del emprendimiento')]: 'Nombre del emprendimiento',
    [normalize('Fecha de inicio actividad economica')]:
      'Fecha de inicio actividad económica',
    [normalize('Esta registrado y renovado ante la Camara de Comercio')]:
      '¿Su emprendimiento está registrada ante la Cámara de Comercio?',
    [normalize('Logro renovar la matricula del negocio a comienzos del 2023')]:
      '¿Logró renovar la matrícula del negocio a comienzos del 2024?',
    [normalize('Fecha de registro en Cámara de Comercio')]:
      'Fecha de registro en Cámara de Comercio (DD/MM/AAAA)',
    [normalize('NIT')]: 'NIT (sin dígito de verificación)',
    [normalize('Localidad de la unidad de negocio')]:
      'Localidad donde se encuentra en funcionamiento el emprendimiento',
    [normalize('Direccion de la unidad de negocio')]:
      'Dirección donde se desarrolla la actividad del emprendimiento (debe coincidir con el servicio público que va a adjuntar más adelante)',
    [normalize('En esta direccion tambien es su vivienda')]:
      '¿En esta dirección también es su vivienda?',
    [normalize('Barrio de la unidad de negocio')]: 'Barrio del emprendimiento',
    [normalize('Telefono fijo de la unidad de negocio')]:
      'Teléfono fijo del emprendimiento',
    [normalize('El negocio se encuentra ubicado en area')]:
      'El negocio se encuentra ubicado en área:',
    [normalize('Estrato socioeconomico de su unidad de negocio')]:
      'Estrato socioeconómico de su unidad de negocio',
    [normalize('Cuanto tiempo de funcionamiento tiene su emprendimiento')]:
      '¿Cuánto tiempo de funcionamiento tiene su emprendimiento?',
    [normalize('Vendedor informal o ambulante registrado en el HEMI con RIVI')]:
      '¿Usted es vendedor informal/ambulante registrado en el HEMI con RIVI de la localidad por la cual se postula?',
    [normalize('Cuantas personas trabajan directamente en el emprendimiento')]:
      '¿Cuántas personas trabajan directamente en su emprendimiento, incluyéndolo a usted?',
    [normalize('En que sector productivo se encuentra su emprendimiento')]:
      '¿En qué sector productivo se encuentra su emprendimiento?',
    [normalize('Cual es la oferta de productos o servicios de su negocio')]:
      '¿Cuál es la oferta de productos o servicios de su emprendimiento?',
    [normalize('Realiza actividades sostenibles y en proceso de reconversion')]:
      '¿Su emprendimiento realiza actividades sostenibles y en proceso de reconversión dirigidas al cuidado del medio ambiente?',
    [normalize('Actividad que Ud. Implementa sostenible y de reconversion')]:
      'Si su respuesta anterior fue Si - ¿Cuál es esa actividad que usted implementa que es sostenible y en proceso de reconversión dirigidas al cuidado del medio ambiente?',
    [normalize('Tiene acceso a internet y a un dispositivo')]:
      '¿Tiene acceso a internet y/o a un dispositivo que le permita acceder a las cápsulas de conocimiento?',
    [normalize('Cuenta con plan de datos en su celular')]:
      '¿Cuenta con plan de datos en su celular?',
    [normalize('Dispone de una cuenta bancaria o billetera electronica')]:
      '¿Dispone de una cuenta bancaria o algún servicio de billetera electrónica que le permita recibir el incentivo económico?',
    [normalize('Cual')]: '¿Cuál?',
    [normalize('Numero de clientes actuales')]: 'Número de clientes actuales',
    [normalize('Valor de ventas promedio mensual')]:
      'Valor de ventas promedio mensual',
    [normalize('Cuanto tiempo dispone para el proceso de formacion y PI')]:
      '¿De cuánto tiempo dispone para dedicarle al proceso de formación y realización del plan de inversión?',
    [normalize('Para la comercializacion de su producto utiliza canales como')]:
      'Para la comercialización de su producto utiliza canales como:',
    [normalize('El dueño del emprendimiento es funcionario publico')]:
      '¿El dueño del emprendimiento es funcionario público?',
  };

  const dateFields = new Set([
    normalize('Fecha de nacimiento'),
    normalize('Fecha de inicio actividad economica'),
    normalize('Fecha de registro en Cámara de Comercio'),
  ]);

  // Campos que deben aceptar solo números
  const numericFields = new Set([
    normalize('Edad'),
    normalize('NIT'),
    normalize('Valor de ventas promedio mensual'),
    normalize('Numero de clientes actuales'),
    normalize('Estrato socioeconomico de su unidad de negocio'),
  ]);

  useEffect(() => {
    const fetchFieldsData = async () => {
      try {
        const fieldsResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/fields`
        );

        // Excluir además el campo "Acepta terminos"
        const filteredFields = fieldsResponse.data.filter(
          (field) =>
            !['estado', 'asesor', 'id', 'acepta terminos'].includes(
              field.column_name.toLowerCase()
            )
        );
        setFields(filteredFields);

        const relatedDataResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/related-data`
        );
        setRelatedData(relatedDataResponse.data.relatedData || {});
        setLoading(false);
      } catch (error) {
        console.error('Error obteniendo los datos de los campos:', error);
        setModalMessage('Error obteniendo los datos de los campos');
        setModalType('error');
        setShowModal(true);
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

    // Si es un campo numérico, eliminar todo lo que no sea dígito
    if (numericFields.has(normalizedColumnName)) {
      newValue = newValue.replace(/\D/g, '');
    }

    setNewRecord({ ...newRecord, [name]: newValue });

    // Remover el error si el campo ya tiene valor
    if (newValue && newValue.trim() !== '') {
      setFieldErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validación en tiempo real para 'Numero de identificacion' y 'Correo electronico'
    if (name === 'Numero de identificacion' || name === 'Correo electronico') {
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
        setFieldErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: `${
            fieldLabels[normalize(fieldName)] || fieldName
          } ya está registrado.`,
        }));
      } else {
        setFieldErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error validando el campo:', error);
      // Establecer un error general para el usuario
      setModalMessage(
        'Error validando el campo. Por favor, inténtalo de nuevo más tarde.'
      );
      setModalType('error');
      setShowModal(true);
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

  const handleTermsChange = (e) => {
    setAcceptedTerms(e.target.checked);
    if (e.target.checked) {
      // Remover el error si los términos han sido aceptados
      setFieldErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors['acceptedTerms'];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Resetear estados de error
    setFieldErrors({});
    setModalMessage('');
    setModalType('');
    setShowModal(false);

    // Verificar si hay campos vacíos
    const emptyFields = {};
    fields.forEach((field) => {
      const fieldName = field.column_name;
      const value = newRecord[fieldName];
      if (!value || value.trim() === '') {
        emptyFields[fieldName] = `${
          fieldLabels[normalize(fieldName)] || fieldName
        } es obligatorio.`;
      }
    });

    if (Object.keys(emptyFields).length > 0) {
      setFieldErrors((prevErrors) => ({ ...prevErrors, ...emptyFields }));

      // Recopilar mensajes de error
      const errorMessages = Object.values(emptyFields).join('\n');
      setModalMessage(
        `Por favor, complete todos los campos obligatorios:\n${errorMessages}`
      );
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Verificar si hay errores de validación
    if (Object.keys(fieldErrors).length > 0) {
      // Recopilar mensajes de error
      const errorMessages = Object.values(fieldErrors).join('\n');
      setModalMessage(
        `Por favor, corrija los errores antes de enviar el formulario:\n${errorMessages}`
      );
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Verificar si los términos han sido aceptados
    if (!acceptedTerms) {
      setFieldErrors((prevErrors) => ({
        ...prevErrors,
        acceptedTerms: 'Por favor, acepte los términos y condiciones.',
      }));
      setModalMessage('Por favor, acepte los términos y condiciones.');
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Verificar que al menos un archivo haya sido adjuntado
    if (fileList.length === 0) {
      setModalMessage(
        'Debe adjuntar al menos un archivo que cumpla con los requerimientos.'
      );
      setModalType('error');
      setShowModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Agregar el campo "Acepta terminos" al newRecord
      const recordToSubmit = {
        ...newRecord,
        'Acepta terminos': true, // Siempre será true aquí, ya que se verifica antes
      };

      const recordResponse = await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/${tableName}/record/create`,
        recordToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdRecordId =
        recordResponse.data?.record?.id || recordResponse.data?.id;

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

      // Obtener la fecha y hora actuales
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
      const year = currentDate.getFullYear();
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');

      // Construir el mensaje de éxito
      const successMessage = `Ya logró el primer paso para ser parte del programa Impulso Local.
Su registro ha quedado grabado en la base de datos de la plataforma con el número ${createdRecordId} y su fecha de registro es día (${day})-mes (${month})–año (${year})- hora (${hours}:${minutes}).
Pronto un asesor se comunicará con Ud. mediante los canales de comunicación que proporcionó, para indicarle si la información y los archivos que cargó en su inscripción cumplen con los requisitos del programa.
Por favor, estar atento(a) a los datos de contacto que suministró.`;

      setModalMessage(successMessage);
      setModalType('success');
      setShowModal(true);

      setTimeout(() => {
        navigate(`/table/${tableName}`);
      }, 4000);
    } catch (error) {
      console.error('Error creando el registro o subiendo los archivos:', error);
      setModalMessage('Error creando el registro o subiendo los archivos');
      setModalType('error');
      setShowModal(true);
    }
  };

  // Función para renderizar los campos con los textos adicionales
  const renderFields = () => {
    const elements = [];
    let personalDataTextInserted = false;
    let businessInfoTextInserted = false;

    fields.forEach((field) => {
      const normalizedColumnName = normalize(field.column_name);

      if (
        !personalDataTextInserted &&
        normalizedColumnName === normalize('Nombres')
      ) {
        elements.push(
          <p key="personal-data-intro">
            A continuación usted debe proporcionar sus datos personales
          </p>
        );
        personalDataTextInserted = true;
      }

      if (
        !businessInfoTextInserted &&
        normalizedColumnName === normalize('Nombre del emprendimiento')
      ) {
        elements.push(
          <p key="business-info-intro">
            A continuación, deberá describir la información correspondiente a su
            emprendimiento
          </p>
        );
        businessInfoTextInserted = true;
      }

      // Excluir el campo "Acepta terminos"
      if (normalizedColumnName === normalize('acepta terminos')) {
        return;
      }

      elements.push(
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
                type={
                  dateFields.has(normalizedColumnName)
                    ? 'date'
                    : numericFields.has(normalizedColumnName)
                    ? 'number'
                    : 'text'
                }
                name={field.column_name}
                value={
                  dateFields.has(normalizedColumnName) &&
                  newRecord[field.column_name]
                    ? newRecord[field.column_name].split('/').reverse().join('-')
                    : newRecord[field.column_name] || ''
                }
                onChange={handleChange}
                className="form-control"
              />
            </>
          )}
          {fieldErrors[field.column_name] && (
            <div className="text-danger">{fieldErrors[field.column_name]}</div>
          )}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="container-fluid d-flex">
      <aside className="sidebar-public bg-red">
        <h2>Inscripción</h2>
      </aside>
      <main className="form-wrapper">
        <section className="form-header">
          <h1>Nuevo Registro</h1>
        </section>
        <section className="form-content">
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <form onSubmit={handleSubmit} className="custom-form">
              {renderFields()}

              {/* Checkbox de aceptación de términos */}
              <div className="form-group">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="acceptedTerms"
                    checked={acceptedTerms}
                    onChange={handleTermsChange}
                  />
                  <label className="form-check-label" htmlFor="acceptedTerms">
                    Acepto los{' '}
                    <a
                      href="https://il30.propais.org.co/terminos-y-condiciones"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      compromisos, términos y condiciones
                    </a>{' '}
                    y la{' '}
                    <a
                      href="https://propais.org.co/politica-de-privacidad-uso-de-datos-personales/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      política de tratamiento de datos personales
                    </a>
                    .
                  </label>
                </div>
                {fieldErrors['acceptedTerms'] && (
                  <div className="text-danger">{fieldErrors['acceptedTerms']}</div>
                )}
              </div>

              {/* Texto adicional después del checkbox */}
              <p>
                Según lo que usted haya indicado en el formulario de inscripción,
                debe cargar los siguientes documentos
              </p>

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
                      <option key={idx} value={typeOption}>
                        {typeOption}
                      </option>
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
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
}





