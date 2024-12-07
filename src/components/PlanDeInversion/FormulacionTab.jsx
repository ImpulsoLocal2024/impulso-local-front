import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function FormulacionTab({ id }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Campos del nuevo rubro a agregar
  const [newRubro, setNewRubro] = useState({
    Rubro: "",
    Elemento: "",
    Descripcion: "",
    Cantidad: "",
    Valor_Unitario: "",
  });

  const rubrosOptions = [
    "Maquinaria",
    "Herramientas",
    "Mobiliario",
    "Equipoy/o similares",
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No se encontró el token de autenticación");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/records?caracterizacion_id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRecords(response.data || []);
      } catch (error) {
        console.error("Error obteniendo registros de formulación:", error);
      } finally {
        setLoading(false);
      }
    };

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

      // Validaciones mínimas
      if (!newRubro.Rubro || !newRubro.Elemento || !newRubro.Cantidad || !newRubro.Valor_Unitario) {
        alert("Por favor completa todos los campos requeridos.");
        return;
      }

      const requestData = {
        caracterizacion_id: id,
        Rubro: newRubro.Rubro,
        Elemento: newRubro.Elemento,
        Descripcion: newRubro.Descripcion,
        Cantidad: parseInt(newRubro.Cantidad, 10),
        "Valor Unitario": parseFloat(newRubro.Valor_Unitario),
      };

      const response = await axios.post(
        `https://impulso-local-back.onrender.com/api/inscriptions/pi/tables/pi_formulacion/record`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Agregar el nuevo registro a la lista local
      setRecords((prev) => [...prev, response.data]);
      // Resetear el formulario
      setNewRubro({
        Rubro: "",
        Elemento: "",
        Descripcion: "",
        Cantidad: "",
        Valor_Unitario: "",
      });

      alert("Rubro guardado exitosamente");
    } catch (error) {
      console.error("Error guardando el rubro:", error);
      alert("Hubo un error al guardar el rubro");
    }
  };

  // Calcular resumen por rubro
  const resumenPorRubro = rubrosOptions.map((r) => {
    const total = records
      .filter((rec) => rec.Rubro === r)
      .reduce((sum, rec) => sum + (rec.Cantidad * rec["Valor Unitario"]), 0);
    return { rubro: r, total };
  });

  const totalInversion = resumenPorRubro.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h3>Formulación del Plan de Inversión</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div>
          {/* Lista de registros existentes */}
          <ol className="list-group list-group-numbered mb-3">
            {records.map((rec, index) => (
              <li key={rec.id} className="list-group-item">
                <div>
                  <strong>{index + 1}. {rec.Rubro}</strong> - {rec.Elemento} - {rec.Descripcion || "Sin descripción"}
                  <br />
                  Cantidad: {rec.Cantidad} | Valor Unitario: ${rec["Valor Unitario"].toLocaleString()}
                  <br />
                  Valor Total: ${(rec.Cantidad * rec["Valor Unitario"]).toLocaleString()}
                </div>
              </li>
            ))}
          </ol>

          {/* Formulario para agregar nuevo rubro */}
          <div className="card p-3 mb-3">
            <h5>Agregar nuevo rubro</h5>
            <div className="row mb-2">
              <div className="col-md-4">
                <label>Rubro</label>
                <select
                  className="form-select"
                  name="Rubro"
                  value={newRubro.Rubro}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar...</option>
                  {rubrosOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label>Elemento</label>
                <input
                  type="text"
                  className="form-control"
                  name="Elemento"
                  value={newRubro.Elemento}
                  onChange={handleChange}
                  placeholder="Ej: Par, Kgs, Und"
                />
              </div>
              <div className="col-md-4">
                <label>Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  name="Descripcion"
                  value={newRubro.Descripcion}
                  onChange={handleChange}
                  placeholder="Descripción"
                />
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-md-4">
                <label>Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  name="Cantidad"
                  value={newRubro.Cantidad}
                  onChange={handleChange}
                  placeholder="Cantidad"
                />
              </div>
              <div className="col-md-4">
                <label>Valor Unitario</label>
                <input
                  type="number"
                  className="form-control"
                  name="Valor_Unitario"
                  value={newRubro.Valor_Unitario}
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
                  <td>${r.total.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>${totalInversion.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td>Monto disponible</td>
                <td>$3.000.000</td>
              </tr>
              <tr>
                <td>Contrapartida</td>
                <td style={{color: "red"}}>$600.000</td>
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

