import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function DiagnosticoTab({ id }) {
  const initialQuestions = [
    {
      component: "Conectándome con mi negocio",
      questions: [
        {
          text: "¿Están separadas sus finanzas personales de las de su negocio?",
          field: "finanzas_separadas",
        },
        {
          text: "¿Lleva registros de ingresos y gastos de su empresa periódicamente?",
          field: "registros_ingresos_gastos",
        },
        {
          text: "¿Ha calculado y registrado sus costos de producción, ventas y administración?",
          field: "costos_registrados",
        },
        {
          text: "¿Los ingresos por ventas alcanzan a cubrir sus gastos y costos operativos?",
          field: "ingresos_cubren_costos",
        },
        {
          text: "¿Cuenta con el inventario suficiente de productos para atender la demanda de sus clientes?",
          field: "inventario_suficiente",
        },
        {
          text: "¿Maneja un control de inventarios para los bienes que comercializa o productos que fabrica incluyendo sus materias primas e insumos?",
          field: "control_inventarios",
        },
        {
          text: "¿Considera que debe fortalecer las habilidades para el manejo del talento humano en su empresa?",
          field: "fortalecer_talento_humano",
        },
      ],
    },
    {
      component: "Conectándome con mi mercado",
      questions: [
        {
          text: "¿Ha desarrollado estrategias para conseguir nuevos clientes?",
          field: "estrategias_nuevos_clientes",
        },
        {
          text: "¿Ha analizado sus productos/servicios con relación a su competencia?",
          field: "productos_vs_competencia",
        },
        {
          text: "¿Mis productos/servicios tienen ventas permanentes?",
          field: "ventas_permanentes",
        },
        {
          text: "¿Ha perdido alguna oportunidad de negocio o venta a causa del servicio al cliente?",
          field: "oportunidades_perdidas",
        },
      ],
    },
    {
      component: "Conexiones digitales",
      questions: [
        { text: "¿Ha realizado ventas por internet?", field: "ventas_internet" },
        {
          text: "¿Conoce cómo desarrollar la venta de sus productos/servicios por internet?",
          field: "desarrollo_ventas_online",
        },
        { text: "¿Cuenta con equipos de cómputo?", field: "equipos_computo" },
        { text: "¿Cuenta con página web?", field: "pagina_web" },
        { text: "¿Cuenta con red social Facebook?", field: "facebook" },
        { text: "¿Cuenta con red social Instagram?", field: "instagram" },
        { text: "¿Cuenta con red social TikTok?", field: "tiktok" },
      ],
    },
    {
      component: "Alístate para crecer",
      questions: [
        {
          text: "¿Su empresa cuenta con acceso a créditos o servicios financieros para su apalancamiento?",
          field: "acceso_creditos",
        },
      ],
    },
    {
      component: "Conectándome con el ambiente",
      questions: [
        {
          text: "¿Su empresa aplica medidas con enfoque ambiental: ejemplo ahorro de agua, energía, recuperación de residuos, reutilización de desechos, etc.?",
          field: "enfoque_ambiental",
        },
      ],
    },
  ];

  // Mapeo: campo => códigos que se activan si la respuesta da puntaje 0
  const questionToCodesMapping = {
    finanzas_separadas: ["229"],
    registros_ingresos_gastos: ["230", "228", "226"],
    costos_registrados: ["230", "228"],
    ingresos_cubren_costos: ["230", "228"],
    inventario_suficiente: ["230", "225"],
    control_inventarios: ["230", "225"],
    fortalecer_talento_humano: ["230", "224"],
    estrategias_nuevos_clientes: ["227", "234"],
    productos_vs_competencia: ["227"],
    ventas_permanentes: ["227", "234"],
    oportunidades_perdidas: ["227"],
    ventas_internet: ["224"],
    desarrollo_ventas_online: ["224"],
    equipos_computo: ["224"],
    pagina_web: ["224"],
    facebook: ["224"],
    instagram: ["224"],
    tiktok: ["224"],
    acceso_creditos: ["233", "232"],
    enfoque_ambiental: ["231"],
  };

  // Mapeo de Pregunta a Field
  const questionTextToFieldMapping = initialQuestions.reduce((acc, section) => {
    section.questions.forEach((q) => {
      acc[q.text.trim()] = q.field;
    });
    return acc;
  }, {});

  const [answers, setAnswers] = useState({});
  const [recordIds, setRecordIds] = useState({});
  const [loading, setLoading] = useState(true);

  // Historial
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Determina si la pregunta es invertida
  const isInvertedQuestion = (field) => {
    return (
      field === "fortalecer_talento_humano" ||
      field === "oportunidades_perdidas"
    );
  };

  // Calcula puntaje según la pregunta
  const getScoreFromState = (field) => {
    const currentValue = answers[field];
    if (isInvertedQuestion(field)) {
      // invertida: true => 0, false => 1
      return currentValue ? 0 : 1;
    } else {
      // normal: true => 1, false => 0
      return currentValue ? 1 : 0;
    }
  };

  // Cargar respuestas actuales de Diagnóstico
  useEffect(() => {
    const fetchExistingRecords = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const records = response.data.reduce(
          (acc, record) => {
            const pregunta = record.Pregunta.trim();
            const field = questionTextToFieldMapping[pregunta];
            if (field) {
              acc.answers[field] = record.Respuesta;
              acc.recordIds[field] = record.id;
            } else {
              console.warn(`No se encontró el campo para la pregunta: "${pregunta}"`);
            }
            return acc;
          },
          { answers: {}, recordIds: {} }
        );

        console.log("Respuestas Cargadas:", records.answers);
        console.log("IDs de Registros:", records.recordIds);

        setAnswers(records.answers);
        setRecordIds(records.recordIds);
      } catch (error) {
        console.error("Error obteniendo registros existentes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingRecords();
  }, [id, questionTextToFieldMapping]);

  const handleAnswerChange = (field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  // Calcula promedio de cada componente
  const calculateAverage = (questions) => {
    const totalScore = questions.reduce((sum, q) => sum + getScoreFromState(q.field), 0);
    return (totalScore / questions.length).toFixed(2);
  };

  // Guardar Diagnóstico y recommended_codes
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }
      const userId = localStorage.getItem("id");
      const requestPromises = [];
      const newRecordIds = { ...recordIds };

      // 1) Guardar/actualizar Diagnóstico (pi_diagnostico_cap)
      for (const section of initialQuestions) {
        for (const question of section.questions) {
          const field = question.field;
          const currentAnswer =
            answers[field] === undefined
              ? false
              : answers[field];

          const puntaje = isInvertedQuestion(field)
            ? currentAnswer
              ? 0
              : 1
            : currentAnswer
            ? 1
            : 0;

          const requestData = {
            caracterizacion_id: id,
            Componente: section.component,
            Pregunta: question.text.trim(),
            Respuesta: currentAnswer,
            Puntaje: puntaje,
            user_id: userId,
            field: field, // Asegúrate de incluir el 'field' si es necesario en el backend
          };

          console.log("Enviando Datos:", requestData);

          if (newRecordIds[field]) {
            // update
            const updatePromise = axios.put(
              `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/record/${newRecordIds[field]}`,
              requestData,
              { headers: { Authorization: `Bearer ${token}` } }
            ).then(response => {
              console.log(`Registro Actualizado para ${field}:`, response.data);
            }).catch(error => {
              console.error(`Error actualizando el registro para ${field}:`, error);
            });
            requestPromises.push(updatePromise);
          } else {
            // create
            const createPromise = axios
              .post(
                `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/record`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then((response) => {
                console.log(`Registro Creado para ${field}:`, response.data);
                newRecordIds[field] = response.data.id;
              })
              .catch(error => {
                console.error(`Error creando el registro para ${field}:`, error);
              });
            requestPromises.push(createPromise);
          }
        }
      }

      await Promise.all(requestPromises);
      setRecordIds(newRecordIds);

      // 2) Calcular los códigos recomendados (puntaje 0)
      const triggeredCodes = [];
      for (const section of initialQuestions) {
        for (const question of section.questions) {
          const field = question.field;
          const score = getScoreFromState(field);
          if (score === 0) {
            if (questionToCodesMapping[field]) {
              questionToCodesMapping[field].forEach((code) => {
                if (!triggeredCodes.includes(code)) {
                  triggeredCodes.push(code);
                }
              });
            }
          }
        }
      }

      console.log("Códigos Activados:", triggeredCodes);

      // 3) Guardar recommended_codes en pi_capacitacion
      await upsertRecommendedCodes(token, id, userId, triggeredCodes);

      alert("Diagnóstico guardado exitosamente");

      // Recargar los registros para sincronizar el estado
      await fetchExistingRecords();
    } catch (error) {
      console.error("Error guardando el diagnóstico:", error);
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error("Datos de Respuesta:", error.response.data);
        alert(`Error: ${error.response.data.message || "Hubo un error al guardar el diagnóstico"}`);
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error("Solicitud sin respuesta:", error.request);
        alert("Error: No se recibió respuesta del servidor");
      } else {
        // Algo sucedió al configurar la solicitud
        console.error("Error al configurar la solicitud:", error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };

  // upsert: serializamos a texto JSON
  const upsertRecommendedCodes = async (token, caracterizacion_id, userId, codesArray) => {
    try {
      const resGet = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/records?caracterizacion_id=${caracterizacion_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Convertimos a string
      const codesString = JSON.stringify(codesArray);

      if (!resGet.data || resGet.data.length === 0) {
        // crear
        const newRecord = {
          caracterizacion_id,
          user_id: userId,
          recommended_codes: codesString,
        };
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record`,
          newRecord,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Códigos Recomendados Creado:", createResponse.data);
      } else {
        // actualizar
        const existing = resGet.data[0];
        const recordId = existing.id;

        const updatedRecord = {
          ...existing,
          user_id: userId,
          recommended_codes: codesString,
        };
        const updateResponse = await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_capacitacion/record/${recordId}`,
          updatedRecord,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Códigos Recomendados Actualizado:", updateResponse.data);
      }
    } catch (error) {
      console.error("Error en upsertRecommendedCodes:", error);
      alert("Hubo un error al guardar los códigos recomendados.");
    }
  };

  // Función para recargar registros existentes
  const fetchExistingRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No se encontró el token de autenticación al recargar registros");
        return;
      }

      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const records = response.data.reduce(
        (acc, record) => {
          const pregunta = record.Pregunta.trim();
          const field = questionTextToFieldMapping[pregunta];
          if (field) {
            acc.answers[field] = record.Respuesta;
            acc.recordIds[field] = record.id;
          } else {
            console.warn(`No se encontró el campo para la pregunta: "${pregunta}"`);
          }
          return acc;
        },
        { answers: {}, recordIds: {} }
      );

      console.log("Respuestas Cargadas después de recargar:", records.answers);
      console.log("IDs de Registros después de recargar:", records.recordIds);

      setAnswers(records.answers);
      setRecordIds(records.recordIds);
    } catch (error) {
      console.error("Error recargando registros existentes:", error);
    }
  };

  // Historial de cambios del Diagnóstico
  const fetchAllRecordsHistory = async () => {
    if (Object.keys(recordIds).length === 0) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = localStorage.getItem("token");
      const recordIdValues = Object.values(recordIds);

      const historyPromises = recordIdValues.map((rid) =>
        axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_diagnostico_cap/record/${rid}/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      );

      const historyResponses = await Promise.all(historyPromises);
      let combinedHistory = [];
      historyResponses.forEach((response) => {
        if (response.data.history && Array.isArray(response.data.history)) {
          combinedHistory = combinedHistory.concat(response.data.history);
        }
      });

      combinedHistory.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setHistory(combinedHistory);
      setHistoryLoading(false);
    } catch (error) {
      console.error("Error obteniendo el historial:", error);
      setHistoryError("Error obteniendo el historial");
      setHistoryLoading(false);
    }
  };

  const handleOpenHistoryModal = async () => {
    await fetchAllRecordsHistory();
    setShowHistoryModal(true);
  };

  return (
    <div>
      <h3>Diagnóstico</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Componente</th>
                <th>Pregunta</th>
                <th>Sí</th>
                <th>No</th>
                <th>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {initialQuestions.map((section) => (
                <React.Fragment key={section.component}>
                  {section.questions.map((question, index) => (
                    <tr key={question.field}>
                      {index === 0 && (
                        <td rowSpan={section.questions.length}>
                          {section.component}
                        </td>
                      )}
                      <td>{question.text}</td>
                      <td>
                        <input
                          type="radio"
                          name={question.field}
                          checked={answers[question.field] === true}
                          onChange={() =>
                            handleAnswerChange(question.field, true)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={question.field}
                          checked={answers[question.field] === false}
                          onChange={() =>
                            handleAnswerChange(question.field, false)
                          }
                        />
                      </td>
                      <td>{getScoreFromState(question.field)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="4" className="text-end">
                      Promedio del componente:
                    </td>
                    <td>{calculateAverage(section.questions)}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <button className="btn btn-primary" onClick={handleSubmit}>
            Guardar
          </button>

          {Object.keys(recordIds).length > 0 && (
            <button
              type="button"
              className="btn btn-info btn-sm mt-3 ml-2"
              onClick={handleOpenHistoryModal}
            >
              Ver Historial de Cambios
            </button>
          )}
        </>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg" style={{ maxWidth: "90%" }} role="document">
            <div
              className="modal-content"
              style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
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
              <div className="modal-body" style={{ overflowY: "auto" }}>
                {historyError && (
                  <div className="alert alert-danger">{historyError}</div>
                )}
                {historyLoading ? (
                  <div>Cargando historial...</div>
                ) : history.length > 0 ? (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
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
                            <td>{item.field_name || "-"}</td>
                            <td>{item.old_value !== null ? item.old_value.toString() : "-"}</td>
                            <td>{item.new_value !== null ? item.new_value.toString() : "-"}</td>
                            <td>{item.description || "-"}</td>
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

DiagnosticoTab.propTypes = {
  id: PropTypes.string.isRequired,
};


