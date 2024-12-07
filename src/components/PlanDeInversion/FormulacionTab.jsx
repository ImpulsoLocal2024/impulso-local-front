import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function FormulacionTab({ id }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newRubro, setNewRubro] = useState({
    "Rubro": "",
    "Elemento": "",
    "Descripción": "",
    "Cantidad": "",
    "Valor Unitario": "",
  });

  const rubrosOptions = [
    "Maquinaria",
    "Herramientas",
    "Mobiliario",
    "Equipoy/o similares",
  ];

  const montoDisponible = 3000000; // 3 millones
  
  // Estados para la funcionalidad de archivos
  const [uploadedFilesMap, setUploadedFilesMap] = useState({}); 
  const [uploadingRecordId, setUploadingRecordId] = useState(null); 
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        setLoading(false);
        return;
      }

      // RUTA DE REGISTROS CON /pi/
      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetchedRecords = response.data || [];
      setRecords(fetchedRecords);

      // Después de obtener los registros, obtener los archivos de cada uno
      await fetchAllRecordsFiles(fetchedRecords);

    } catch (error) {
      console.error("Error obteniendo registros de formulación:", error);
      setError('Error obteniendo los registros de formulación');
    } finally {
      setLoading(false);
    }
  };

  // Obtener archivos de cada registro
  const fetchAllRecordsFiles = async (fetchedRecords) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const promises = fetchedRecords.map((rec) => fetchFilesForRecord(rec.id));
    await Promise.all(promises);
  };

  const fetchFilesForRecord = async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // RUTA DE ARCHIVOS SIN /pi/
      const filesResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${recordId}/files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            source: 'formulacion',
          },
        }
      );

      setUploadedFilesMap((prev) => ({
        ...prev,
        [recordId]: filesResponse.data.files
      }));
    } catch (error) {
      console.error('Error obteniendo los archivos:', error);
      setError('Error obteniendo los archivos');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRubro((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      const { Rubro, Elemento, Descripción, Cantidad, "Valor Unitario": ValorUnitario } = newRubro;

      if (!Rubro || !Elemento || !Cantidad || !ValorUnitario) {
        alert("Por favor completa Rubro, Elemento, Cantidad y Valor Unitario.");
        return;
      }

      const requestData = {
        caracterizacion_id: id,
        "Rubro": Rubro,
        "Elemento": Elemento,
        "Descripción": Descripción || "",
        "Cantidad": parseInt(Cantidad, 10) || 0,
        "Valor Unitario": parseFloat(ValorUnitario) || 0,
      };

      // RUTA DE CREACIÓN DE REGISTRO CON /pi/
      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/record`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refrescar la lista desde la BD
      await fetchRecords();

      // Resetear el formulario
      setNewRubro({
        "Rubro": "",
        "Elemento": "",
        "Descripción": "",
        "Cantidad": "",
        "Valor Unitario": "",
      });

      alert("Rubro guardado exitosamente");
    } catch (error) {
      console.error("Error guardando el rubro:", error);
      alert("Hubo un error al guardar el rubro");
    }
  };

  // Funciones de manejo de archivos
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !fileName) {
      alert('Por favor, ingresa un nombre y selecciona un archivo');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('caracterizacion_id', id);
      formData.append('source', 'formulacion');

      // RUTA DE SUBIDA DE ARCHIVO SIN /pi/
      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${uploadingRecordId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      await fetchFilesForRecord(uploadingRecordId);
      setFile(null);
      setFileName('');
      setUploadingRecordId(null);
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
      setError('Error subiendo el archivo');
    }
  };

  const handleFileDelete = async (recordId, fileId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      try {
        const token = localStorage.getItem('token');

        // RUTA DE BORRADO DE ARCHIVO SIN /pi/
        await axios.delete(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${recordId}/file/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchFilesForRecord(recordId);
      } catch (error) {
        console.error('Error eliminando el archivo:', error);
        setError('Error eliminando el archivo');
      }
    }
  };

  // Calcular resumen por rubro
  const resumenPorRubro = rubrosOptions.map((r) => {
    const total = records
      .filter((rec) => rec["Rubro"] === r)
      .reduce((sum, rec) => {
        const cantidad = rec["Cantidad"] || 0;
        const valorUnitario = rec["Valor Unitario"] || 0;
        return sum + (cantidad * valorUnitario);
      }, 0);
    return { rubro: r, total };
  });

  const totalInversion = resumenPorRubro.reduce((sum, item) => sum + item.total, 0);
  const contrapartida = totalInversion > montoDisponible ? totalInversion - montoDisponible : 0;

  return (
    <div>
      <h3>Formulación del Plan de Inversión</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          {/* Lista de registros existentes */}
          {records.length > 0 ? (
            <div className="mb-3">
              {records.map((rec, index) => {
                const recordId = rec.id;
                const rubro = rec["Rubro"] || "";
                const elemento = rec["Elemento"] || "";
                const descripcion = (rec["Descripción"] && rec["Descripción"].trim() !== "") 
                  ? rec["Descripción"] 
                  : "Sin descripción";
                const cantidad = rec["Cantidad"] || 0;
                const valorUnitario = rec["Valor Unitario"] || 0;
                const valorTotal = cantidad * valorUnitario;

                const files = uploadedFilesMap[recordId] || [];

                return (
                  <div key={recordId} className="card mb-2" style={{ borderLeft: "5px solid #28a745" }}>
                    <div className="card-body">
                      <h5 className="card-title">
                        {index + 1}. {rubro} <span className="text-success">✔️</span>
                      </h5>
                      <p className="card-text" style={{ lineHeight: "1.5" }}>
                        <strong>Elemento:</strong> {elemento}<br />
                        <strong>Descripción:</strong> {descripcion}<br />
                        <strong>Cantidad:</strong> {cantidad.toLocaleString()}<br />
                        <strong>Valor Unitario:</strong> ${valorUnitario.toLocaleString()}<br />
                        <strong>Valor Total:</strong> ${valorTotal.toLocaleString()}
                      </p>

                      {/* Sección de archivos para este registro */}
                      <div className="mt-4" style={{ width: '100%' }}>
                        <h6>Archivos adjuntos</h6>
                        {uploadingRecordId === recordId ? (
                          // Formulario de subida de archivo
                          <form onSubmit={handleFileUpload}>
                            <div className="form-group mb-2">
                              <label>Nombre del archivo</label>
                              <input
                                type="text"
                                className="form-control"
                                value={fileName}
                                onChange={handleFileNameChange}
                              />
                            </div>
                            <div className="form-group mb-2">
                              <label>Seleccionar archivo</label>
                              <input
                                type="file"
                                className="form-control"
                                onChange={handleFileChange}
                              />
                            </div>
                            <button type="submit" className="btn btn-success btn-sm mb-2 w-100">
                              Cargar archivo
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm w-100"
                              onClick={() => {setUploadingRecordId(null); setFile(null); setFileName('');}}
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm mb-2 w-100"
                            onClick={() => {setUploadingRecordId(recordId); setFile(null); setFileName('');}}
                          >
                            Subir documento
                          </button>
                        )}

                        {files.length > 0 ? (
                          <ul className="list-group mt-3">
                            {files.map((f) => (
                              <li
                                key={f.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>{f.name}</strong>
                                  <br />
                                  <a
                                    href={`https://impulso-local-back.onrender.com${f.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Ver archivo
                                  </a>
                                </div>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleFileDelete(recordId, f.id)}
                                >
                                  Eliminar
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay archivos subidos aún para este registro.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No hay registros agregados aún.</p>
          )}

          {/* Formulario para agregar nuevo rubro */}
          <div className="card p-3 mb-3">
            <h5>Agregar nuevo rubro</h5>
            <div className="row mb-2">
              <div className="col-md-4">
                <label><strong>Rubro</strong></label>
                <select
                  className="form-select w-100"
                  name="Rubro"
                  value={newRubro["Rubro"]}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar...</option>
                  {rubrosOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label><strong>Elemento</strong></label>
                <input
                  type="text"
                  className="form-control w-100"
                  name="Elemento"
                  value={newRubro["Elemento"]}
                  onChange={handleChange}
                  placeholder="Ej: Par, Kgs, Und"
                />
              </div>
              <div className="col-md-4">
                <label><strong>Descripción</strong></label>
                <input
                  type="text"
                  className="form-control w-100"
                  name="Descripción"
                  value={newRubro["Descripción"]}
                  onChange={handleChange}
                  placeholder="Descripción (opcional)"
                />
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-md-4">
                <label><strong>Cantidad</strong></label>
                <input
                  type="number"
                  className="form-control w-100"
                  name="Cantidad"
                  value={newRubro["Cantidad"]}
                  onChange={handleChange}
                  placeholder="Cantidad"
                />
              </div>
              <div className="col-md-4">
                <label><strong>Valor Unitario</strong></label>
                <input
                  type="number"
                  className="form-control w-100"
                  name="Valor Unitario"
                  value={newRubro["Valor Unitario"]}
                  onChange={handleChange}
                  placeholder="Valor Unitario"
                />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button className="btn btn-primary w-100" onClick={handleSubmit}>
                  Guardar rubro
                </button>
              </div>
            </div>
          </div>

          {/* Resumen de la inversión */}
          <h5>Resumen de la inversión</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Rubro</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {resumenPorRubro.map((r) => (
                <tr key={r.rubro}>
                  <td>{r.rubro}</td>
                  <td>${Number(r.total).toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>${Number(totalInversion).toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td>Monto disponible</td>
                <td>${montoDisponible.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Contrapartida</td>
                <td style={{color: contrapartida > 0 ? "red" : "black"}}>
                  ${contrapartida.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

FormulacionTab.propTypes = {
  id: PropTypes.string.isRequired,
};
