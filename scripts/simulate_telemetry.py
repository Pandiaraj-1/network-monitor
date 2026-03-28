import requests
import random
import time
import sys

BACKEND = "http://localhost:8080/api"
DEVICES = [
    {"deviceId": "router-01", "name": "Core Router", "type": "router", "ipAddress": "192.168.1.1"},
    {"deviceId": "switch-01", "name": "Floor Switch", "type": "switch", "ipAddress": "192.168.1.2"},
    {"deviceId": "endpoint-01", "name": "PC-1", "type": "endpoint", "ipAddress": "192.168.1.100"},
]


def register_devices():
    print("Registering devices...")
    for device in DEVICES:
        try:
            res = requests.post(f"{BACKEND}/devices", json=device, timeout=5)
            if res.status_code in [200, 201]:
                print(f"  ✅ {device['deviceId']} registered")
            elif res.status_code == 400:
                print(f"  ℹ️  {device['deviceId']} already exists")
        except Exception as e:
            print(f"  ❌ Failed to register {device['deviceId']}: {e}")


def generate_telemetry(device_id, is_anomaly=False):
    if is_anomaly:
        return {
            "deviceId": device_id,
            "latency": random.uniform(500, 5000),
            "packetLoss": random.uniform(10, 80),
            "bandwidth": random.uniform(1, 50),
            "cpuUsage": random.uniform(85, 99),
            "memoryUsage": random.uniform(85, 99),
        }
    else:
        return {
            "deviceId": device_id,
            "latency": random.uniform(5, 50),
            "packetLoss": random.uniform(0, 1),
            "bandwidth": random.uniform(800, 1000),
            "cpuUsage": random.uniform(10, 70),
            "memoryUsage": random.uniform(20, 75),
        }


def main():
    print("Network Monitor — Telemetry Simulator")
    print("=" * 40)

    # Check backend is running
    try:
        requests.get(f"{BACKEND}/devices", timeout=3)
    except Exception:
        print("❌ Spring Boot backend not reachable at localhost:8080")
        print("   Start it first with: mvn spring-boot:run")
        sys.exit(1)

    register_devices()
    print(f"\nSending telemetry every 2 seconds (Ctrl+C to stop)...\n")

    event_count = 0
    while True:
        for device in DEVICES:
            is_anomaly = random.random() < 0.10  # 10% chance

            telemetry = generate_telemetry(device["deviceId"], is_anomaly)

            try:
                requests.post(f"{BACKEND}/telemetry", json=telemetry, timeout=5)
                event_count += 1
                label = "⚠️  ANOMALY" if is_anomaly else "✅ normal "
                print(
                    f"{label} | {device['deviceId']:<15} | "
                    f"latency={telemetry['latency']:>7.1f}ms | "
                    f"cpu={telemetry['cpuUsage']:>5.1f}% | "
                    f"total events={event_count}"
                )
            except Exception as e:
                print(f"❌ Failed to send telemetry: {e}")

        time.sleep(2)


if __name__ == "__main__":
    main()