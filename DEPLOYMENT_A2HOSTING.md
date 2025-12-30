# DigitMonie Loan - A2 Hosting Deployment Guide

## Prerequisites
- A2 Hosting cPanel access
- Domain or subdomain configured
- PHP 8.2+ enabled on your hosting
- MySQL database created

---

## Directory Structure (Recommended)

```
public_html/
├── index.html          # React frontend
├── assets/             # Frontend assets (CSS, JS)
├── .htaccess           # Frontend routing
└── api/                # Laravel backend
    ├── public/
    │   └── index.php   # Laravel entry point
    ├── app/
    ├── config/
    ├── database/
    ├── routes/
    ├── storage/
    ├── vendor/
    └── .env
```

---

## Step 1: Create MySQL Database

1. Login to **cPanel**
2. Go to **MySQL Databases**
3. Create a new database: `youruser_digitmonie`
4. Create a database user with a strong password
5. Add user to database with **ALL PRIVILEGES**
6. Note down:
   - Database name: `youruser_digitmonie`
   - Username: `youruser_dbuser`
   - Password: `your_db_password`

---

## Step 2: Deploy Laravel Backend

### 2.1 Upload Backend Files

1. Zip the entire `backend/` folder (excluding `node_modules` if any)
2. In cPanel → **File Manager**, navigate to `public_html/`
3. Create folder `api`
4. Upload and extract the zip inside `public_html/api/`
5. Move contents of `public_html/api/backend/` to `public_html/api/`

### 2.2 Configure .htaccess for API

Create/edit `public_html/api/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

### 2.3 Create Production .env File

In `public_html/api/`, create `.env` file:

```env
APP_NAME=DigitMonie
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://yourdomain.com/api

# Database
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=youruser_digitmonie
DB_USERNAME=youruser_dbuser
DB_PASSWORD=your_db_password

# Session
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=.yourdomain.com

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Storage
FILESYSTEM_DISK=public

# Mail (configure with your SMTP)
MAIL_MAILER=smtp
MAIL_HOST=mail.yourdomain.com
MAIL_PORT=465
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="DigitMonie"

# Queue
QUEUE_CONNECTION=sync

# Cache
CACHE_STORE=file
```

### 2.4 Generate App Key (via SSH or Terminal in cPanel)

```bash
cd ~/public_html/api
php artisan key:generate
```

If no SSH access, generate locally and copy the key:
```bash
cd backend
php artisan key:generate --show
```

### 2.5 Run Migrations

```bash
cd ~/public_html/api
php artisan migrate --force
php artisan db:seed --class=RoleSeeder --force
```

### 2.6 Set Permissions

```bash
chmod -R 775 storage bootstrap/cache
```

### 2.7 Create Storage Symlink

```bash
php artisan storage:link
```

---

## Step 3: Deploy React Frontend

### 3.1 Update API URL

Before building, update the frontend to use production API URL.

Edit `frontend/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: 'https://yourdomain.com/api/api',  // Note: /api/api because Laravel is in /api folder
  // ... rest of config
});
```

Or better, use environment variables. Create `frontend/.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api/api
```

### 3.2 Build Frontend

```bash
cd frontend
npm run build
```

### 3.3 Upload Frontend Files

1. Zip the contents of `frontend/dist/` folder
2. Upload to `public_html/` root
3. Extract (should have `index.html`, `assets/`, `.htaccess`)

---

## Step 4: Configure CORS (Backend)

Edit `public_html/api/config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## Step 5: SSL Configuration

1. In cPanel → **SSL/TLS** → **Manage SSL Sites**
2. Install Let's Encrypt certificate (usually auto or via AutoSSL)
3. Force HTTPS by adding to `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Step 6: Verify Deployment

1. Visit `https://yourdomain.com` - Should show the React app
2. Visit `https://yourdomain.com/api/api/health` - Should return JSON
3. Try logging in with: `admin@digitmonie.com` / `password123`

---

## Troubleshooting

### API returns 500 Error
- Check `public_html/api/storage/logs/laravel.log`
- Verify `.env` database credentials
- Check file permissions on `storage/` folder

### CORS Errors
- Verify `config/cors.php` has correct domains
- Clear Laravel cache: `php artisan config:cache`

### React routes show 404
- Ensure `.htaccess` is in `public_html/` with proper rewrite rules
- Check `mod_rewrite` is enabled

### Login fails
- Check API URL is correct in frontend
- Verify database migrations ran
- Check browser console for errors

---

## Maintenance Commands

```bash
# Clear all caches
php artisan optimize:clear

# Cache config for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run new migrations
php artisan migrate --force
```

---

## Quick Checklist

- [ ] MySQL database created
- [ ] Backend uploaded to `public_html/api/`
- [ ] Backend `.env` configured with production values
- [ ] App key generated
- [ ] Migrations and seeders run
- [ ] Storage permissions set (775)
- [ ] Storage symlink created
- [ ] Frontend built with production API URL
- [ ] Frontend uploaded to `public_html/`
- [ ] SSL certificate installed
- [ ] HTTPS forced
- [ ] Login tested successfully
