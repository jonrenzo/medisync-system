# app.py - Enhanced Version with Better Pattern Detection
import os
from pathlib import Path
from datetime import datetime, timedelta
import itertools
import warnings

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
from dotenv import load_dotenv
from sklearn.metrics import mean_absolute_error, mean_squared_error

import math


def sanitize_nan(obj):
    """Recursively replace NaN or Inf with None so JSON serialization succeeds."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nan(v) for v in obj]
    return obj


# -------------------- SETUP --------------------
warnings.filterwarnings("ignore")

env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase credentials in .env.local")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="MediSync ARIMAX Predictor", version="4.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- MODELS --------------------
class PredictRequest(BaseModel):
    item_code: str
    months: int = 3


# -------------------- HELPER FUNCTIONS --------------------

def detect_patterns(ts: pd.Series):
    """
    Detect seasonality, trend, and volatility in the data
    """
    patterns = {
        'has_trend': False,
        'has_seasonality': False,
        'volatility': 'low',
        'trend_direction': 'stable'
    }

    if len(ts) < 4:
        return patterns

    # Check for trend using linear regression slope
    X = np.arange(len(ts)).reshape(-1, 1)
    y = ts.values

    # Calculate slope
    slope = np.polyfit(X.flatten(), y, 1)[0]
    mean_value = np.mean(y)

    # Trend detection (slope > 5% of mean per period)
    if abs(slope) > 0.05 * mean_value:
        patterns['has_trend'] = True
        patterns['trend_direction'] = 'increasing' if slope > 0 else 'decreasing'

    # Volatility (coefficient of variation)
    cv = np.std(y) / (np.mean(y) + 1e-10)
    if cv > 0.5:
        patterns['volatility'] = 'high'
    elif cv > 0.2:
        patterns['volatility'] = 'medium'

    # Seasonality detection (if enough data)
    if len(ts) >= 12:
        try:
            # Check for seasonal patterns
            decomposition = seasonal_decompose(ts, model='additive', period=min(12, len(ts) // 2),
                                               extrapolate_trend='freq')
            seasonal_strength = np.std(decomposition.seasonal) / (np.std(ts) + 1e-10)
            if seasonal_strength > 0.1:
                patterns['has_seasonality'] = True
        except:
            pass

    return patterns


def preprocess_timeseries(ts: pd.Series, apply_smoothing=True):
    """
    Preprocessing with optional smoothing based on data characteristics
    """
    # Remove duplicates
    ts = ts[~ts.index.duplicated(keep='last')]
    ts = ts.sort_index()

    # Handle zeros and negatives
    ts = ts.clip(lower=1)  # Minimum value of 1

    # Detect and handle outliers more conservatively
    Q1 = ts.quantile(0.25)
    Q3 = ts.quantile(0.75)
    IQR = Q3 - Q1

    if IQR > 0:
        # More lenient outlier bounds (4 IQR instead of 3)
        lower_bound = Q1 - 4 * IQR
        upper_bound = Q3 + 4 * IQR
        ts = ts.clip(lower=max(1, lower_bound), upper=upper_bound)

    # Fill missing dates
    ts = ts.asfreq("MS")
    ts = ts.interpolate(method='linear', limit_direction='both')

    # Only apply light smoothing if data is very volatile
    if apply_smoothing:
        cv = np.std(ts.values) / (np.mean(ts.values) + 1e-10)
        if cv > 0.5:  # Only smooth high volatility data
            # Very light smoothing to preserve patterns
            ts = ts.ewm(span=2, adjust=False).mean()

    return ts


def fit_exponential_smoothing(ts: pd.Series, periods: int):
    """
    Fit Exponential Smoothing (Holt-Winters) model
    """
    try:
        # Determine if we should use seasonal model
        use_seasonal = len(ts) >= 24

        if use_seasonal:
            model = ExponentialSmoothing(
                ts,
                seasonal_periods=12,
                trend='add',
                seasonal='add',
                damped_trend=True
            )
        else:
            model = ExponentialSmoothing(
                ts,
                trend='add',
                damped_trend=False
            )

        fitted = model.fit(optimized=True, remove_bias=True)
        forecast = fitted.forecast(steps=periods)

        # Calculate confidence intervals based on residuals
        residuals = ts - fitted.fittedvalues
        std_error = np.std(residuals)

        # Wider confidence intervals for longer forecasts
        ci_multiplier = 1.96 + (0.1 * np.arange(periods))

        lower_ci = forecast - (std_error * ci_multiplier)
        upper_ci = forecast + (std_error * ci_multiplier)

        return fitted, forecast, lower_ci, upper_ci, 'exponential_smoothing'
    except Exception as e:
        print(f"Exponential smoothing failed: {e}")
        return None, None, None, None, None


def fit_arima_model(ts: pd.Series, periods: int, patterns: dict):
    """
    Fit ARIMA model with parameters based on detected patterns
    """
    best_model = None
    best_aic = np.inf
    best_order = None

    # Adjust search space based on patterns
    if patterns['has_trend']:
        d_range = [1, 2]
    else:
        d_range = [0, 1]

    if patterns['volatility'] == 'high':
        p_range = [1, 2, 3]
        q_range = [1, 2, 3]
    else:
        p_range = [0, 1, 2]
        q_range = [0, 1, 2]

    # Grid search
    for p in p_range:
        for d in d_range:
            for q in q_range:
                if p == 0 and d == 0 and q == 0:
                    continue

                try:
                    model = ARIMA(ts, order=(p, d, q), enforce_stationarity=False, enforce_invertibility=False)
                    fitted = model.fit(method_kwargs={"maxiter": 500})

                    if fitted.aic < best_aic:
                        best_aic = fitted.aic
                        best_model = fitted
                        best_order = (p, d, q)
                except:
                    continue

    if best_model is None:
        return None, None, None, None, None

    try:
        # Generate forecast
        forecast_result = best_model.get_forecast(steps=periods)
        forecast = forecast_result.predicted_mean
        conf_int = forecast_result.conf_int()

        return best_model, forecast, conf_int.iloc[:, 0], conf_int.iloc[:, 1], best_order
    except:
        return None, None, None, None, None


def fit_seasonal_arima(ts: pd.Series, periods: int):
    """
    Fit Seasonal ARIMA (SARIMA) model
    """
    if len(ts) < 24:
        return None, None, None, None, None

    try:
        # Try a few promising SARIMA configurations
        configs = [
            ((1, 1, 1), (1, 1, 1, 12)),
            ((0, 1, 1), (0, 1, 1, 12)),
            ((1, 1, 0), (1, 1, 0, 12)),
            ((2, 1, 2), (1, 1, 1, 12)),
        ]

        best_model = None
        best_aic = np.inf
        best_order = None

        for order, seasonal_order in configs:
            try:
                model = SARIMAX(
                    ts,
                    order=order,
                    seasonal_order=seasonal_order,
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                fitted = model.fit(disp=False, maxiter=500)

                if fitted.aic < best_aic:
                    best_aic = fitted.aic
                    best_model = fitted
                    best_order = (order, seasonal_order)
            except:
                continue

        if best_model is None:
            return None, None, None, None, None

        forecast_result = best_model.get_forecast(steps=periods)
        forecast = forecast_result.predicted_mean
        conf_int = forecast_result.conf_int()

        return best_model, forecast, conf_int.iloc[:, 0], conf_int.iloc[:, 1], best_order
    except Exception as e:
        print(f"SARIMA failed: {e}")
        return None, None, None, None, None


def run_arimax(ts: pd.Series, periods: int = 6):
    """
    Main forecasting function with model ensemble approach
    """
    # Detect patterns in the data
    patterns = detect_patterns(ts)
    print(f"Detected patterns: {patterns}")

    # Preprocess - use light smoothing only if very volatile
    ts_clean = preprocess_timeseries(ts, apply_smoothing=(patterns['volatility'] == 'high'))

    if len(ts_clean) < 6:
        raise ValueError("Not enough valid data points (need at least 6)")

    # Generate future dates
    last_date = ts_clean.index[-1]
    future_dates = pd.date_range(
        start=last_date + pd.DateOffset(months=1),
        periods=periods,
        freq="MS"
    )

    # Try multiple models and pick the best
    models_tried = []

    # 1. Try Seasonal ARIMA if we have enough data and detected seasonality
    if patterns['has_seasonality'] and len(ts_clean) >= 24:
        sarima_model, sarima_forecast, sarima_lower, sarima_upper, sarima_order = fit_seasonal_arima(ts_clean, periods)
        if sarima_model is not None:
            models_tried.append({
                'name': 'SARIMA',
                'model': sarima_model,
                'forecast': sarima_forecast,
                'lower': sarima_lower,
                'upper': sarima_upper,
                'order': sarima_order,
                'aic': sarima_model.aic
            })

    # 2. Try standard ARIMA
    arima_model, arima_forecast, arima_lower, arima_upper, arima_order = fit_arima_model(ts_clean, periods, patterns)
    if arima_model is not None:
        models_tried.append({
            'name': 'ARIMA',
            'model': arima_model,
            'forecast': arima_forecast,
            'lower': arima_lower,
            'upper': arima_upper,
            'order': arima_order,
            'aic': arima_model.aic
        })

    # 3. Try Exponential Smoothing (often better for inventory data)
    es_model, es_forecast, es_lower, es_upper, es_name = fit_exponential_smoothing(ts_clean, periods)
    if es_model is not None:
        models_tried.append({
            'name': 'Exponential_Smoothing',
            'model': es_model,
            'forecast': es_forecast,
            'lower': es_lower,
            'upper': es_upper,
            'order': 'exp_smoothing',
            'aic': es_model.aic if hasattr(es_model, 'aic') else np.inf
        })

    # Select best model based on AIC and forecast reasonableness
    best_model_info = None

    if models_tried:
        # Sort by AIC
        models_tried.sort(key=lambda x: x['aic'])

        # Pick the best model that has reasonable forecasts
        for model_info in models_tried:
            forecast_mean = np.mean(model_info['forecast'])
            ts_mean = np.mean(ts_clean.values[-12:])  # Recent mean

            # Check if forecast is reasonable (within 3x of recent mean)
            if 0 < forecast_mean < ts_mean * 3:
                best_model_info = model_info
                break

        # If no reasonable forecast, use the first one anyway
        if best_model_info is None:
            best_model_info = models_tried[0]

    # If all models failed, use last value carried forward with slight trend
    if best_model_info is None:
        print("All models failed, using naive forecast")
        last_values = ts_clean.values[-6:]
        trend = (last_values[-1] - last_values[0]) / len(last_values)

        forecast = np.array([ts_clean.values[-1] + trend * (i + 1) for i in range(periods)])
        forecast = np.maximum(forecast, 1)

        std_dev = np.std(ts_clean.values[-12:])
        lower = np.maximum(forecast - std_dev * 1.96, 1)
        upper = forecast + std_dev * 1.96

        predictions = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "forecast": round(float(pred), 2),
                "lower_ci": round(float(ci_l), 2),
                "upper_ci": round(float(ci_u), 2)
            }
            for date, pred, ci_l, ci_u in zip(future_dates, forecast, lower, upper)
        ]

        return predictions, "naive_with_trend", None

    # Use best model's forecast
    forecast = np.maximum(best_model_info['forecast'].values, 1)
    lower = np.maximum(best_model_info['lower'].values, 1)
    upper = np.maximum(best_model_info['upper'].values, 1)

    # Calculate MAPE on fitted values
    try:
        fitted = best_model_info['model'].fittedvalues[-12:]
        actual = ts_clean.values[-12:]
        mape = np.mean(np.abs((actual - fitted) / actual)) * 100
    except:
        mape = None

    predictions = [
        {
            "date": date.strftime("%Y-%m-%d"),
            "forecast": round(float(pred), 2),
            "lower_ci": round(float(ci_l), 2),
            "upper_ci": round(float(ci_u), 2)
        }
        for date, pred, ci_l, ci_u in zip(future_dates, forecast, lower, upper)
    ]

    print(f"Selected model: {best_model_info['name']} with order {best_model_info['order']}")

    return predictions, best_model_info['order'], mape


@app.post("/predict")
def predict(req: PredictRequest):
    """
    Enhanced prediction endpoint
    """
    response = (
        supabase.table("monthlysummary")
        .select("reportid, stockonhand, itemcode, month, year")
        .ilike("itemcode", req.item_code.strip())
        .execute()
    )

    if not response.data or len(response.data) < 6:
        raise HTTPException(
            status_code=404,
            detail=f"Not enough data for {req.item_code}. Need at least 6 months, found {len(response.data) if response.data else 0}",
        )

    df = pd.DataFrame(response.data)
    df = df.sort_values(["year", "month"])

    # Create proper date index
    df["date"] = pd.to_datetime(
        df["year"].astype(str) + "-" + df["month"].astype(str).str.zfill(2) + "-01"
    )

    ts = pd.Series(df["stockonhand"].values, index=df["date"])
    ts.index = pd.DatetimeIndex(ts.index)

    try:
        predictions, best_order, accuracy = run_arimax(ts, periods=req.months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Combine historical + forecast
    history = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "stockonhand": int(v) if not np.isnan(v) else 0
        }
        for d, v in zip(ts.index, ts.values)
    ]

    result = {
        "item_code": req.item_code,
        "rows_used": len(df),
        "model_order": str(best_order),
        "accuracy_mape": accuracy,
        "history": history,
        "predictions": predictions,
    }

    return sanitize_nan(result)


@app.get("/")
def root():
    return {"message": "MediSync Enhanced ARIMAX API v4.1"}


@app.get("/health")
def health():
    """Health check endpoint"""
    try:
        response = supabase.table("monthlysummary").select("itemcode", count="exact").limit(1).execute()
        return {
            "status": "healthy",
            "supabase": "connected",
            "sample_data": response.data[0] if response.data else None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/debug/{item_code}")
def debug_item(item_code: str):
    """Enhanced debug endpoint"""
    response = (
        supabase.table("monthlysummary")
        .select("month, year, stockonhand, itemcode")
        .ilike("itemcode", item_code.strip())
        .order("year", desc=False)
        .order("month", desc=False)
        .execute()
    )

    data = response.data if response.data else []

    # Calculate basic statistics and detect patterns
    if data:
        stocks = [d['stockonhand'] for d in data]
        ts = pd.Series(stocks)

        stats = {
            "mean": round(np.mean(stocks), 2),
            "median": round(np.median(stocks), 2),
            "std_dev": round(np.std(stocks), 2),
            "min": np.min(stocks),
            "max": np.max(stocks),
            "coefficient_of_variation": round(np.std(stocks) / (np.mean(stocks) + 1e-10), 2)
        }

        # Create a proper time series for pattern detection
        df_temp = pd.DataFrame(data)
        df_temp["date"] = pd.to_datetime(
            df_temp["year"].astype(str) + "-" + df_temp["month"].astype(str).str.zfill(2) + "-01"
        )
        ts_temp = pd.Series(df_temp["stockonhand"].values, index=df_temp["date"])
        patterns = detect_patterns(ts_temp)
    else:
        stats = None
        patterns = None

    return {
        "item_code_sent": item_code,
        "rows_found": len(data),
        "statistics": stats,
        "detected_patterns": patterns,
        "recent_data": data[-10:] if data else []
    }
