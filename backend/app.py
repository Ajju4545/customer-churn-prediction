from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Customer Churn Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://customer-churn-prediction-ajay13.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load model files
model = joblib.load(
    os.path.join(BASE_DIR, "model", "churn_model.pkl")
)

scaler = joblib.load(
    os.path.join(BASE_DIR, "model", "scaler.pkl")
)

features = joblib.load(
    os.path.join(BASE_DIR, "model", "features.pkl")
)


class CustomerData(BaseModel):
    tenure: int
    monthly_charges: float
    total_charges: float
    contract: str
    internet_service: str
    payment_method: str


@app.get("/")
def home():
    return {
        "message": "Customer Churn Prediction API is running"
    }


@app.post("/predict")
def predict(data: CustomerData):

    input_data = pd.DataFrame(
        0,
        index=[0],
        columns=features
    )

    input_data["tenure"] = data.tenure
    input_data["MonthlyCharges"] = data.monthly_charges
    input_data["TotalCharges"] = data.total_charges

    contract_column = "Contract_" + data.contract
    internet_column = "InternetService_" + data.internet_service
    payment_column = "PaymentMethod_" + data.payment_method

    if contract_column in input_data.columns:
        input_data[contract_column] = 1

    if internet_column in input_data.columns:
        input_data[internet_column] = 1

    if payment_column in input_data.columns:
        input_data[payment_column] = 1

    input_scaled = scaler.transform(input_data)

    prediction = model.predict(input_scaled)[0]

    probability = model.predict_proba(input_scaled)[0][1]

    if prediction == 1:
        result = "Customer is likely to churn"
    else:
        result = "Customer is unlikely to churn"

    return {
        "prediction": int(prediction),
        "result": result,
        "churn_probability": round(float(probability) * 100, 2)
    }