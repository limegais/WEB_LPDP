# Perubahan Server vps-ress (152.42.236.38), 24 Okt 2026

Untuk: Akbar
Dari: Mario

Ringkasan: user `deploy` diganti nama jadi `ress`, semua file app milik `ress` (bukan root), backend pindah dari PM2 (root) ke systemd (user `ress`), nginx pindah dari container ke host + HTTPS, Postgres/MQTT tidak lagi terbuka ke internet, ufw aktif.

## 1. User

| Sebelum | Sesudah |
|---|---|
| `deploy` (uid 1000), `dortek`, `/home/ress` sisa (milik root) | `ress` (uid 1000), `dortek` |

- `deploy` di-rename jadi `ress` (`usermod -l`), home pindah ke `/home/ress`. UID tetap 1000.
- `ress` masuk grup `sudo` dan `docker`.
- SSH key yang dulu ada di `deploy` sekarang dipakai untuk login `ress`. User `deploy` sudah tidak ada.
- `/home/ress` lama (sisa, isinya hanya `.ssh`) dipindah ke `/root/home-ress.bak`.

Login sekarang:

```bash
ssh -p 22122 ress@152.42.236.38
```

## 2. Kepemilikan file app

- `/var/www/WEB_LPDP` sekarang `ress:ress` (sebelumnya root).
- `.env` dan `apps/backend/.env` di-`chmod 600` (sebelumnya bisa dibaca semua user).
- Mulai sekarang deploy pakai user `ress`, **bukan root**. Jangan `git pull` / `bun run build` sebagai root, nanti file balik jadi milik root.

## 3. Password (penting)

**Password user Linux `ress` diganti** (dipakai untuk `sudo`). Password lama `deploy` tidak berlaku lagi. Password baru dikirim terpisah via japri, tidak ditulis di sini. Login SSH tetap pakai key (password login SSH nonaktif).

**Password DB tidak diganti.** Tapi `apps/backend/.env` diperbaiki: password di `DATABASE_URL` sebelumnya salah. Detail:

- Yang salah adalah `apps/backend/.env`: password di `DATABASE_URL` tidak sama dengan password asli DB (`POSTGRES_PASSWORD` di `.env` root project).
- Akibatnya backend crash `password authentication failed for user "ress_user"`, PM2 restart 60x lalu berhenti (`errored`). API `/api/` mati.
- Fix: `DATABASE_URL` di `apps/backend/.env` disamakan dengan `POSTGRES_PASSWORD`. File lama: `apps/backend/.env.bak-2026-10-24`.
- Kalau ada `.env` di laptop/lokal yang dipakai untuk deploy, samakan juga, jangan overwrite file di server dengan versi lama.

## 4. Backend: PM2 -> systemd

- PM2 root (`/root/.pm2`) dihapus: `ress-backend` (errored) dan `ress-frontend` (errored sejak 10 Okt, tidak dipakai karena frontend sudah di-serve nginx dari `apps/frontend/build`).
- Bun 1.4.3 diinstall untuk user `ress` di `/home/ress/.bun`.
- Backend sekarang jalan sebagai service systemd `ress-backend`, user `ress`, auto start saat boot, auto restart kalau crash. Sudah dicek: service `active`, proses bun milik `ress`, `http://ress.sems.web.id/api/` merespons dari luar.

Unit: `/etc/systemd/system/ress-backend.service`

```ini
[Service]
User=ress
WorkingDirectory=/var/www/WEB_LPDP/apps/backend
ExecStart=/home/ress/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=5
```

Perintah:

```bash
sudo systemctl status ress-backend
sudo systemctl restart ress-backend      # setelah update kode backend
journalctl -u ress-backend -f            # lihat log (pengganti pm2 logs)
```

## 5. Nginx: container -> host + HTTPS

- Container `ress-nginx` dihapus (service `nginx` juga dihapus dari `docker-compose.yml`). Folder `nginx/` di repo sudah tidak dipakai.
- Nginx sekarang terinstall di host (apt), supaya port 80/443 bisa dipakai bersama service/domain lain di server ini.
- Config: `/etc/nginx/sites-available/ress.sems.web.id`
  - serve frontend statis dari `/var/www/WEB_LPDP/apps/frontend/build`
  - `/api/` -> `http://127.0.0.1:3000` (backend systemd)
- HTTPS aktif via Let's Encrypt (certbot), cert berlaku sampai 2027-01-22, auto-renew lewat timer certbot.
- Akses `http://` otomatis redirect `301` ke `https://`. Akses via IP tidak dilayani lagi, pakai domain.

Service baru tinggal tambah file di `/etc/nginx/sites-available/`, symlink ke `sites-enabled/`, lalu `sudo certbot --nginx -d <domain>`.

```bash
sudo nginx -t && sudo systemctl reload nginx   # setelah edit config
sudo certbot certificates                      # cek masa berlaku cert
```

## 6. Port & firewall

