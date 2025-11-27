# MQTT Setup Guide

This guide explains how to set up MQTT communication between ESP32 devices and the backend server.

## Architecture Overview

```
ESP32 (RFID Reader)  →  MQTT Broker  →  Backend Server  →  Database
                           ↑
                           └─── Publishes lesson status updates
```

## Step 1: Choose an MQTT Broker

### Option A: HiveMQ Public Broker (Free, for Testing)

- **URL**: `mqtt://broker.hivemq.com:1883`
- **Authentication**: None required
- **Limitations**: Public, no security, may have rate limits
- **Best for**: Development and testing

### Option B: HiveMQ Cloud (Free Tier Available)

1. Sign up at https://www.hivemq.com/cloud/
2. Create a cluster
3. Create credentials
4. Use the provided broker URL (e.g., `mqtts://YOUR_CLUSTER_ID.s1.eu.hivemq.cloud:8883`)
5. **Note**: Uses MQTT over SSL (mqtts://) - requires SSL certificate handling

### Option C: Self-Hosted Mosquitto (Local Network)

1. Install Mosquitto on your server/computer
2. Configure Mosquitto (default port: 1883)
3. Use: `mqtt://YOUR_SERVER_IP:1883`
4. **Best for**: Local network deployment

## Step 2: Configure Backend

### 2.1 Create `.env` file

Create a `.env` file in `projeto-presenca-backend/` with the following:

```env
# Database
DATABASE_URL="file:./prisma/data.db"

# MQTT Broker Configuration
MQTT_BROKER_URL="mqtt://broker.hivemq.com:1883"

# MQTT Authentication (optional, leave empty if not needed)
MQTT_BROKER_USERNAME=""
MQTT_BROKER_PASSWORD=""
```

### 2.2 For HiveMQ Cloud (with authentication):

```env
MQTT_BROKER_URL="mqtts://YOUR_CLUSTER_ID.s1.eu.hivemq.cloud:8883"
MQTT_BROKER_USERNAME="your_username"
MQTT_BROKER_PASSWORD="your_password"
```

### 2.3 Install Dependencies

Dependencies are already installed, but if needed:

```bash
cd projeto-presenca-backend
npm install
```

### 2.4 Start Backend Server

```bash
npm run dev
```

The server will:
- Connect to MQTT broker
- Subscribe to RFID attendance events
- Listen for RFID tag reads from ESP32 devices

## Step 3: Configure ESP32

### 3.1 Install Arduino Libraries

Install the following libraries in Arduino IDE:

1. **WiFi** (usually included with ESP32 board support)
2. **PubSubClient** by Nick O'Leary
   - Install via: Sketch → Include Library → Manage Libraries → Search "PubSubClient"
3. **MFRC522** by GithubCommunity
   - Install via: Sketch → Include Library → Manage Libraries → Search "MFRC522"

### 3.2 Configure ESP32 Code

**⚠️ IMPORTANTE:** Devido a problemas de hardware com WiFi no ESP32, a solução atual usa **Serial + Node.js bridge**.

**Use a solução Serial (recomendada):**
- Arquivo: `esp32-rfid-serial.ino` (na raiz do projeto)
- Veja `SERIAL_SETUP.md` para instruções completas
- O ESP32 apenas lê RFID e envia via Serial
- Um script Node.js (`serial-to-mqtt.js`) faz a ponte Serial → MQTT

**Solução WiFi/MQTT direta (não recomendada - problemas de hardware):**
Se você quiser tentar WiFi/MQTT direto no ESP32, você precisaria criar seu próprio código baseado em `esp32-rfid-serial.ino` adicionando WiFi e MQTT, mas isso pode causar resets devido a problemas de alimentação.

### 3.3 Upload to ESP32

1. Abra `esp32-rfid-serial.ino` no Arduino IDE
2. Selecione a placa ESP32 correta
3. Selecione a porta COM correta
4. Faça upload do código

### 3.4 Verify Connection

Abra Serial Monitor (115200 baud) e verifique:
- ✅ ESP32 identificado (mostra MAC address)
- ✅ RC522 OK
- ✅ Sistema pronto

## Step 4: Test the System

### 4.1 Create a Lesson (via API)

```bash
curl -X POST http://localhost:3001/lessons \
  -H "Content-Type: application/json" \
  -d '{
    "room": "Sala 101",
    "subject": "Matemática",
    "teacherId": 1,
    "startTime": "2025-11-10T08:00:00Z",
    "endTime": "2025-11-10T10:00:00Z"
  }'
```

### 4.2 Open the Lesson

```bash
curl -X POST http://localhost:3001/lessons/1/open
```

This will:
- Mark the lesson as open in the database
- Publish MQTT message to ESP32 devices in that room
- ESP32 will receive the "opened" status

### 4.3 Test RFID Reading

1. Place an RFID card on the reader
2. ESP32 should:
   - Read the card UID
   - Publish to MQTT
   - Receive response from backend
   - Blink LED to indicate success/failure

### 4.4 Verify Attendance

```bash
curl http://localhost:3001/lessons/1/students
```

You should see the student marked as present.

### 4.5 Close the Lesson

```bash
curl -X POST http://localhost:3001/lessons/1/close
```

## MQTT Topic Structure

### Topics ESP32 Publishes To:
- `presenca/attendance/{room}/{esp32Id}/tag-read`
  - Message: `{"tagId":"AB:CD:EF:12","room":"Sala 101","esp32Id":"esp32-rfid-001","timestamp":"..."}`

### Topics ESP32 Subscribes To:
- `presenca/commands/{room}/lesson-status`
  - Message: `{"lessonId":1,"room":"Sala 101","status":"opened","timestamp":"..."}`
  
- `presenca/response/{esp32Id}/attendance-result`
  - Message: `{"success":true,"message":"Presença registrada para João","tagId":"AB:CD:EF:12","lessonId":1,"studentName":"João"}`

## Troubleshooting

### ESP32 Cannot Connect to WiFi
- Check WiFi SSID and password
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

### ESP32 Cannot Connect to MQTT
- Verify MQTT broker URL and port
- Check if broker requires authentication
- Ensure ESP32 has internet connection
- Check firewall settings

### Backend Cannot Connect to MQTT
- Verify `MQTT_BROKER_URL` in `.env` file
- Check if broker requires authentication
- Ensure backend has internet connection
- Check broker logs

### RFID Tags Not Being Registered
- Verify lesson is open (`POST /lessons/:id/open`)
- Check room name matches in ESP32 code and lesson
- Verify student's tagId is registered in database
- Check Serial Monitor for error messages
- Verify MQTT messages are being published/received

### Multiple ESP32s in Same Room
- Each ESP32 should have a unique `MQTT_CLIENT_ID`
- All ESP32s in the same room should use the same `ROOM_NAME`
- They will all receive the same lesson status updates

## Security Considerations

### For Production:
1. Use MQTT over SSL/TLS (mqtts://)
2. Enable authentication on MQTT broker
3. Use unique credentials for each ESP32
4. Implement certificate-based authentication
5. Use a private MQTT broker (not public)

## Next Steps

1. Set up a production MQTT broker
2. Implement authentication and encryption
3. Add error handling and retry logic
4. Implement device registration system
5. Add monitoring and logging

