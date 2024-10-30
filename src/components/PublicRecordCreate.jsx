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
    "nombres": "Nombres",
    "apellidos": "Apellidos",
    "tipo_de_identificacion": "Tipo de identificación",
    "numero_de_identificacion": "Número de identificación",
    "fecha_de_nacimiento": "Fecha de nacimiento (DD/MM/AAAA)",
    "edad": "Edad",
    "sexo": "Sexo",
    "telefono_fijo": "Teléfono fijo",
    "celular": "Celular",
    "celular_2": "Celular 2 (puede ser el de un familiar)",
    "correo_electronico": "Correo electrónico",
    "direccion": "Dirección de residencia",
    "barrio": "Barrio de residencia",
    "localidad_de_residencia": "Localidad de residencia",
    "nivel_educativo_del_empresario": "Nivel educativo del empresario",
    "presenta_algun_tipo_de_discapacidad": "¿Presenta algún tipo de discapacidad?",
    "grupo_etnico": "Grupo étnico",
    "es_victima_del_conflicto_armado": "¿Es víctima del conflicto armado?",
    "es_cuidador_de_alguien": "¿Es cuidador de alguna de las siguientes personas?",
    "identidad_de_genero": "Identidad de género",
    "personas_a_cargo": "Personas a cargo",
    "nombre_del_emprendimiento": "Nombre de la unidad de negocio",
    "fecha_de_inicio_actividad_economica": "Fecha de inicio actividad económica",
    "esta_registrado_y_renovado_ante_la_camara_de_comercio": "¿Su unidad de negocio está registrado ante la Cámara de Comercio?",
    "logro_renovar_la_matricula_del_negocio_a_comienzos_del_2023": "¿Logró renovar la matrícula del negocio a comienzos del  2024?",
    "fecha_de_registro_en_camara_de_comercio": "Fecha de registro en Cámara de Comercio (DD/MM/AAAA)",
    "nit": "NIT (sin dígito de verificación)",
    "localidad_de_la_unidad_de_negocio": "Localidad de la unidad de negocio",
    "direccion_de_la_unidad_de_negocio": "Dirección en donde se desarrolla la actividad de la unidad de negocio (debe coincidir con el servicio público que va a adjuntar más adelante)",
    "es_tambien_su_vivienda": "¿En esta dirección también es su vivienda?",
    "barrio_de_la_unidad_de_negocio": "Barrio de la unidad de negocio",
    "telefono_fijo_de_la_unidad_de_negocio": "Teléfono fijo de la unidad de negocio",
    "area_del_negocio": "¿El negocio se encuentra ubicado en área?",
    "estrato_socioeconomico": "Estrato socioeconómico de su unidad de negocio",
    "tiempo_de_funcionamiento": "¿Cuánto tiempo de funcionamiento tiene su unidad de negocio?",
    "es_vendedor_informal_o_ambulante": "¿Usted es vendedor informal/ambulante registrado en el HEMI con RIVI de la localidad por la cual usted se postula?",
    "personas_en_el_emprendimiento": "¿Cuántas personas trabajan directamente en su unidad de negocio, incluyéndolo a usted?",
    "sector_productivo": "¿En qué sector productivo se encuentra su unidad de negocio?",
    "oferta_productos_o_servicios": "¿Cuál es la oferta de productos o servicios de su unidad de negocio?",
    "actividades_sostenibles": "¿Su unidad de negocio realiza actividades sostenibles y en proceso de reconversión dirigidas al cuidado del medio ambiente?",
    "actividad_implementada": "¿Cuál es esa actividad que Ud. implementa que es sostenible y en proceso de reconversión dirigidas al cuidado del medio ambiente?",
    "acceso_a_internet": "¿Tiene acceso a internet y/o a un dispositivo que le permita acceder a las cápsulas de conocimiento?",
    "plan_datos_celular": "¿Cuenta con plan de datos en su celular?",
    "cuenta_bancaria": "¿Dispone de una cuenta bancaria o algún servicio de billetera electrónica que le permita recibir el incentivo económico?",
    "cual": "¿Cuál?",
    "clientes_actuales": "Número de clientes actuales",
    "ventas_promedio_mensual": "Valor de ventas promedio mensual",
    "tiempo_para_formacion": "¿De cuánto tiempo dispone para dedicarle al proceso de formación y realización del plan de inversión?",
    "canales_comercializacion": "Para la comercialización de su producto utiliza canales como:",
    "funcionario_publico": "¿El dueño del emprendimiento es funcionario público?"
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





