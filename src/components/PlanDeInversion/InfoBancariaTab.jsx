import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function InfoBancariaTab({ id }) {
  const [data, setData] = useState({
    "Banco": "",
    "Tipo de cuenta": "",
    "Número de cuenta": "",
    "Tipo de documento titular": "",
    "Número de identificación": "",
  });

  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null); // para el archivo ya subido

  const bancos = [
    "BANCAMIA",
    "BANCO AGRARIO",
    "BANCO AV VILLAS",
    "BANCO BBVA COLOMBIA S.A.",
    "BANCO CAJA SOCIAL",
    "BANCO COLPATRIA",
    "BANCO COOPERATIVO COOPCENTRAL",
    "BANCO CREDIFINANCIERA",
    "BANCO DAVIVIENDA",
    "BANCO DE BOGOTA",
    "BANCO DE OCCIDENTE",
    "BANCO FALABELLA",
    "BANCO FINANDINA",
    "BANCO GNB SUDAMERIS",
    "BANCO MIBANCO",
    "BANCO MUNDO MUJER",
    "BANCO PICHINCHA",
    "BANCO POPULAR",
    "BANCO SERFINANZA",
    "BANCO W",
    "BANCOLOMBIA",
    "BANCOOMEVA S.A.",
    "CONFIAR COOPERATIVA FINANCIERA",
    "NEQUI",
    "DAVIPLATA",
    "LULO BANK",
    "MOVII S.A.",
    "BANCO SANTANDER COLOMBIA",
    "UALA",
  ];

  const tiposCuenta = [
    "Cuenta de ahorros",
    "Cuenta corriente",
  ];

  const tiposDocumento = [
    "Cedula de Ciudadania",
    "Cedula de Extranjeria",
    "Contrasena de cedula",
    "Permiso especial de permanencia",
    "Permiso por proteccion temporal",
    "Permiso temporal de permanencia"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        setLoading(false);
        return;
      }

      // Obtener registro pi_informacion_bancaria
      const response = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_informacion_bancaria/records?caracterizacion_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recordData = response.data[0] || null;

      if (recordData) {
        setRecordId(recordData.id);
        setData({
          "Banco": recordData["Banco"] || "",
          "Tipo de cuenta": recordData["Tipo de cuenta"] || "",
          "Número de cuenta": recordData["Número de cuenta"] || "",
          "Tipo de documento titular": recordData["Tipo de documento titular"] || "",
          "Número de identificación": recordData["Número de identificación"] || "",
        });
        setOriginalData({
          "Banco": recordData["Banco"] || "",
          "Tipo de cuenta": recordData["Tipo de cuenta"] || "",
          "Número de cuenta": recordData["Número de cuenta"] || "",
          "Tipo de documento titular": recordData["Tipo de documento titular"] || "",
          "Número de identificación": recordData["Número de identificación"] || "",
        });
      } else {
        // No existe registro, inicializar vacío
        setRecordId(null);
        setData({
          "Banco": "",
          "Tipo de cuenta": "",
          "Número de cuenta": "",
          "Tipo de documento titular": "",
          "Número de identificación": "",
        });
        setOriginalData({
          "Banco": "",
          "Tipo de cuenta": "",
          "Número de cuenta": "",
          "Tipo de documento titular": "",
          "Número de identificación": "",
        });
      }

      // Obtener archivos asociados (si los hay)
      const filesResponse = await axios.get(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_informacion_bancaria/record/${id}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allFiles = filesResponse.data.files || [];
      const infoFile = allFiles.find(f => f.source === 'info_bancaria') || null;
      setUploadedFile(infoFile);

      setLoading(false);
    } catch (err) {
      console.error("Error obteniendo datos de información bancaria:", err);
      setError("Error obteniendo datos");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (originalData) {
      setData({ ...originalData });
      setFile(null);
      setFileName("");
      // Si se cancelan los cambios, restaurar el archivo original
      fetchData();
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No se encontró el token de autenticación");
        return;
      }

      const requestData = {
        caracterizacion_id: id,
        "Banco": data["Banco"],
        "Tipo de cuenta": data["Tipo de cuenta"],
        "Número de cuenta": data["Número de cuenta"],
        "Tipo de documento titular": data["Tipo de documento titular"],
        "Número de identificación": data["Número de identificación"],
      };

      if (recordId) {
        // Actualizar (PUT)
        await axios.put(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_informacion_bancaria/record/${recordId}`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Crear (POST)
        const createResponse = await axios.post(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_informacion_bancaria/record`,
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecordId(createResponse.data.id);
      }

      alert("Información guardada exitosamente");
      await fetchData();
    } catch (err) {
      console.error("Error guardando la información bancaria:", err);
      setError("Error guardando la información");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      formData.append('source', 'info_bancaria');

      await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/tables/pi_informacion_bancaria/record/${id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert("Archivo subido exitosamente");
      await fetchData();
      setFile(null);
      setFileName("");
    } catch (error) {
      console.error('Error subiendo el archivo:', error);
      setError('Error subiendo el archivo');
    }
  };

  return (
    <div>
      <h3>Información bancaria</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div style={{ maxWidth: '600px' }}>
          <div className="card p-3 mb-3">
            <h5>Información para el pago</h5>
            
            <div className="mb-2">
              <label><strong>Banco</strong></label><br/>
              <select
                className="form-select"
                name="Banco"
                value={data["Banco"]}
                onChange={handleChange}
              >
                <option value="">Seleccionar...</option>
                {bancos.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label><strong>Tipo de cuenta</strong></label><br/>
              <select
                className="form-select"
                name="Tipo de cuenta"
                value={data["Tipo de cuenta"]}
                onChange={handleChange}
              >
                <option value="">Seleccionar...</option>
                {tiposCuenta.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label><strong>Número de cuenta</strong></label><br/>
              <input
                type="number"
                className="form-control"
                name="Número de cuenta"
                value={data["Número de cuenta"]}
                onChange={handleChange}
                placeholder="Ej: 3582004071"
              />
            </div>

            <div className="mb-2">
              <label><strong>Tipo de documento titular</strong></label><br/>
              <select
                className="form-select"
                name="Tipo de documento titular"
                value={data["Tipo de documento titular"]}
                onChange={handleChange}
              >
                <option value="">Seleccionar...</option>
                {tiposDocumento.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label><strong>Número de identificación</strong></label><br/>
              <input
                type="number"
                className="form-control"
                name="Número de identificación"
                value={data["Número de identificación"]}
                onChange={handleChange}
                placeholder="Ej: 1010239532"
              />
            </div>

            {/* Adjuntar archivo justo debajo del campo Número de identificación */}
            <div className="mb-2">
              <label><strong>Adjuntar archivo</strong></label><br/>
              {uploadedFile ? (
                <div className="mb-2">
                  <a
                    href={`https://impulso-local-back.onrender.com${uploadedFile.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: '10px' }}
                  >
                    Ver archivo
                  </a>
                </div>
              ) : (
                <p className="mb-2">No hay archivo adjunto</p>
              )}

              {file ? (
                <form onSubmit={handleFileUpload}>
                  <div className="form-group mb-2">
                    <label>Nombre del archivo</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Nombre del archivo sin extensión"
                    />
                  </div>
                  <button type="submit" className="btn btn-success btn-sm me-2">
                    Cargar archivo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setFile(null); setFileName(""); }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="mt-2">
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

InfoBancariaTab.propTypes = {
  id: PropTypes.string.isRequired,
};

