import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

// Define initialQuestions fuera del componente para evitar redefiniciones
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

export default function DiagnosticoTab({ id }) {
  // Mapeo: pregunta => códigos que se activan si la respuesta da puntaje 0
  const questionToCodesMapping = {
    "¿Están separadas sus finanzas personales de las de su negocio?": ["229"],
    "¿Lleva registros de ingresos y gastos de su empresa periódicamente?": ["230", "228", "226"],
    "¿Ha calculado y registrado sus costos de producción, ventas y administración?": ["230", "228"],
    "¿Los ingresos por ventas alcanzan a cubrir sus gastos y costos operativos?": ["230", "228"],
    "¿Cuenta con el inventario suficiente de productos para atender la demanda de sus clientes?": ["230", "225"],
    "¿Maneja un control de inventarios para los bienes que comercializa o productos que fabrica incluyendo sus materias primas e insumos?": ["230", "225"],
    "¿Considera que debe fortalecer las habilidades para el manejo del talento humano en su empresa?": ["230", "224"],
    "¿Ha desarrollado estrategias para conseguir nuevos clientes?": ["227", "234"],
    "¿Ha analizado sus productos/servicios con relación a su competencia?": ["227"],
    "¿Mis productos/servicios tienen ventas permanentes?": ["227", "234"],
    "¿Ha perdido alguna oportunidad de negocio o venta a causa del servicio al cliente?": ["227"],
    "¿Ha realizado ventas por internet?": ["224"],
    "¿Conoce cómo desarrollar la venta de sus productos/servicios por internet?": ["224"],
    "¿Cuenta con equipos de cómputo?": ["224"],
    "¿Cuenta con página web?": ["224"],
    "¿Cuenta con red social Facebook?": ["224"],
    "¿Cuenta con red social Instagram?": ["224"],
    "¿Cuenta con red social TikTok?": ["224"],
    "¿Su empresa cuenta con acceso a créditos o servicios financieros para su apalancamiento?": ["233", "232"],
    "¿Su empresa aplica medidas con enfoque ambiental: ejemplo ahorro de agua, energía, recuperación de residuos, reutilización de desechos, etc.?": ["231"],
  };

  const [answers, setAnswers] = useState({});
  const [recordIds, setRecordIds] = useState({});
  const [loading, setLoading] = useState(true);

  // Historial
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Determina si la pregunta es invertida
  const isInvertedQuestion = (questionText) => {
    const trimmed = questionText.trim();
    return (
      trimmed ===
        "¿Considera que debe fortalecer las habilidades para el manejo del talento humano en su empresa?" ||
      trimmed ===
        "¿Ha perdido alguna oportunidad de negocio o venta a causa del servicio al cliente?"
    );
  };

  // Calcula puntaje según la pregunta
  const getScoreFromState = (question) => {
    const trimmed = question.text.trim();
    const currentValue = answers[trimmed];
    if (isInvertedQuestion(trimmed)) {
      // invertida: true => 0, false => 1
      return currentValue ? 0 : 1;
    } else {
      // normal: true => 1, false => 0
      return currentValue ? 1 : 0;
    }
  };

  // Validar los datos antes de enviar
  const validateRequestData = (data) => {
    if (!data.caracterizacion_id) return false;
    if (!data.Componente) return false;
    if (!data.Pregunta) return false;
    if (typeof data.Respuesta !== 'boolean') return false;
    if (typeof data.Puntaje !== 'number') return false;
    if (!data.user_id) return false;
    if (!data.field) return false; // Añadido 'field'
    return true;
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

        console.log("Datos recibidos del backend:", response.data);

        const records = response.data.reduce(
          (acc, record) => {
            const pregunta = record.Pregunta.trim();
            acc.answers[pregunta] = record.Respuesta;
            acc.recordIds[pregunta] = record.id;
            return acc;
          },
          { answers: {}, recordIds: {} }
        );

        console.log("Respuestas Cargadas:", records.answers);
        console.log("IDs de Registros:", records.recordIds);

        setAnswers(records.answers);
        setRecordIds(records.recordIds);

        // Validar que todas las preguntas tienen una respuesta
        const preguntasSinRespuesta = initialQuestions
          .flatMap(section => section.questions)
          .filter(question => !(question.text.trim() in records.answers));

        if (preguntasSinRespuesta.length > 0) {
          console.warn("Preguntas sin respuestas cargadas:", preguntasSinRespuesta.map(q => q.text));
        } else {
          console.log("Todas las preguntas han sido cargadas con respuestas.");
        }

      } catch (error) {
        console.error("Error obteniendo registros existentes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingRecords();
  }, [id]); // Sólo depende de 'id' ahora

  const handleAnswerChange = (questionText, value) => {
    setAnswers((prev) => ({ ...prev, [questionText.trim()]: value }));
  };

  // Calcula promedio de cada componente
  const calculateAverage = (questions) => {
    const totalScore = questions.reduce((sum, q) => sum + getScoreFromState(q), 0);
    return (totalScore / questions.length).toFixed(2);
  };

  // Guardar Diagnóstico y recommended_codes
  const handleSubmit = async () => {
    // Validar que todas las preguntas han sido respondidas
    const unansweredQuestions = initialQuestions
      .flatMap(section => section.questions)
      .filter(question => answers[question.text.trim()] === undefined);

    if (unansweredQuestions.length > 0) {
      const preguntas = unansweredQuestions.map(q => `"${q.text}"`).join(", ");
      alert(`Por favor, responde todas las preguntas antes de guardar. Preguntas faltantes: ${preguntas}`);
      return;
    }

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
          const questionText = question.text.trim();
          const currentAnswer =
            answers[questionText] === undefined ? false : answers[questionText];

          const puntaje = isInvertedQuestion(questionText)
            ? currentAnswer
              ? 0
              : 1
            : currentAnswer
            ? 1
            : 0;

          const requestData = {
            caracterizacion_id: id,
            Componente: section.component,
            Pregunta: questionText,
            Respuesta: currentAnswer,
            Puntaje: puntaje,
            user_id: userId,
            field: question.field, // Añadido 'field'
          };

          if (!validateRequestData(requestData)) {
            console.error(`Datos inválidos para la pregunta: "${questionText}"`, requestData);
            continue; // O manejar de otra manera
          }

          console.log(`Enviando datos para la pregunta: "${questionText}"`, requestData);

          if (newRecordIds[questionText]) {
            // update
            const updatePromise = axios
              .put(
                `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/record/${newRecordIds[questionText]}`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then((response) => {
                console.log(`Registro Actualizado para "${questionText}":`, response.data);
              })
              .catch((error) => {
                console.error(`Error actualizando el registro para "${questionText}":`, error);
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
                console.log(`Registro Creado para "${questionText}":`, response.data);
                if (response.data.record && response.data.record.id) { // Modificación aquí
                  newRecordIds[questionText] = response.data.record.id;
                } else {
                  console.error(`No se recibió el ID para la pregunta: "${questionText}"`);
                }
              })
              .catch((error) => {
                console.error(`Error creando el registro para "${questionText}":`, error);
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
          const questionText = question.text.trim();
          const score = getScoreFromState(question);
          if (score === 0) {
            if (questionToCodesMapping[questionText]) {
              questionToCodesMapping[questionText].forEach((code) => {
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
      alert("Hubo un error al guardar el diagnóstico");
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
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No se encontró el token de autenticación al recargar registros");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Datos recibidos del backend al recargar:", response.data);

      const records = response.data.reduce(
        (acc, record) => {
          const pregunta = record.Pregunta.trim();
          acc.answers[pregunta] = record.Respuesta;
          acc.recordIds[pregunta] = record.id;
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
    } finally {
      setLoading(false);
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
                    <tr key={question.text}>
                      {index === 0 && (
                        <td rowSpan={section.questions.length}>
                          {section.component}
                        </td>
                      )}
                      <td>{question.text}</td>
                      <td>
                        <input
                          type="radio"
                          name={question.text}
                          checked={answers[question.text.trim()] === true}
                          onChange={() =>
                            handleAnswerChange(question.text, true)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={question.text}
                          checked={answers[question.text.trim()] === false}
                          onChange={() =>
                            handleAnswerChange(question.text, false)
                          }
                        />
                      </td>
                      <td>{getScoreFromState(question)}</td>
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


