// GenerarFichaTab.jsx

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

// La imagen del banner está en la carpeta public
const bannerImagePath = '/impulso-local-banner-pdf.jpeg';

export default function GenerarFichaTab({ id }) {
  const [caracterizacionData, setCaracterizacionData] = useState({});
  const [datosTab, setDatosTab] = useState({});
  const [propuestaMejoraData, setPropuestaMejoraData] = useState([]);
  const [formulacionData, setFormulacionData] = useState([]);
  const [piFormulacionRecords, setPiFormulacionRecords] = useState([]);
  const [groupedRubros, setGroupedRubros] = useState([]);
  const [totalInversion, setTotalInversion] = useState(0);
  const [relatedData, setRelatedData] = useState({});
  const [providerRelatedData, setProviderRelatedData] = useState({});
  const [loading, setLoading] = useState(true);

  // Nuevos estados para almacenar los nombres
  const [asesorNombre, setAsesorNombre] = useState('');
  const [emprendedorNombre, setEmprendedorNombre] = useState('');
  const [asesorDocumento, setAsesorDocumento] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        console.error("El ID del registro de caracterización no está definido.");
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("Token de autenticación no encontrado.");
          setLoading(false);
          return;
        }
        const baseURL = 'https://impulso-local-back.onrender.com/api/inscriptions';

        // Obtener datos de `inscription_caracterizacion`
        const caracterizacionResponse = await axios.get(
          `${baseURL}/tables/inscription_caracterizacion/record/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCaracterizacionData(caracterizacionResponse.data.record);

        // Obtener datos relacionados para claves foráneas
        const fieldsResponse = await axios.get(
          `${baseURL}/pi/tables/inscription_caracterizacion/related-data`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRelatedData(fieldsResponse.data.relatedData || {});

        // Obtener datos del asesor
        const asesorId = caracterizacionResponse.data.record.Asesor;
        if (asesorId) {
          const asesorResponse = await axios.get(
            `${baseURL}/tables/users/record/${asesorId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const asesorData = asesorResponse.data.record;
          const nombreAsesor = asesorData.username || 'No asignado';
          setAsesorNombre(nombreAsesor);

          // Obtener el documento del asesor
          const documentoAsesor = asesorData.documento || 'No disponible';
          setAsesorDocumento(documentoAsesor);
        } else {
          setAsesorNombre('No asignado');
          setAsesorDocumento('No disponible');
        }

        // Obtener nombre del beneficiario
        const nombreEmprendedor = [
          caracterizacionResponse.data.record["Primer nombre"] || '',
          caracterizacionResponse.data.record["Otros nombres"] || '',
          caracterizacionResponse.data.record["Primer apellido"] || '',
          caracterizacionResponse.data.record["Segundo apellido"] || ''
        ].filter(Boolean).join(' ');
        setEmprendedorNombre(nombreEmprendedor || 'No disponible');

        // Obtener datos de `pi_datos` para el caracterizacion_id
        const datosResponse = await axios.get(
          `${baseURL}/pi/tables/pi_datos/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (datosResponse.data.length > 0) {
          setDatosTab(datosResponse.data[0]);
        }

        // Obtener datos de `pi_propuesta_mejora`
        const propuestaMejoraResponse = await axios.get(
          `${baseURL}/pi/tables/pi_propuesta_mejora/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPropuestaMejoraData(propuestaMejoraResponse.data);

        // Obtener datos de `pi_formulacion`
        const formulacionResponse = await axios.get(
          `${baseURL}/pi/tables/pi_formulacion/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormulacionData(formulacionResponse.data);

        // Obtener datos de pi_formulacion y proveedores asociados
        const piFormulacionUrl = `${baseURL}/pi/tables/pi_formulacion/records?caracterizacion_id=${id}&Seleccion=true`;
        const piFormulacionResponse = await axios.get(piFormulacionUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const piRecords = piFormulacionResponse.data;

        // Obtener IDs de proveedores
        const providerIds = piRecords.map((piRecord) => piRecord.rel_id_prov);

        // Obtener detalles de proveedores
        const providerPromises = providerIds.map((providerId) => {
          const providerUrl = `${baseURL}/tables/provider_proveedores/record/${providerId}`;
          return axios.get(providerUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
        });

        const providersResponses = await Promise.all(providerPromises);
        const providersData = providersResponses.map((res) => res.data.record);

        // Obtener datos relacionados para proveedores (Rubro y Elemento)
        const providerFieldsResponse = await axios.get(
          `${baseURL}/pi/tables/provider_proveedores/related-data`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProviderRelatedData(providerFieldsResponse.data.relatedData || {});

        // Combinar pi_formulacion y proveedores
        const combinedData = piRecords.map((piRecord) => {
          const providerData = providersData.find(
            (provider) => String(provider.id) === String(piRecord.rel_id_prov)
          );
          return {
            ...piRecord,
            providerData,
          };
        });

        setPiFormulacionRecords(combinedData);

        // Agrupar Rubros y calcular total inversión
        const rubroMap = {};

        combinedData.forEach((piRecord) => {
          const provider = piRecord.providerData;
          if (provider) {
            const rubroId = provider.Rubro;
            const precioCatalogo = parseFloat(provider["Valor catalogo"]) || 0;
            const cantidad = parseFloat(piRecord.Cantidad) || 1;
            const totalPrice = precioCatalogo * cantidad;

            if (rubroMap[rubroId]) {
              rubroMap[rubroId] += totalPrice;
            } else {
              rubroMap[rubroId] = totalPrice;
            }
          }
        });

        // Mapeo de IDs de Rubro a nombres
        const rubroNamesMap = {
          '1': 'Equipo',
          '2': 'Herramientas',
          '3': 'Maquinaria',
          '4': 'Mobiliario',
          // Agrega más mapeos si es necesario
        };

        const groupedRubrosArray = Object.entries(rubroMap).map(([rubroId, total]) => {
          const rubroName = rubroNamesMap[rubroId] || 'No disponible';
          return {
            rubro: rubroName,
            total: total.toFixed(2),
          };
        });

        const totalInv = groupedRubrosArray.reduce(
          (acc, record) => acc + parseFloat(record.total || 0),
          0
        ).toFixed(2);

        setGroupedRubros(groupedRubrosArray);
        setTotalInversion(totalInv);

        setLoading(false);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getColumnDisplayValue = (column, value) => {
    if (relatedData[column]) {
      const relatedRecord = relatedData[column].find(
        (item) => String(item.id) === String(value)
      );
      return relatedRecord ? relatedRecord.displayValue : `ID: ${value}`;
    }
    return value;
  };

  const getProviderColumnDisplayValue = (column, value) => {
    if (providerRelatedData[column]) {
      const relatedRecord = providerRelatedData[column].find(
        (item) => String(item.id) === String(value)
      );
      return relatedRecord ? relatedRecord.displayValue : `ID: ${value}`;
    }
    return value;
  };

  const generateFichaPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    let yPosition = 100;

    // Estilos de fuente y color
    const fontSizes = {
      title: 16,
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

      // Información del Negocio Local
      doc.setFontSize(fontSizes.subtitle);
      doc.setTextColor(0, 0, 0);
      yPosition += 20;
      doc.text("Información del Negocio Local", margin, yPosition);

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');

      const negocioId = id;
      const nombreComercial = caracterizacionData["Nombre comercial"] || 'No disponible';
      const localidadNombre = getColumnDisplayValue("Localidad unidad RIC", caracterizacionData["Localidad unidad RIC"]);
      const barrioNombre = getColumnDisplayValue("Barrio de residencia", caracterizacionData["Barrio de residencia"]);
      const direccion = caracterizacionData["Direccion unidad RIC"] || 'No disponible';
      const numeroContacto = caracterizacionData["Numero movil 1 ciudadano"] || 'No disponible';

      yPosition += 20;
      const infoEmprendimiento = [
        `ID de Negocio Local: ${negocioId}`,
        `Nombre comercial: ${nombreComercial}`,
        `Localidad: ${localidadNombre || 'No disponible'}`,
        `Barrio: ${barrioNombre || 'No disponible'}`,
        `Dirección: ${direccion}`,
        `Número de contacto: ${numeroContacto}`,
      ];

      infoEmprendimiento.forEach(text => {
        const lines = doc.splitTextToSize(text, maxLineWidth);
        yPosition = checkPageEnd(doc, yPosition, lines.length * 14);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 14;
      });

      // Información del Beneficiario
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 10;
      doc.text("Información del Beneficiario", margin, yPosition);

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      const tipoDocumento = getColumnDisplayValue("Tipo de documento", caracterizacionData["Tipo de documento"]);
      const numeroDocumento = caracterizacionData["Numero de documento de identificacion ciudadano"] || 'No disponible';

      yPosition += 20;
      const infoEmprendedor = [
        `Nombre beneficiario: ${emprendedorNombre}`,
        `Tipo documento identidad: ${tipoDocumento || 'No disponible'}`,
        `Número documento identidad: ${numeroDocumento}`,
      ];

      infoEmprendedor.forEach(text => {
        const lines = doc.splitTextToSize(text, maxLineWidth);
        yPosition = checkPageEnd(doc, yPosition, lines.length * 14);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 14;
      });

      // Sección de Datos (`pi_datos`)
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 20;
      doc.text("Datos Generales del Negocio", margin, yPosition);

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 10;

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

      datosKeys.forEach(key => {
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

      // Sección de Propuesta de Mejora (`pi_propuesta_mejora`)
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 20;
      doc.text("Propuesta de Mejora", margin, yPosition);

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 10;

      if (propuestaMejoraData.length > 0) {
        propuestaMejoraData.forEach((item, index) => {
          const area = item["Area de fortalecimiento"] || 'No disponible';
          const descripcion = item["Descripcion del area critica por area de fortalecimiento"] || 'No disponible';
          const propuesta = item["Propuesta de mejora"] || 'No disponible';

          const propuestaText = `• Área de Fortalecimiento ${index + 1}: ${area}\n  Descripción: ${descripcion}\n  Propuesta: ${propuesta}`;

          const lines = doc.splitTextToSize(propuestaText, maxLineWidth);
          yPosition = checkPageEnd(doc, yPosition, lines.length * 14);
          doc.text(lines, margin, yPosition);
          yPosition += lines.length * 14 + 10;
        });
      } else {
        doc.text("No hay propuestas de mejora registradas.", margin, yPosition);
        yPosition += 14;
      }

      // Sección de Formulación (`pi_formulacion`)
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 20;
      doc.text("Formulación del Plan de Inversión", margin, yPosition);

      doc.setFontSize(fontSizes.normal);
      doc.setFont(undefined, 'normal');
      yPosition += 10;

      if (formulacionData.length > 0) {
        formulacionData.forEach((item, index) => {
          const rubro = item["Rubro"] || 'No disponible';
          const elemento = item["Elemento"] || 'No disponible';
          const descripcion = item["Descripción"] || 'No disponible';
          const cantidad = item["Cantidad"] || 0;
          const valorUnitario = item["Valor Unitario"] || 0;
          const valorTotal = cantidad * valorUnitario;

          const formulacionText = `• Rubro ${index + 1}: ${rubro}\n  Elemento: ${elemento}\n  Descripción: ${descripcion}\n  Cantidad: ${cantidad.toLocaleString()}\n  Valor Unitario: $${valorUnitario.toLocaleString()}\n  Valor Total: $${valorTotal.toLocaleString()}`;

          const lines = doc.splitTextToSize(formulacionText, maxLineWidth);
          yPosition = checkPageEnd(doc, yPosition, lines.length * 14);
          doc.text(lines, margin, yPosition);
          yPosition += lines.length * 14 + 10;
        });

        // Resumen de la Inversión
        doc.setFontSize(fontSizes.subtitle);
        doc.setFont(undefined, 'bold');
        yPosition += 20;
        doc.text("Resumen de la Inversión", margin, yPosition);

        yPosition += 10;

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

      } else {
        doc.text("No hay registros de formulación de inversión.", margin, yPosition);
        yPosition += 14;
      }

      // Concepto de Viabilidad
      doc.setFontSize(fontSizes.subtitle);
      doc.setFont(undefined, 'bold');
      yPosition += 30;
      doc.text("Concepto de Viabilidad", pageWidth / 2, yPosition, { align: 'center' });

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

      // Sección de Firmas
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

      // Sección de Fecha y Hora
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

    // Función para verificar el final de la página y agregar una nueva si es necesario
    const checkPageEnd = (doc, currentY, addedHeight) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (currentY + addedHeight > pageHeight - 40) { // Dejamos un margen inferior de 40
        doc.addPage();
        currentY = 40; // Reiniciamos yPosition al margen superior después de agregar una nueva página
      }
      return currentY;
    };

    return (
      <div>
        <h3>Generar Ficha</h3>
        <button onClick={generateFichaPDF} className="btn btn-primary" disabled={loading}>
          Descargar Ficha PDF
        </button>
        {loading && <p>Cargando datos, por favor espera...</p>}
      </div>
    );
  }
}