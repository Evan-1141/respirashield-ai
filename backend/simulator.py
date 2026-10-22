#!/usr/bin/env python3
"""
RespiraShield AI - IoT Telemetry Simulator
Mengirimkan simulasi pembacaan kualitas udara multi-sensor ke backend API.
"""

import time
import math
import random
import argparse
from datetime import datetime, timezone
import requests

DEFAULT_URL = 'http://127.0.0.1:8000/sensor/readings'
DEFAULT_TOKEN = 'respirashield-secret-token-2026'
DEFAULT_DEVICE = 'RSH-ESP32-001'

def generate_telemetry(anomaly=False):
    now = datetime.now(timezone.utc)
    hour = now.hour
    day_factor = math.sin((hour - 6) * math.pi / 12)

    if anomaly:
        pm25 = round(random.uniform(95.0, 160.0), 1)
        pm10 = round(random.uniform(140.0, 220.0), 1)
        so2 = round(random.uniform(35.0, 65.0), 1)
        no2 = round(random.uniform(65.0, 95.0), 1)
        co = round(random.uniform(2.8, 5.0), 2)
        o3 = round(random.uniform(80.0, 120.0), 1)
        temp = round(random.uniform(32.0, 36.0), 1)
        hum = round(random.uniform(80.0, 92.0), 1)
    else:
        pm25 = max(5.0, round(28.0 + day_factor * 15.0 + random.uniform(-4.0, 4.0), 1))
        pm10 = max(10.0, round(45.0 + day_factor * 20.0 + random.uniform(-6.0, 6.0), 1))
        so2 = max(1.0, round(6.5 + day_factor * 3.0 + random.uniform(-1.5, 1.5), 1))
        no2 = max(5.0, round(22.0 + day_factor * 10.0 + random.uniform(-3.0, 3.0), 1))
        co = max(0.1, round(0.5 + day_factor * 0.2 + random.uniform(-0.08, 0.08), 2))
        o3 = max(8.0, round(32.0 + day_factor * 12.0 + random.uniform(-4.0, 4.0), 1))
        temp = round(28.0 + day_factor * 3.5 + random.uniform(-0.8, 0.8), 1)
        hum = round(68.0 - day_factor * 12.0 + random.uniform(-2.5, 2.5), 1)

    return {
        'PM2_5': pm25,
        'PM10': pm10,
        'SO2': so2,
        'NO2': no2,
        'CO': co,
        'O3': o3,
        'Suhu_Udara': temp,
        'Kelembaban_Udara': hum
    }

def send_reading(url, device_id, token, readings, source='simulation'):
    payload = {
        'device_id': device_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'source': source,
        'readings': readings
    }
    headers = {
        'Content-Type': 'application/json',
        'X-Device-Token': token
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=5)
        now_str = datetime.now().strftime('%H:%M:%S')
        if res.status_code == 201:
            data = res.json()
            r_id = data.get('reading_id')
            p25 = readings['PM2_5']
            p10 = readings['PM10']
            tmp = readings['Suhu_Udara']
            print(f"[{now_str}] OK #{r_id} | Device: {device_id} | PM2.5: {p25} | PM10: {p10} | Temp: {tmp}C")
            return True
        else:
            print(f"[{now_str}] FAIL ({res.status_code}): {res.text}")
            return False
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='RespiraShield AI IoT Simulator')
    parser.add_argument('--url', default=DEFAULT_URL, help='API URL endpoint')
    parser.add_argument('--device-id', default=DEFAULT_DEVICE, help='Device identifier')
    parser.add_argument('--token', default=DEFAULT_TOKEN, help='Device authentication token')
    parser.add_argument('--burst', type=int, default=0, help='Send N readings immediately and stop')
    parser.add_argument('--interval', type=int, default=5, help='Seconds between telemetry packets')
    parser.add_argument('--anomaly', action='store_true', help='Simulate severe pollution spike')

    args = parser.parse_args()

    mode_label = f"BURST ({args.burst})" if args.burst > 0 else f"CONTINUOUS ({args.interval}s)"
    cond_label = "POLLUTION SPIKE" if args.anomaly else "NORMAL VARIATION"
    print("=== RespiraShield AI Simulator ===")
    print(f"Target URL : {args.url}")
    print(f"Device ID  : {args.device_id}")
    print(f"Mode       : {mode_label}")
    print(f"Condition  : {cond_label}")
    print("----------------------------------")

    if args.burst > 0:
        success_count = 0
        for i in range(args.burst):
            readings = generate_telemetry(args.anomaly)
            if send_reading(args.url, args.device_id, args.token, readings):
                success_count += 1
            if i < args.burst - 1:
                time.sleep(1)
        print(f"Burst completed: {success_count}/{args.burst} succeeded.")
    else:
        try:
            while True:
                readings = generate_telemetry(args.anomaly)
                send_reading(args.url, args.device_id, args.token, readings)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nSimulator stopped by user.")

if __name__ == '__main__':
    main()
