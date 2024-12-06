import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function DiagnosticoTab({ id }) {
  const initialQuestions = [
    {
      component: "Conectándome con mi negocio",
      questions: [
        { text: "¿Están separadas sus finanzas personales de las de su negocio?", field: "finanzas_separadas" },
        { text: "¿Lleva registros de ingresos y gastos de su empresa periódicamente?", field: "registros_ingresos_gastos" },
        { text: "¿Ha calculado y registrado sus costos de producción, ventas y administración?", field: "costos_registrados" },
        { text: "¿Los ingresos por ventas alcanzan a cubrir sus gastos y costos operativos?", field: "ingresos_cubren_costos" },
        { text: "¿Cuenta con el inventario suficiente de productos para atender la demanda de sus clientes?", field: "inventario_suficiente" },
        { text: "¿Maneja un control de inventarios para los bienes que comercializa o productos que fabrica incluyendo sus materias primas e insumos?", field: "control_inventarios" },
        { text: "¿Considera que debe fortalecer las habilidades para el manejo del talento humano en su empresa?", field: "fortalecer_talento_humano" },
      ],
    },
    {
      component: "Conectándome con mi mercado",
      questions: [
        { text: "¿Ha desarrollado estrategias para conseguir nuevos clientes?", field: "estrategias_nuevos_clientes" },
        { text: "¿Ha analizado sus productos/servicios con relación a su competencia?", field: "productos_vs_competencia" },
        { text: "¿Mis productos/servicios tienen ventas permanentes?", field: "ventas_permanentes" },
        { text: "¿Ha perdido alguna oportunidad de negocio o venta a causa del servicio al cliente?", field: "oportunidades_perdidas" },
      ],
    },
    {
      component: "Conexiones digitales",
      questions: [
        { text: "¿Ha realizado ventas por internet?", field: "ventas_internet" },
        { text: "¿Conoce cómo desarrollar la venta de sus productos/servicios por internet?", field: "desarrollo_ventas_online" },
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
        { text: "¿Su empresa cuenta con acceso a créditos o servicios financieros para su apalancamiento?", field: "acceso_creditos" },
      ],
    },
    {
      component: "Conectándome con el ambiente",
      questions: [
        { text: "¿Su empresa aplica medidas con enfoque ambiental: ejemplo ahorro de agua, energía, recuperación de residuos, reutilización de desechos, etc.?", field: "enfoque_ambiental" },
      ],
    },
  ];

  const [answers, setAnswers] = useState({});
  const [recordIds, setRecordIds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExistingRecords = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const records = response.data.reduce(
          (acc, record) => {
            acc.answers[record.Pregunta.trim()] = record.Respuesta;
            acc.recordIds[record.Pregunta.trim()] = record.id;
            return acc;
          },
          { answers: {}, recordIds: {} }
        );

        setAnswers(records.answers);
        setRecordIds(records.recordIds);
      } catch (error) {
        console.error("Error obteniendo registros existentes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingRecords();
  }, [id]);

  const handleAnswerChange = (questionText, value) => {
    setAnswers((prev) => ({ ...prev, [questionText]: value }));
  };

  const calculateAverage = (questions) => {
    const totalScore = questions.reduce((sum, q) => sum + (answers[q.text.trim()] ? 1 : 0), 0);
    return (totalScore / questions.length).toFixed(2);
  };

  const saveRecord = async (token, requestData, questionText) => {
    try {
      if (recordIds[questionText]) {
        // Actualizar registro existente
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/record/${recordIds[questionText]}`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Crear nuevo registro
        const response = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico_cap/record`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Guardar el nuevo ID en recordIds
        setRecordIds((prev) => ({ ...prev, [questionText]: response.data.id }));
      }
    } catch (error) {
      console.error(`Error guardando la pregunta "${questionText}":`, error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      for (const section of initialQuestions) {
        for (const question of section.questions) {
          const requestData = {
            caracterizacion_id: id,
            Componente: section.component,
            Pregunta: question.text,
            Respuesta: answers[question.text],
            Puntaje: answers[question.text] ? 1 : 0,
          };

          await saveRecord(token, requestData, question.text);
        }
      }

      alert("Diagnóstico guardado exitosamente");
    } catch (error) {
      console.error("Error guardando el diagnóstico:", error);
      alert("Hubo un error al guardar el diagnóstico");
    }
  };

  return (
    <div>
      <h3>Diagnóstico</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
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
                        checked={answers[question.text] === true}
                        onChange={() => handleAnswerChange(question.text, true)}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={question.text}
                        checked={answers[question.text] === false}
                        onChange={() => handleAnswerChange(question.text, false)}
                      />
                    </td>
                    <td>{answers[question.text] ? 1 : 0}</td>
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
      )}
      <button className="btn btn-primary" onClick={handleSubmit}>
        Guardar
      </button>
    </div>
  );
}

DiagnosticoTab.propTypes = {
  id: PropTypes.string.isRequired,
};

