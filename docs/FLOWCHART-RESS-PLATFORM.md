# Flowchart RESS Platform

Dokumen ini merangkum MoM arsitektur awal RESS Platform dalam format yang siap dipakai untuk presentasi. Diagram utama cukup untuk satu slide; diagram detail dapat dipakai sebagai slide lanjutan.

## 1. Flowchart Utama

```mermaid
flowchart LR
    subgraph FIELD[Field Layer]
        METER[kWh Meter]
        PV[PV / Solar Panel]
        INV[Inverter]
        ENV[Environmental Sensors<br/>Temperature - Humidity - LDR]
    end

    CTRL[RESS Controller Board<br/>Data Collector]

    subgraph COMM[Communication Layer]
        MQTT[MQTT Telemetry]
        HTTPS[HTTPS / POST]
    end

    subgraph CLOUD[Cloud Platform]
        NGINX[Nginx<br/>Reverse Proxy & Load Balancer]
        FRONT[Frontend Dashboard<br/>Svelte + TailwindCSS + ECharts]
        BACK[Backend API<br/>TypeScript + Bun/Elysia or Deno]
        DB[(PostgreSQL<br/>Optional TimescaleDB)]
        BROKER[MQTT Broker]
    end

    USER[User / Operator<br/>Browser via HTTPS/TLS]

    METER --> CTRL
    PV --> CTRL
    INV --> CTRL
    ENV --> CTRL

    CTRL -->|Real-time telemetry| MQTT
    CTRL -->|REST data submission| HTTPS
    MQTT --> BROKER
    HTTPS --> NGINX
    BROKER --> BACK
    NGINX --> FRONT
    NGINX --> BACK
    BACK --> DB
    FRONT -->|Monitoring, analysis, management| USER
    USER -->|HTTPS/TLS| NGINX
```

## 2. Alur Data Telemetry

```mermaid
flowchart TD
    A[Data dari lapangan] --> B[RESS Controller Board]
    B --> C{Pilih jalur komunikasi}
    C -->|MQTT| D[Publish telemetry]
    D --> E[MQTT Broker]
    E --> F[Backend MQTT Consumer]
    C -->|HTTPS / POST| G[REST API Endpoint]
    G --> H[Backend API Validation]
    F --> I[Validasi dan normalisasi data]
    H --> I
    I --> J{Data valid?}
    J -->|Ya| K[Simpan ke PostgreSQL]
    J -->|Ya dan volume tinggi| L[Simpan sebagai time-series<br/>TimescaleDB]
    J -->|Tidak| M[Log error / reject payload]
    K --> N[Agregasi energi dan performa]
    L --> N
    N --> O[Dashboard, chart, alarm, report]
```

## 3. Alur Monitoring pada Web

```mermaid
flowchart TD
    U[User membuka dashboard] --> T[HTTPS/TLS]
    T --> N[Nginx Reverse Proxy]
    N --> F[Svelte Frontend]
    F --> A[Backend REST API]
    A --> D[(PostgreSQL / TimescaleDB)]
    D --> A
    A --> F
    F --> V{Tampilkan kebutuhan user}
    V --> V1[Dashboard KPI dan grafik]
    V --> V2[Plant dan device status]
    V --> V3[Alarm dan fault]
    V --> V4[Maintenance dan live data]
    V --> V5[Report dan analisis]
    V --> V6[Settings dan user management]
```

## 4. Alur Command dari Cloud ke Controller

Komunikasi command masih berupa rancangan. Jalur yang dipertimbangkan adalah MQTT publish-subscribe.

```mermaid
flowchart RL
    OP[Operator / Technician] --> UI[Dashboard Web]
    UI --> API[Backend API]
    API --> AUTH{Role dan izin valid?}
    AUTH -->|Tidak| DENY[Tolak command dan simpan audit]
    AUTH -->|Ya| PUB[Publish command ke MQTT topic]
    PUB --> BROKER[MQTT Broker]
    BROKER --> CTRL[RESS Controller Board]
    CTRL --> DEVICE[Microcontroller / Device Lapangan]
    DEVICE --> ACK[Command acknowledgement]
    ACK --> BROKER
    BROKER --> API
    API --> LOG[(Audit log dan command status)]
    API --> UI
```

