import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

export default function GenerarFichaTab({ id }) {
  const [caracterizacionData, setCaracterizacionData] = useState({});
  const [diagnosticoData, setDiagnosticoData] = useState([]);
  const [activosData, setActivosData] = useState([]);
  const [caracteristicasData, setCaracteristicasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asesorNombre, setAsesorNombre] = useState('');
  const [emprendedorNombre, setEmprendedorNombre] = useState('');
  const [asesorDocumento, setAsesorDocumento] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          alert('No se encontró el token de autenticación');
          return;
        }

        // Obtener datos de `inscription_caracterizacion`
        const caracterizacionResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/inscription_caracterizacion/record/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCaracterizacionData(caracterizacionResponse.data.record);

        // Obtener datos del asesor
        const asesorId = caracterizacionResponse.data.record.Asesor;
        if (asesorId) {
          const asesorResponse = await axios.get(
            `https://impulso-local-back.onrender.com/api/inscriptions/tables/users/record/${asesorId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const asesorData = asesorResponse.data.record;
          setAsesorNombre(asesorData.username || 'No asignado');
          setAsesorDocumento(asesorData.documento || 'No disponible');
        } else {
          setAsesorNombre('No asignado');
          setAsesorDocumento('No disponible');
        }

        // Obtener nombre del beneficiario
        const nombreEmprendedor = [
          caracterizacionResponse.data.record["Primer nombre"] || '',
          caracterizacionResponse.data.record["Otros nombres"] || '',
          caracterizacionResponse.data.record["Primer apellido"] || '',
          caracterizacionResponse.data.record["Segundo apellido"] || '',
        ]
          .filter(Boolean)
          .join(' ');
        setEmprendedorNombre(nombreEmprendedor || 'No disponible');

        // Obtener datos de `pi_diagnostico`
        const diagnosticoResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_diagnostico/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDiagnosticoData(diagnosticoResponse.data);

        // Obtener datos de `pi_activos`
        const activosResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_activos/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setActivosData(activosResponse.data);

        // Obtener datos de `pi_caracteristicas`
        const caracteristicasResponse = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_caracteristicas/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCaracteristicasData(caracteristicasResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 40;
    const maxLineWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let yPosition = 50;

    // Agregar el banner
    doc.addImage('/impulso-local-banner-pdf.jpeg', 'JPEG', margin, yPosition, maxLineWidth, 60);
    yPosition += 70;

    // Información del Beneficiario
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Beneficiario', margin, yPosition);
    yPosition += 20;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${emprendedorNombre}`, margin, yPosition);
    yPosition += 20;
    doc.text(`Asesor: ${asesorNombre}`, margin, yPosition);
    yPosition += 20;

    // Diagnóstico
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico', margin, yPosition);
    yPosition += 20;
    if (diagnosticoData.length > 0) {
      diagnosticoData.forEach((item, index) => {
        doc.text(`${index + 1}. ${item['Descripción'] || 'No disponible'}`, margin, yPosition);
        yPosition += 15;
      });
    } else {
      doc.text('No hay datos de diagnóstico disponibles.', margin, yPosition);
      yPosition += 20;
    }

    // Activos
    doc.setFont('helvetica', 'bold');
    doc.text('Activos', margin, yPosition);
    yPosition += 20;
    if (activosData.length > 0) {
      activosData.forEach((item, index) => {
        doc.text(`${index + 1}. ${item['Descripción'] || 'No disponible'}`, margin, yPosition);
        yPosition += 15;
      });
    } else {
      doc.text('No hay datos de activos disponibles.', margin, yPosition);
      yPosition += 20;
    }

    // Características del Espacio
    doc.setFont('helvetica', 'bold');
    doc.text('Características del Espacio', margin, yPosition);
    yPosition += 20;
    if (caracteristicasData.length > 0) {
      caracteristicasData.forEach((item, index) => {
        doc.text(`${index + 1}. ${item['Descripción'] || 'No disponible'}`, margin, yPosition);
        yPosition += 15;
      });
    } else {
      doc.text('No hay datos de características del espacio disponibles.', margin, yPosition);
      yPosition += 20;
    }

    // Guardar el PDF
    doc.save(`Informe_Negocio_Local_${id}.pdf`);
  };

  return (
    <div>
      <h3>Generar Ficha</h3>
      <button onClick={generatePDF} className="btn btn-primary" disabled={loading}>
        Descargar Ficha en PDF
      </button>
      {loading && <p>Cargando datos, por favor espera...</p>}
    </div>
  );
}
