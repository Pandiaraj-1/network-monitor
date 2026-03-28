import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.05,   # expect 5% anomalies
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.features = ['latency', 'packetLoss', 'bandwidth', 'cpuUsage', 'memoryUsage']

    def train(self, data: list):
        if len(data) < 20:
            return False
        df = pd.DataFrame(data)[self.features].fillna(0)
        scaled = self.scaler.fit_transform(df)
        self.model.fit(scaled)
        self.is_trained = True
        return True

    def predict(self, event: dict) -> dict:
        if not self.is_trained:
            return {"is_anomaly": False, "score": 0.0, "reason": "Model not trained yet"}

        # FIX 1: Pass data as a DataFrame to fix the feature names Warning
        df = pd.DataFrame([event])[self.features].fillna(0)
        scaled = self.scaler.transform(df)

        prediction = self.model.predict(scaled)[0]
        score = float(self.model.score_samples(scaled)[0])
        is_anomaly = bool(prediction == -1)

        # FIX 2: Hybrid override - check thresholds even if the ML model missed it
        reason = ""
        thresholds = {
            'latency': 200,
            'packetLoss': 5.0,
            'cpuUsage': 90.0,
            'memoryUsage': 90.0
        }

        for metric, threshold in thresholds.items():
            if event.get(metric, 0) > threshold:
                is_anomaly = True
                reason = f"High {metric}: {event.get(metric)}"
                break

        if is_anomaly and not reason:
            reason = "Statistical outlier detected"

        return {
            "is_anomaly": is_anomaly,
            "score": score,
            "reason": reason
        }