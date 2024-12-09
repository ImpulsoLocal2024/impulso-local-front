// GenerarFichaTab.jsx

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

// Ruta de la imagen del banner en la carpeta public
const bannerImagePath = '/impulso-local-banner-pdf.jpeg';

export default function GenerarFichaTab({ id }) {
  // Estados para almacenar los datos obtenidos de la API
  const [caracterizacionData, setCaracterizacionData] = useState({});
  const [datosTab, setDatosTab] = useState({});
  const [propuestaMejoraData, setPropuestaMejoraData] = useState([]);
  const [formulacionData, setFormulacionData] = useState([]);
  const [groupedRubros, setGroupedRubros] = useState([]);
  const [totalInversion, setTotalInversion] = useState(0);
  const [relatedData, setRelatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para almacenar los nombres del asesor y del emprendedor
  const [asesorNombre, setAsesorNombre] = useState('');
  const [emprendedorNombre, setEmprendedorNombre] = useState('');
  const [asesorDocumento, setAsesorDocumento] = useState('');

  // Lista de campos a excluir de la sección de datos
  const datosKeys = [
    "Tiempo de dedicacion al negocio (Parcial o Completo)",
    "Descripcion general del negocio",
    "Descripcion de el lugar donde desarrolla la actividad",
    "Descripcion de los activos del negocio",
    "Valor aproximado de los activos del negocio",
    "Total costos fijos mensuales",
    "Total costos variables",
    "Total gastos mensuales",
    "Total ventas mensuales del negocio",
    "Descripcion de la capacidad de produccion",
    "Valor de los gastos familiares mensuales promedio",
    "Lleva registros separados de finanzas personales y del negocio",
    "Usa billeteras moviles",
    "Cual",
    "Concepto y justificacion del valor de la capitalizacion",
    "Como contribuira la inversion a la mejora productiva del negocio",
    "El negocio es sujeto de participacion en espacios de conexion",
    "Recomendaciones tecnica, administrativas y financieras"
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        console.error("El ID del registro de caracterización no está definido.");
        setErrorMsg("El ID del registro de caracterización no está definido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("Token de autenticación no encontrado.");
          setErrorMsg("Token de autenticación no encontrado. Por favor, inicia sesión nuevamente.");
          setLoading(false);
          return;
        }
        const baseURL = 'https://impulso-local-back.onrender.com/api/inscriptions';

        // 1. Obtener datos de `inscription_caracterizacion`
        const caracterizacionResponse = await axios.get(
          `${baseURL}/tables/inscription_caracterizacion/record/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Datos de caracterización:", caracterizacionResponse.data.record);
        setCaracterizacionData(caracterizacionResponse.data.record);

        // 2. Obtener datos relacionados para claves foráneas (si aplica)
        const fieldsResponse = await axios.get(
          `${baseURL}/pi/tables/inscription_caracterizacion/related-data`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRelatedData(fieldsResponse.data.relatedData || {});

        // 3. Obtener datos del asesor
        const asesorId = caracterizacionResponse.data.record.Asesor;
        if (asesorId) {
          const asesorResponse = await axios.get(
            `${baseURL}/tables/users/record/${asesorId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const asesorData = asesorResponse.data.record;
          const nombreAsesor = asesorData.username || 'No asignado';
          setAsesorNombre(nombreAsesor);
          console.log("Nombre del asesor:", nombreAsesor);

          // Obtener el documento del asesor
          const documentoAsesor = asesorData.documento || 'No disponible';
          setAsesorDocumento(documentoAsesor);
          console.log("Documento del asesor:", documentoAsesor);
        } else {
          setAsesorNombre('No asignado');
          setAsesorDocumento('No disponible');
          console.log("Asesor no asignado.");
        }

        // 4. Obtener nombre del beneficiario
        const nombreEmprendedor = [
          caracterizacionResponse.data.record["Primer nombre"] || '',
          caracterizacionResponse.data.record["Otros nombres"] || '',
          caracterizacionResponse.data.record["Primer apellido"] || '',
          caracterizacionResponse.data.record["Segundo apellido"] || ''
        ].filter(Boolean).join(' ');
        setEmprendedorNombre(nombreEmprendedor || 'No disponible');
        console.log("Nombre del emprendedor:", nombreEmprendedor);

        // 5. Obtener datos de `pi_datos` para el caracterizacion_id
        const datosResponse = await axios.get(
          `${baseURL}/pi/tables/pi_datos/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (datosResponse.data.length > 0) {
          setDatosTab(datosResponse.data[0]);
          console.log("Datos de pi_datos:", datosResponse.data[0]);
        } else {
          console.log("No se encontraron datos en pi_datos para este caracterizacion_id.");
        }

        // 6. Obtener datos de `pi_propuesta_mejora`
        const propuestaMejoraResponse = await axios.get(
          `${baseURL}/pi/tables/pi_propuesta_mejora/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPropuestaMejoraData(propuestaMejoraResponse.data);
        console.log("Datos de pi_propuesta_mejora:", propuestaMejoraResponse.data);

        // 7. Obtener datos de `pi_formulacion` sin referencias a `provider_proveedores`
        const formulacionResponse = await axios.get(
          `${baseURL}/pi/tables/pi_formulacion/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormulacionData(formulacionResponse.data);
        console.log("Datos de pi_formulacion:", formulacionResponse.data);

        // 8. Agrupar Rubros y calcular total inversión
        const rubrosOptions = [
          "Maquinaria",
          "Herramientas",
          "Mobiliario",
          "Equipo y/o similares",
        ];

        const resumenPorRubro = rubrosOptions.map((r) => {
          const total = formulacionResponse.data
            .filter((rec) => rec["Rubro"] === r)
            .reduce((sum, rec) => {
              const cantidad = rec["Cantidad"] || 0;
              const valorUnitario = rec["Valor Unitario"] || 0;
              return sum + (cantidad * valorUnitario);
            }, 0);
          return { rubro: r, total };
        });

        const totalInv = resumenPorRubro.reduce((sum, item) => sum + item.total, 0);
        const montoDisponible = 3000000; // 3 millones
        const contrapartida = totalInv > montoDisponible ? totalInv - montoDisponible : 0;

        setGroupedRubros(resumenPorRubro);
        setTotalInversion(totalInv.toFixed(2));
        console.log("Resumen por rubro:", resumenPorRubro);
        console.log("Total inversión:", totalInv);
        console.log("Contrapartida:", contrapartida);

        setLoading(false);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setErrorMsg("Error al obtener los datos. Por favor, inténtalo nuevamente más tarde.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Función para obtener el valor legible de campos relacionados
  const getColumnDisplayValue = (column, value) => {
    if (relatedData[column]) {
      const relatedRecord = relatedData[column].find(
        (item) => String(item.id) === String(value)
      );
      return relatedRecord ? relatedRecord.displayValue : `ID: ${value}`;
    }
    return value;
  };

  // Función para verificar el final de la página y agregar una nueva si es necesario
  const checkPageEnd = (doc, currentY, addedHeight) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + addedHeight > pageHeight - 40) { // Dejamos un margen inferior de 40
      doc.addPage();
      currentY = 40; // Reiniciamos yPosition al margen superior después de agregar una nueva página
    }
    return currentY;
  };

  // Función para generar el PDF completo
  const generateFichaPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    let yPosition = 100;

    // Estilos de fuente y color
    const fontSizes = {
      title: 18,      // Aumenté el tamaño del título principal
      subtitle: 14,
      normal: 12,
    };
    const blueColor = [77, 20, 140]; // Color #4D148C

    // Función para convertir imagen a base64
    const getImageDataUrl = (img) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      return canvas.toDataURL('image/jpeg');
    };

    // Cargar la imagen y generar el PDF después
    const img = new Image();
    img.src = bannerImagePath; // Ruta de la imagen en la carpeta public
    img.onload = () => {
      const imgData = getImageDataUrl(img);

      // Encabezado con imagen
      doc.addImage(imgData, 'JPEG', margin, 40, maxLineWidth, 60);

      yPosition = 130; // Ajustar la posición vertical después del encabezado

      // 1. Título Principal
      doc.setFontSize(fontSizes.title);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("PLAN DE INVERSIÓN DE LA MICROEMPRESA", pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 30; // Espacio después del título principal

      // 2. Datos Generales del Negocio (`pi_datos`) excluyendo `datosKeys`
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      doc.text("Datos Generales del Negocio", pageWidth / 2, yPosition, { align: 'center' });

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 20;

      // Filtrar los campos de pi_datos excluyendo `datosKeys` y `caracterizacion_id`
      const piDatosFields = Object.keys(datosTab).filter(key => !datosKeys.includes(key) && key !== 'caracterizacion_id');
      if (piDatosFields.length > 0) {
        piDatosFields.forEach(key => {
          const label = `${key}:`;
          const value = datosTab[key] || 'No disponible';

          // Texto en negrita para el label
          doc.setFont(undefined, 'bold');
          const labelLines = doc.splitTextToSize(label, maxLineWidth);
          yPosition = checkPageEnd(doc, yPosition, labelLines.length * 14);
          doc.text(labelLines, margin, yPosition);
          yPosition += labelLines.length * 14;

          // Texto normal para el valor
          doc.setFont(undefined, 'normal');
          const valueLines = doc.splitTextToSize(value, maxLineWidth);
          yPosition = checkPageEnd(doc, yPosition, valueLines.length * 14);
          doc.text(valueLines, margin, yPosition);
          yPosition += valueLines.length * 14 + 5; // Espacio adicional entre entradas
        });
      } else {
        doc.text("No hay datos generales del negocio disponibles.", margin, yPosition);
        yPosition += 14;
      }

      // 3. PROPUESTA DE MEJORA SOBRE EL DIAGNÓSTICO REALIZADO
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      doc.text("PROPUESTA DE MEJORA SOBRE EL DIAGNÓSTICO REALIZADO", pageWidth / 2, yPosition, { align: 'center' });

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 20;

      if (propuestaMejoraData.length > 0) {
        const propuestaHeaders = [
          { header: 'Área de Fortalecimiento', dataKey: 'area' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Propuesta', dataKey: 'propuesta' },
        ];

        const propuestaBody = propuestaMejoraData.map(item => ({
          area: item["Area de fortalecimiento"] || 'No disponible',
          descripcion: item["Descripcion del area critica por area de fortalecimiento"] || 'No disponible',
          propuesta: item["Propuesta de mejora"] || 'No disponible',
        }));

        doc.autoTable({
          startY: yPosition,
          head: [propuestaHeaders.map(col => col.header)],
          body: propuestaBody.map(row => propuestaHeaders.map(col => row[col.dataKey])),
          theme: 'striped',
          styles: { fontSize: fontSizes.normal, cellPadding: 4 },
          tableWidth: 'auto',
          headStyles: { fillColor: blueColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { left: margin, right: margin },
          didDrawPage: (data) => {
            yPosition = data.cursor.y;
          },
        });

        yPosition = doc.lastAutoTable.finalY + 10 || yPosition + 10;
      } else {
        doc.text("No hay propuestas de mejora registradas.", margin, yPosition);
        yPosition += 14;
      }

      // 4. FORMULACIÓN DE INVERSIÓN
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      doc.text("FORMULACIÓN DE INVERSIÓN", pageWidth / 2, yPosition, { align: 'center' });

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 20;

      if (formulacionData.length > 0) {
        const formulacionHeaders = [
          { header: 'Rubro', dataKey: 'rubro' },
          { header: 'Elemento', dataKey: 'elemento' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Cantidad', dataKey: 'cantidad' },
          { header: 'Valor Unitario', dataKey: 'valorUnitario' },
          { header: 'Valor Total', dataKey: 'valorTotal' },
        ];

        const formulacionBody = formulacionData.map(item => ({
          rubro: item["Rubro"] || 'No disponible',
          elemento: item["Elemento"] || 'No disponible',
          descripcion: item["Descripción"] || 'No disponible',
          cantidad: item["Cantidad"] ? item["Cantidad"].toLocaleString() : '0',
          valorUnitario: item["Valor Unitario"] ? `$${item["Valor Unitario"].toLocaleString()}` : '$0',
          valorTotal: item["Cantidad"] && item["Valor Unitario"]
            ? `$${(item["Cantidad"] * item["Valor Unitario"]).toLocaleString()}`
            : '$0',
        }));

        doc.autoTable({
          startY: yPosition,
          head: [formulacionHeaders.map(col => col.header)],
          body: formulacionBody.map(row => formulacionHeaders.map(col => row[col.dataKey])),
          theme: 'striped',
          styles: { fontSize: fontSizes.normal, cellPadding: 4 },
          tableWidth: 'auto',
          headStyles: { fillColor: blueColor, textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { left: margin, right: margin },
          didDrawPage: (data) => {
            yPosition = data.cursor.y;
          },
        });

        yPosition = doc.lastAutoTable.finalY + 10 || yPosition + 10;
      } else {
        doc.text("No hay registros de formulación de inversión.", margin, yPosition);
        yPosition += 14;
      }

      // 5. RESUMEN DE LA INVERSIÓN
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      doc.text("RESUMEN DE LA INVERSIÓN", pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      const resumenColumns = [
        { header: 'Rubro', dataKey: 'rubro' },
        { header: 'Valor', dataKey: 'total' },
      ];

      doc.autoTable({
        startY: yPosition,
        head: [resumenColumns.map(col => col.header)],
        body: groupedRubros.map(row => resumenColumns.map(col => row[col.dataKey])),
        theme: 'striped',
        styles: { fontSize: fontSizes.normal, cellPadding: 4 },
        tableWidth: 'auto',
        headStyles: { fillColor: blueColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          yPosition = data.cursor.y;
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10 || yPosition + 10;
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Inversión: $${totalInversion}`, pageWidth - margin, yPosition, { align: 'right' });

      // 6. CONCEPTO DE VIABILIDAD DE PLAN DE INVERSIÓN
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 30;
      doc.text("CONCEPTO DE VIABILIDAD DE PLAN DE INVERSIÓN", pageWidth / 2, yPosition, { align: 'center' });

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 20;

      const textoViabilidad = [
        `Yo, ${asesorNombre}, identificado con documento de identidad ${asesorDocumento}, en mi calidad de asesor empresarial del micronegocio denominado ${nombreComercial} y haciendo parte del equipo ejecutor del programa “Impulso Local” suscrito entre la Corporación para el Desarrollo de las Microempresas - Propaís y la Secretaría de Desarrollo Económico - SDDE, emito concepto de VIABILIDAD para que el beneficiario pueda acceder a los recursos de capitalización proporcionados por el citado programa.`,
        "",
        "Nota: El valor detallado en el presente documento corresponde a la planeación de las inversiones que requiere cada negocio local, sin embargo, es preciso aclarar que el programa Impulso Local no capitalizará este valor en su totalidad, sino que fortalecerá cada unidad productiva con algunos de estos bienes hasta por $3.000.000 de pesos en total, de acuerdo con la disponibilidad de los mismos y la mayor eficiencia en el uso de los recursos públicos.",
        "",
        "Nota: Declaro que toda la información sobre el plan de inversión aquí consignada fue diligenciada en conjunto con el asesor empresarial a cargo, está de acuerdo con las condiciones del negocio, es verdadera, completa y correcta, la cual puede ser verificada en cualquier momento."
      ];

      textoViabilidad.forEach(parrafo => {
        if (parrafo === "") {
          yPosition += 10; // Espacio para párrafos vacíos
          return;
        }
        const lines = doc.splitTextToSize(parrafo, maxLineWidth);
        yPosition = checkPageEnd(doc, yPosition, lines.length * 14);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 14 + 10; // Espacio adicional entre párrafos
      });

      // 7. Sección de Firmas
      const firmasSectionHeight = 120; // Altura total estimada de la sección de firmas
      yPosition += 10;
      yPosition = checkPageEnd(doc, yPosition, firmasSectionHeight);

      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      doc.text("Firmas", pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 30;
      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');

      // Posiciones para las cajas de firmas
      const boxWidth = 150;
      const boxHeight = 40;

      const beneficiarioBoxX = margin + 30;
      const asesorBoxX = pageWidth - margin - 180;

      // Posicionar etiquetas directamente encima de las cajas
      doc.text("Beneficiario", beneficiarioBoxX + boxWidth / 2, yPosition, { align: 'center' });
      doc.text("Asesor", asesorBoxX + boxWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;

      // Dibujar cajas de firmas
      doc.rect(beneficiarioBoxX, yPosition, boxWidth, boxHeight);
      doc.rect(asesorBoxX, yPosition, boxWidth, boxHeight);

      yPosition += boxHeight + 15;

      // Nombres debajo de las cajas
      doc.text(emprendedorNombre, beneficiarioBoxX + boxWidth / 2, yPosition, { align: 'center' });
      doc.text(asesorNombre, asesorBoxX + boxWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;
      const emprendedorCC = caracterizacionData["Numero de documento de identificacion ciudadano"] || 'No disponible';
      doc.text(`C.C. ${emprendedorCC}`, beneficiarioBoxX + boxWidth / 2, yPosition, { align: 'center' });
      doc.text(`C.C. ${asesorDocumento}`, asesorBoxX + boxWidth / 2, yPosition, { align: 'center' });

      // 8. Sección de Fecha y Hora
      const dateSectionHeight = 30; // Altura total estimada de la sección de fecha y hora
      yPosition += 30;
      yPosition = checkPageEnd(doc, yPosition, dateSectionHeight);

      const fecha = new Date();
      doc.text(`Fecha y hora de generación`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      doc.text(`${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });

      // Descargar PDF
      doc.save(`Ficha_Negocio_Local_${id}.pdf`); // Cambiar nombre del archivo si lo deseas
    };
  };
    return (
      <div>
        <h3>Generar Ficha</h3>
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        <button onClick={generateFichaPDF} className="btn btn-primary" disabled={loading}>
          Descargar Ficha PDF
        </button>
        {loading && <p>Cargando datos, por favor espera...</p>}
      </div>
    );
}
