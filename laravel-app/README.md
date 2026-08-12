# AgriSmart — Laravel Application

AgriSmart is an intelligent farm-management and decision-support system for farmers and administrators.

## Planned modules

- Farmer registration and login
- Admin login and role-based access
- Multiple farms per farmer
- Crop tracking and crop-health observations
- Fertilizer recommendation workflow
- Crop market-price tracking
- Farm activity/expense records
- Dashboard and health endpoint

## Current scaffold

This branch contains a Laravel-ready application directory with Composer configuration, environment template, public entrypoint, routes, base farm and crop models, and a dashboard view contract.

## Local setup

```bash
cd laravel-app
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Production checklist

1. Use PHP 8.2+ and a supported Laravel release.
2. Configure MySQL credentials in `.env`.
3. Set `APP_ENV=production` and `APP_DEBUG=false`.
4. Run `composer install --no-dev --optimize-autoloader`.
5. Run `php artisan migrate --force`.
6. Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache`.
7. Point the web server document root at `laravel-app/public`.
8. Store secrets only in the hosting provider's environment variables.

## Deployment

The GitHub connector available in this session can modify repository contents and branches, but it does not expose a hosting-provider deployment API. A real live URL therefore requires a connected deployment provider such as Render, Railway, or a VPS/hosting account.
