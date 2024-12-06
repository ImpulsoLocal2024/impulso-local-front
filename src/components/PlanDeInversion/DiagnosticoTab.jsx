import React, { useState } from 'react';
import PropTypes from 'prop-types';

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

  const [answers, setAnswers] = useState(() =>
    initialQuestions.reduce((acc, section) => {
      section.questions.forEach((q) => {
        acc[q.field] = null; // null indica que aún no se ha respondido
      });
      return acc;
    }, {})
  );

  const handleAnswerChange = (field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico/record`,
        { caracterizacion_id: id, ...answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Diagnóstico guardado exitosamente");
    } catch (error) {
      console.error("Error guardando el diagnóstico:", error);
      alert("Hubo un error al guardar el diagnóstico");
    }
  };

  return (
    <div>
      <h3>Diagnóstico</h3>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Componente</th>
            <th>Pregunta</th>
            <th>Sí</th>
            <th>No</th>
          </tr>
        </thead>
        <tbody>
          {initialQuestions.map((section) => (
            <React.Fragment key={section.component}>
              {section.questions.map((question, index) => (
                <tr key={question.field}>
                  {index === 0 && (
                    <td rowSpan={section.questions.length}>{section.component}</td>
                  )}
                  <td>{question.text}</td>
                  <td>
                    <input
                      type="radio"
                      name={question.field}
                      checked={answers[question.field] === true}
                      onChange={() => handleAnswerChange(question.field, true)}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name={question.field}
                      checked={answers[question.field] === false}
                      onChange={() => handleAnswerChange(question.field, false)}
                    />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={handleSubmit}>
        Guardar
      </button>
    </div>
  );
}

DiagnosticoTab.propTypes = {
  id: PropTypes.string.isRequired,
};
