# PRD - RESS PLTS Monitoring Dashboard

## 1. Ringkasan

RESS adalah platform monitoring dan operasi pembangkit listrik tenaga surya (PLTS). Sistem menyatukan status plant, perangkat, telemetry sensor, performa energi, alarm, pemeliharaan, laporan, dan konfigurasi dalam satu dashboard.

Nama kerja pada UI: SolarCloud / SolarScope Platform.

## 2. Masalah

- Kondisi banyak plant dan perangkat sulit dipantau dari sumber yang tersebar.
- Operator membutuhkan konteks alarm, severity, dan tindakan respons.
- Owner membutuhkan perbandingan produksi aktual, target, PR, revenue, dan dampak emisi.
- Teknisi membutuhkan live data, histori, dan remote maintenance yang terkontrol.

## 3. Tujuan

1. Menjadi sumber informasi operasional untuk seluruh portofolio PLTS.
2. Mempercepat deteksi, diagnosis, dan penyelesaian fault.
3. Menyediakan laporan energi dan performa yang dapat diekspor.
4. Menyediakan akses berbasis role dan plant.
5. Menghubungkan telemetry perangkat dengan keputusan operasional.

## 4. Non-tujuan

- Menggantikan PLC/SCADA untuk kontrol keselamatan tingkat perangkat.
- Menjadi sistem akuntansi atau billing utama.
- Menjalankan remote command tanpa otorisasi, konfirmasi, dan audit.
- Menyediakan aplikasi mobile native pada versi awal.

## 5. Persona

| Persona              | Kebutuhan                                            | Akses                     |
| -------------------- | ---------------------------------------------------- | ------------------------- |
| Owner / Super Admin  | KPI portofolio, revenue, emisi, laporan, konfigurasi | Semua plant               |
| Plant Operator / NOC | Status plant, live data, alarm, respons cepat        | Plant yang ditugaskan     |
| Maintenance Lead     | Fault, tren, remote session, SLA, playbook           | Operasi maintenance       |
| Technician           | Detail perangkat dan tindakan yang diizinkan         | Perangkat yang ditugaskan |
| Viewer / Executive   | KPI dan laporan                                      | Read-only                 |

## 6. Modul dan kebutuhan fungsional

### Login dan akses

- Login email/password, logout, session expiry, dan proteksi route.
- RBAC: Super Admin, Operator, Technician, Viewer.
- Plant-level access pada UI dan server.

### Dashboard

- Yield hari ini/bulan/total, real-time power, installed power.
- Revenue hari ini/bulan/tahun/total.
- Grafik ESS active power dengan rentang Day, Week, Month, Year, Total.
- Ringkasan Fault, Alarm, Notice, Advice.
- Status plant: normal, abnormal, offline, commissioning, following.
- Daily equivalent hours dan indikator CO2 reduction, coal saved, trees.
- Timestamp refresh dan indikator data stale.

### Plant management

- Daftar plant dengan search, filter status/region/type, pagination.
- Lokasi, tipe, kapasitas, power, yield, PR, status.
- Detail plant: device, histori, target, alarm, dan energi.
- CRUD plant untuk role berwenang.

### Device management

- Daftar dan detail inverter, meter, dan string combiner box.
- Filter status, plant, tipe, model; tampilkan serial, power, yield, PR, suhu.
- Fault list pending/resolved dengan severity, kode, waktu, dan aksi.
- Threshold komunikasi/proteksi dan firmware package/deployment.

### Data dan alarm

- Ingestion telemetry via MQTT atau endpoint.
- Validasi, deduplication, kualitas, timestamp, stale data, dan agregasi.
- Alarm dari threshold, kehilangan komunikasi, dan kondisi device.
- Acknowledge, assign, resolve, notification, response plan, dan audit trail.

### Maintenance, report, settings

- Curve power vs reference, live data, remote session, SLA, work order.
- Laporan energi, performa, alarm, CO2; export CSV/PDF/XLSX.
- Owner hub: savings estimator, checklist, alarm guide.
- Company, regional, user, notification, threshold, retention, backup, support.

## 7. User stories prioritas

| ID    | User story                                                        | Prioritas |
| ----- | ----------------------------------------------------------------- | --------- |
| US-01 | Operator melihat plant abnormal untuk memprioritaskan inspeksi.   | P0        |
| US-02 | Operator membuka fault sampai device dan waktu kejadian.          | P0        |
| US-03 | Owner membandingkan produksi dengan target per periode.           | P0        |
| US-04 | Technician melihat live tag dan kualitas reading.                 | P0        |
| US-05 | Admin membatasi user ke plant tertentu.                           | P0        |
| US-06 | Maintenance lead menjalankan response plan dengan SLA.            | P1        |
| US-07 | Owner mengunduh laporan CSV/PDF.                                  | P1        |
| US-08 | Technician berwenang menjalankan remote action dengan konfirmasi. | P1        |

## 8. Acceptance criteria utama

- Status plant dihitung dari device dan freshness data, bukan hanya label UI.
- Histori dapat difilter berdasarkan plant/device/metric/periode dan berurutan menurut waktu.
- Alarm memiliki lifecycle, severity, owner, waktu, dan audit trail.
- Endpoint menolak akses di luar role atau plant scope.
- Export mengikuti filter, timezone, dan menampilkan status berhasil/gagal.
- Remote command hanya memakai allowlist, role yang benar, device online, timeout, acknowledgement, dan audit.

## 9. Non-functional requirements

- Availability target 99.5% per bulan.
- Dashboard initial load p95 < 3 detik; API read p95 < 500 ms pada dataset normal.
- Semua timestamp disimpan UTC dan dikonversi di presentation layer.
- Password di-hash; secret tidak disimpan di source code.
- Audit untuk login, role, threshold, alarm, remote command, firmware.
- Responsive desktop/tablet dengan loading, empty, error, dan stale states.

## 10. KPI

MTTA, MTTR, persentase data fresh, persentase device online, production variance terhadap target, PR per plant, remote action success rate, dan penggunaan report/export.

## 11. Status implementasi saat ini

Route UI tersedia: `/login`, `/dashboard`, `/plant`, `/devices`, `/maintenance`, `/report`, `/settings`, `/owner-hub`, `/alerts`, `/support`.

API tersedia: `GET /health`, `GET /api/devices`, `GET /api/readings`, `GET /api/readings/latest`, dan `POST /api/ingest`.

Sebagian besar route masih memakai data mock/static. Tombol CRUD, export, remote action, dan sebagian settings masih placeholder alert. PRD ini mendefinisikan target produk; integrasi tersebut adalah backlog, bukan fitur production-ready.

## 12. Roadmap

1. **Data foundation:** hubungkan dashboard/plant/device ke API, seed data, pagination, freshness, error state, auth dasar.
2. **Operations:** MQTT consumer, alarm engine, notification, fault lifecycle, audit, maintenance workflow.
3. **Reporting and control:** async export, remote guardrails, firmware workflow, observability, load test, backup/restore.

## 13. Risiko dan asumsi

Format telemetry vendor, formula revenue/PR/CO2, SLA, timezone, retensi data, dan aturan remote command harus dikonfirmasi product owner serta tim operasi.
