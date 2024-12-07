import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function FormulacionTab({ id }) {
  // id = caracterizacion_id (empresa)
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

  const [uploadedFilesMap, setUploadedFilesMap] = useState({});
  const [uploadingRecordId, setUploadingRecordId] = useState(null); 
  // uploadingRecordId = formulacion_id del registro en pi_formulacion
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

      // Obtenemos los registros (formulaciones) de esta empresa (id = caracterizacion_id)
      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetchedRecords = response.data || [];
      setRecords(fetchedRecords);

      await fetchAllRecordsFiles(fetchedRecords);

    } catch (error) {
      console.error("Error obteniendo registros de formulación:", error);
      setError('Error obteniendo los registros de formulación');
    } finally {
      setLoading(false);
    }
  };

  // Aquí no podemos filtrar en el backend por formulacion_id sin modificarlo.
  // Obtenemos todos los archivos de esta empresa (caracterizacion_id) en un solo endpoint
  // y luego filtramos en el frontend.
  const fetchAllRecordsFiles = async (fetchedRecords) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Vamos a obtener TODOS los archivos asociados a esta empresa (caracterizacion_id)
    // a través de un sólo endpoint: record/:caracterizacion_id/files
    // Luego filtraremos por source en el frontend para cada formulacion_id
    const filesResponse = await axios.get(
      `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${id}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    const allFiles = filesResponse.data.files || [];

    // Para cada registro (formulacion_id) filtramos los archivos cuyo source coincida con "formulacion_{formulacion_id}"
    const updatedMap = {};
    fetchedRecords.forEach((rec) => {
      const formulacion_id = rec.id;
      const formulacionFiles = allFiles.filter(f => f.source === `formulacion_${formulacion_id}`);
      updatedMap[formulacion_id] = formulacionFiles;
    });

    setUploadedFilesMap(updatedMap);
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

      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/record`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchRecords();

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
      // El backend para tablas pi_ exige caracterizacion_id, no record_id
      // Por lo tanto enviamos caracterizacion_id = id:
      formData.append('caracterizacion_id', id);
      // Usamos source para guardar el formulacion_id:
      formData.append('source', `formulacion_${uploadingRecordId}`);

      // Según el controlador original, si es pi_ se requiere caracterizacion_id
      // y en la URL se pone /record/:record_id (originalmente record_id era la empresa)
      // Deberíamos usar en la URL el caracterizacion_id (id):
      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Luego de subir, recargamos todos los archivos y filtramos por source
      await fetchAllRecordsFiles(records);
      setFile(null);
      setFileName('');
      setUploadingRecordId(null);
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
      setError('Error subiendo el archivo');
    }
  };

  const handleFileDelete = async (formulacion_id, fileId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_formulacion/record/${formulacion_id}/file/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Después de eliminar, recargamos todos los archivos
        await fetchAllRecordsFiles(records);
      } catch (error) {
        console.error('Error eliminando el archivo:', error);
        setError('Error eliminando el archivo');
      }
    }
  };

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
          {records.length > 0 ? (
            <div className="mb-3">
              {records.map((rec, index) => {
                const formulacion_id = rec.id; 
                const rubro = rec["Rubro"] || "";
                const elemento = rec["Elemento"] || "";
                const descripcion = (rec["Descripción"] && rec["Descripción"].trim() !== "") 
                  ? rec["Descripción"] 
                  : "Sin descripción";
                const cantidad = rec["Cantidad"] || 0;
                const valorUnitario = rec["Valor Unitario"] || 0;
                const valorTotal = cantidad * valorUnitario;

                const files = uploadedFilesMap[formulacion_id] || [];

                return (
                  <div key={formulacion_id} className="card mb-2" style={{ borderLeft: "5px solid #28a745" }}>
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

                      <div className="mt-4" style={{ width: '100%' }}>
                        <h6>Archivos adjuntos</h6>
                        {uploadingRecordId === formulacion_id ? (
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
                            onClick={() => {setUploadingRecordId(formulacion_id); setFile(null); setFileName('');}}
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
                                  onClick={() => handleFileDelete(formulacion_id, f.id)}
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
