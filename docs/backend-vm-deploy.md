# Backend-only deploy to a Google Compute Engine VM (no domain required)

This is a minimal, copy-paste path to run the Spectral Buildings backend on a single VM and test it via the VM’s IP. You can add a domain + HTTPS later without redoing the backend setup.

## TL;DR: commands to run now on the VM
If the VM is freshly created, run these in order (Ubuntu/Debian):
```bash
# 0) Update + firewall
sudo apt-get update && sudo apt-get upgrade -y
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw --force enable

# 1) Node, git, nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# 2) Docker for MongoDB
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker --now
sudo mkdir -p /data/mongo
sudo docker run -d --name mongo -p 127.0.0.1:27017:27017 -v /data/mongo:/data/db mongo:6

# 3) Get code + env
cd ~
git clone <your-fork-url> spectral_buildings
cd spectral_buildings
cp .env.example .env
# edit .env with your values (see below)

# 4) Install backend deps + start API
cd backend
npm install --omit=dev
npm run start    # or use pm2 as below
```
Then hit `http://<VM-IP>:5000/` from your laptop to confirm it’s working. Continue with PM2 and optional Nginx steps below for a production-like setup.

## 1) Prep the VM
1. Create a small VM (e.g., `e2-micro` or `e2-small`) with Ubuntu/Debian.  
2. Reserve a **static external IP**.  
3. Enable firewall rules for **HTTP (80)** and **HTTPS (443)**. SSH (22) should stay open.  
4. SSH into the VM.

## 2) Harden + install system deps
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw --force enable

# Node 18 + npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Docker (for MongoDB)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker --now
```

## 3) Run MongoDB locally (Docker)
```bash
sudo mkdir -p /data/mongo
sudo docker run -d --name mongo \
  -p 127.0.0.1:27017:27017 \
  -v /data/mongo:/data/db \
  mongo:6
```

## 4) Get the code and configure env
```bash
cd ~
git clone <your-fork-url> spectral_buildings
cd spectral_buildings
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb://localhost:27017/spectral_buildings
JWT_SECRET=<strong-random-string>
PORT=5000
VITE_API_URL=http://<VM-IP>:5000/api
```
(Update `VITE_API_URL` later to your domain + HTTPS when you add one.)

## 5) Install backend deps and start the API
```bash
cd backend
npm install --omit=dev   # production install for backend

# start the API (foreground)
npm run start

# optional: keep it alive with PM2
sudo npm install -g pm2
pm2 start npm --name spectral-api -- run start
pm2 save
pm2 startup systemd   # run the printed command to enable on boot
```

## 6) Test from your laptop (using the VM IP)
- API root (should return JSON):  
  `curl http://<VM-IP>:5000/`
- Example route check:  
  `curl http://<VM-IP>:5000/api/buildings`

If you see JSON responses, the backend is reachable over the IP and port 5000.

## 7) Optional: add Nginx reverse proxy now (or later)
If you prefer to expose only port 80/443 and keep the Node app behind Nginx:
```bash
sudo tee /etc/nginx/sites-available/spectral <<'EOF'
server {
  listen 80;
  server_name _;

  location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/spectral /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Now you can hit `http://<VM-IP>/api/...` without exposing port 5000 directly.

## 8) When ready for a domain + HTTPS
1. Point your domain’s **A record** to the VM’s static IP.  
2. Update `server_name` in the Nginx config to your domain.  
3. Enable TLS:  
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```
4. Update `.env` `VITE_API_URL` to `https://your-domain.com/api` (if the frontend will call it).

That’s it—the backend will be reachable via your IP now, and you can add the domain + HTTPS whenever you’re ready.