`docker-compose.yml`: Postgres sekarang bind ke `127.0.0.1` (sebelumnya terbuka ke internet). MQTT tetap publik karena dipakai device, tapi sekarang wajib auth (sebelumnya anonymous, log menunjukkan scanner internet sempat konek bebas).

| Port | Listen | Akses dari internet |
|---|---|---|
| 22122 | sshd | ya (ufw allow) |
| 80, 443 | nginx host | ya (ufw allow) |
| 3000 | backend bun | tidak (ufw deny) |
| 5432 | postgres | tidak (127.0.0.1) |
| 1883 | mosquitto | ya, wajib username/password |

- Koneksi DB dari laptop (DBeaver dsb): pakai SSH tunnel `ssh -p 22122 -L 5432:127.0.0.1:5432 ress@152.42.236.38`, lalu konek ke `localhost:5432`.

### MQTT (mosquitto) auth

Config di repo: `mosquitto/config/` (di-mount ke container), data di volume `mqttdata`.

| File | Isi |
|---|---|
| `mosquitto.conf` | `listener 1883`, `allow_anonymous false`, password + ACL |
| `passwd` | hash password user. **Jangan di-commit** (masuk `.gitignore`) |
| `acl` | hak akses topic per user |

| User | Akses | Dipakai oleh |
|---|---|---|
| `device` | write `ress/+/readings` | semua ESP32/device (password via japri) |
| `ress-backend` | read `ress/#` | belum dipakai (lihat catatan) |

- Device wajib kirim username `device` + password. Koneksi anonymous ditolak (`not authorised`).
- Device yang publish ke topic selain `ress/+/readings` akan diblok ACL. Kalau topic beda, update `acl` lalu `docker compose restart mqtt`.
- Tambah/ganti user:

  ```bash
  cd /var/www/WEB_LPDP
  docker exec -it ress-mqtt mosquitto_passwd /mosquitto/config/passwd <user>
  docker compose restart mqtt
  ```

- Belum TLS: password terkirim plaintext. Rencana: listener 8883 TLS pakai cert Let's Encrypt `ress.sems.web.id`, dikerjakan bareng update firmware.

**Catatan:** backend (`apps/backend/src`) tidak punya kode MQTT sama sekali, walaupun `.env` punya `MQTT_URL`/`MQTT_TOPIC`. Jadi data dari device sekarang tidak diproses siapa pun di server ini. Siapa yang subscribe? Kalau nanti backend subscribe, set `MQTT_URL=mqtt://ress-backend:<password-urlencoded>@localhost:1883`.

## 7. Frontend: URL API

- Sebelumnya build frontend memanggil `http://localhost:3000` (fallback di `apps/frontend/src/lib/api/client.ts` karena `VITE_API_BASE_URL` tidak di-set). Di browser pengunjung ini selalu gagal.
- Sekarang ada `apps/frontend/.env.production`:

  ```
  VITE_API_BASE_URL=https://ress.sems.web.id
  ```

- Frontend sudah di-build ulang. Jangan hapus file ini. Untuk dev lokal tetap pakai `.env` biasa.

## 8. Alur deploy baru

Ganti panduan di `build server.txt` (masih pakai `root`, `/root/.bun`, dan container nginx):

```bash
ssh -p 22122 ress@152.42.236.38
cd /var/www/WEB_LPDP
git pull origin main

# frontend (nginx tidak perlu reload, file statis)
cd apps/frontend && ~/.bun/bin/bun run build

# backend (kalau ada perubahan backend)
sudo systemctl restart ress-backend
journalctl -u ress-backend -n 30 --no-pager
```

Docker compose (postgres, mqtt): boleh `docker compose up -d` / `down`. **Jangan `docker compose down -v`**, itu menghapus volume `web_lpdp_pgdata` (data DB).

## 9. Yang tidak berubah

- Path app: `/var/www/WEB_LPDP`
- Container: `ress-postgres`, `ress-mqtt`
- Volume DB: `web_lpdp_pgdata`
- Domain: `ress.sems.web.id` -> 152.42.236.38
- Password DB

## 10. Backup

Di `/root/`:
- `lpdp-app-2026-10-24.tgz` (app tanpa node_modules)
- `lpdp-pre-rename-2026-10-24.sql.gz` (dump DB)
- `home-ress.bak/` (home ress lama)

Di repo server: `docker-compose.yml.bak-2026-10-24`, `apps/backend/.env.bak-2026-10-24`.

## 11. Rencana berikutnya

- [ ] Jelaskan alur data MQTT: siapa subscriber `ress/+/readings`? (lihat bagian 6)
- [ ] MQTT TLS (8883) bareng update firmware
- [ ] `mosquitto/config/passwd` ke `.gitignore`
- [ ] `PermitRootLogin yes` -> `prohibit-password`
- [ ] Update `build server.txt` sesuai bagian 8, hapus folder `nginx/` dari repo
- [ ] Commit `.env.production`? Isinya bukan rahasia, boleh di-commit supaya build konsisten
