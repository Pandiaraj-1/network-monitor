import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from anomaly_detector import AnomalyDetector


def make_normal_events(n=60):
    return [
        {
            'latency': 10 + (i % 5),
            'packetLoss': 0.1,
            'bandwidth': 950.0,
            'cpuUsage': 40.0 + (i % 10),
            'memoryUsage': 60.0
        }
        for i in range(n)
    ]


def test_detector_initializes_untrained():
    detector = AnomalyDetector()
    assert detector.is_trained == False


def test_model_trains_successfully():
    detector = AnomalyDetector()
    result = detector.train(make_normal_events(50))
    assert result == True
    assert detector.is_trained == True


def test_training_fails_with_insufficient_data():
    detector = AnomalyDetector()
    result = detector.train(make_normal_events(10))
    assert result == False
    assert detector.is_trained == False


def test_normal_event_not_flagged():
    detector = AnomalyDetector()
    detector.train(make_normal_events(50))
    normal = {
        'latency': 12.0,
        'packetLoss': 0.1,
        'bandwidth': 950.0,
        'cpuUsage': 40.0,
        'memoryUsage': 60.0
    }
    result = detector.predict(normal)
    assert result['is_anomaly'] == False


def test_extreme_anomaly_detected():
    detector = AnomalyDetector()
    detector.train(make_normal_events(50))
    anomaly = {
        'latency': 9999.0,
        'packetLoss': 99.0,
        'bandwidth': 0.1,
        'cpuUsage': 99.0,
        'memoryUsage': 99.0
    }
    result = detector.predict(anomaly)
    assert result['is_anomaly'] == True


def test_returns_safe_default_before_training():
    detector = AnomalyDetector()
    event = {
        'latency': 100.0,
        'packetLoss': 0.5,
        'bandwidth': 500.0,
        'cpuUsage': 70.0,
        'memoryUsage': 80.0
    }
    result = detector.predict(event)
    assert result['is_anomaly'] == False
    assert result['reason'] == "Model not trained yet"