## 5. Alur End-to-End untuk Slide Presentasi

```mermaid
flowchart LR
    S1[1. Sensor dan perangkat<br/>menghasilkan data] --> S2[2. RESS Controller Board<br/>mengumpulkan data]
    S2 --> S3[3. Data dikirim melalui<br/>MQTT atau HTTPS/POST]
    S3 --> S4[4. Cloud menerima dan<br/>memvalidasi data]
    S4 --> S5[5. Database menyimpan<br/>data operasional]
    S5 --> S6[6. Web dashboard menyajikan<br/>KPI, chart, status, alarm, report]
    S6 --> S7[7. User mengambil keputusan<br/>dan dapat mengirim command]
    S7 -. MQTT command .-> S2
```

## 6. Keterangan Komponen

| Komponen              | Peran dalam flowchart                                              |
| --------------------- | ------------------------------------------------------------------ |
| kWh meter             | Mengirim data konsumsi atau energi listrik                         |
| PV                    | Sumber pembangkitan energi surya                                   |
| Inverter              | Mengubah dan melaporkan energi listrik dari PV                     |
| Sensor lingkungan     | Mengirim temperatur, kelembapan, dan intensitas cahaya melalui LDR |
| RESS Controller Board | Mengumpulkan, membaca, dan meneruskan data lapangan                |
| MQTT                  | Jalur telemetry ringan dan real-time; juga kandidat jalur command  |
| HTTPS/POST            | Jalur pengiriman data melalui REST API                             |
| Nginx                 | Reverse proxy dan load balancer pada sisi cloud                    |
| Frontend              | Menampilkan dashboard monitoring yang responsif dan interaktif     |
| Backend               | Validasi, business logic, API, alarm, report, dan akses database   |
| PostgreSQL            | Penyimpanan data relasional dan operasional                        |
| TimescaleDB           | Opsi optimasi untuk data telemetry time-series berskala besar      |
| MQTT Broker           | Perantara publish-subscribe antara controller dan cloud            |

## 7. Batasan Status Rancangan

### Sudah tercermin pada repository

- Frontend SvelteKit dengan TailwindCSS dan Apache ECharts.
- Backend Bun, TypeScript, dan Elysia.
- PostgreSQL/TimescaleDB pada Docker Compose.
- MQTT broker Mosquitto pada Docker Compose.
- Nginx sebagai gateway.
- REST endpoint untuk health, device, readings, dan ingestion.

### Masih berupa rencana atau backlog

- Pemilihan final antara Bun, Elysia, atau Deno.
- MQTT consumer aplikasi dan kontrak telemetry production.
- Pengiriman command dari cloud ke controller.
- Alarm engine, notification worker, dan audit log.
- Load balancer multi-instance pada deployment production.
- Pemilihan provider VPS: BiznetGio, Hostinger, atau DigitalOcean.

## 8. Rekomendasi Susunan Slide

1. **Slide 1 - Big picture:** gunakan Flowchart Utama.
2. **Slide 2 - Data flow:** gunakan Alur Data Telemetry.
3. **Slide 3 - Web experience:** gunakan Alur Monitoring pada Web.
4. **Slide 4 - Future control:** gunakan Alur Command dari Cloud ke Controller.
5. **Slide 5 - Implementation status:** gunakan bagian Batasan Status Rancangan.

Pesan utama untuk presenter: **data dikumpulkan oleh RESS Controller Board, dikirim melalui MQTT atau HTTPS, diproses di cloud, disimpan pada database, lalu ditampilkan melalui web dashboard untuk monitoring dan pengambilan keputusan.**
