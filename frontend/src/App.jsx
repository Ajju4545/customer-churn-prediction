import { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    tenure: "",
    monthly_charges: "",
    total_charges: "",
    contract: "Month-to-month",
    internet_service: "DSL",
    payment_method: "Electronic check",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenure: Number(formData.tenure),
          monthly_charges: Number(formData.monthly_charges),
          total_charges: Number(formData.total_charges),
          contract: formData.contract,
          internet_service: formData.internet_service,
          payment_method: formData.payment_method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed");
      }

      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="container">

        <div className="header">
          <p className="tag">AI / MACHINE LEARNING</p>

          <h1>
            Customer Churn <span>Prediction</span>
          </h1>

          <p className="subtitle">
            Predict whether a customer is likely to leave the service.
          </p>
        </div>

        <div className="card">

          <form onSubmit={handleSubmit}>

            <div className="grid">

              <div className="input-group">
                <label>Tenure (Months)</label>
                <input
                  type="number"
                  name="tenure"
                  placeholder="e.g. 24"
                  value={formData.tenure}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Monthly Charges</label>
                <input
                  type="number"
                  step="0.01"
                  name="monthly_charges"
                  placeholder="e.g. 75.50"
                  value={formData.monthly_charges}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Total Charges</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_charges"
                  placeholder="e.g. 1800"
                  value={formData.total_charges}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Contract</label>
                <select
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                >
                  <option>Month-to-month</option>
                  <option>One year</option>
                  <option>Two year</option>
                </select>
              </div>

              <div className="input-group">
                <label>Internet Service</label>
                <select
                  name="internet_service"
                  value={formData.internet_service}
                  onChange={handleChange}
                >
                  <option>DSL</option>
                  <option>Fiber optic</option>
                  <option>No</option>
                </select>
              </div>

              <div className="input-group">
                <label>Payment Method</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option>Electronic check</option>
                  <option>Mailed check</option>
                  <option>Bank transfer (automatic)</option>
                  <option>Credit card (automatic)</option>
                </select>
              </div>

            </div>

            <button className="predict-btn" type="submit">
              {loading ? "Predicting..." : "Predict Churn"}
            </button>

          </form>

          {result && !result.error && (
            <div
              className={`result ${
                result.prediction === 1 ? "danger" : "success"
              }`}
            >
              <div className="result-icon">
                {result.prediction === 1 ? "⚠️" : "✓"}
              </div>

              <h2>{result.result}</h2>

              <p>Churn Probability</p>

              <div className="probability">
                {result.churn_probability}%
              </div>

              <div className="progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${result.churn_probability}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="error">
              ❌ {result.error}
            </div>
          )}

        </div>

        <footer>
          Customer Churn Prediction • Machine Learning Project
        </footer>

      </div>
    </div>
  );
}

export default App;