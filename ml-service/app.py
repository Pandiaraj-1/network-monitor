from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from kafka import KafkaConsumer
from pydantic import BaseModel
from anomaly_detector import AnomalyDetector
from datetime import datetime
import threading
import json
import logging

app = FastAPI(title="Network Anomaly Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = AnomalyDetector()
training_buffer = []
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

try:
    es = Elasticsearch("http://localhost:9200")
    es.info()
    log.info("Elasticsearch connected")
except Exception as e:
    log.warning(f"Elasticsearch not available: {e}")
    es = None


class TelemetryInput(BaseModel):
    deviceId: str
    latency: float
    packetLoss: float
    bandwidth: float
    cpuUsage: float
    memoryUsage: float


def process_event(event: dict):
    global training_buffer
    training_buffer.append(event)

    if len(training_buffer) == 50:
        detector.train(training_buffer)
        log.info("Model trained on 50 events")
    elif len(training_buffer) > 50:
        detector.train(training_buffer[-200:])

    result = detector.predict(event)

    if es:
        try:
            doc = {
                "deviceId": event.get("deviceId"),
                "timestamp": datetime.utcnow().isoformat(),
                "telemetry": event,
                "is_anomaly": result["is_anomaly"],
                "anomaly_score": result["score"],
                "reason": result["reason"]
            }
            es.index(index="anomalies", body=doc)
        except Exception as e:
            log.error(f"Failed to store in Elasticsearch: {e}")

    if result["is_anomaly"]:
        log.warning(f"ANOMALY for {event.get('deviceId')}: {result['reason']}")

    return result


def kafka_consumer_thread():
    try:
        consumer = KafkaConsumer(
            'telemetry-events',
            bootstrap_servers='localhost:9092',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='ml-service-group',
            auto_offset_reset='latest'
        )
        log.info("Kafka consumer started")
        for message in consumer:
            process_event(message.value)
    except Exception as e:
        log.error(f"Kafka consumer error: {e}")


threading.Thread(target=kafka_consumer_thread, daemon=True).start()


@app.get("/")
def health():
    return {
        "status": "running",
        "model_trained": detector.is_trained,
        "events_collected": len(training_buffer),
        "events_until_training": max(0, 50 - len(training_buffer))
    }


@app.post("/analyze")
def analyze(event: TelemetryInput):
    return process_event(event.dict())


@app.get("/anomalies/{device_id}")
def get_anomalies(device_id: str, size: int = 20):
    if not es:
        return []
    try:
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"deviceId.keyword": device_id}},
                        {"term": {"is_anomaly": True}}
                    ]
                }
            },
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": size
        }
        results = es.search(index="anomalies", body=query)
        return [hit["_source"] for hit in results["hits"]["hits"]]
    except Exception as e:
        log.error(f"Elasticsearch query failed: {e}")
        return []


@app.get("/stats")
def get_stats():
    return {
        "model_trained": detector.is_trained,
        "total_events": len(training_buffer),
        "events_until_training": max(0, 50 - len(training_buffer))
    }