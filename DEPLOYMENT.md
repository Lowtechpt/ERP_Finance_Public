# Deployment Guide

ERP Finance is a financial management dashboard that can be deployed locally, in Docker, or to cloud platforms. This guide covers all deployment options.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start backend + frontend (dev mode)
npm run dev

# Frontend: http://127.0.0.1:5173
# Backend API: http://127.0.0.1:5000
```

The app uses SQLite (demo) by default—no database setup needed.

## Docker Deployment (Recommended for Portfolio)

### Prerequisites
- Docker & Docker Compose installed

### Production Build

```bash
# Build and run the demo container (API + built frontend, one port)
docker compose up --build

# Frontend + Backend: http://localhost:5000
# API Health check: http://localhost:5000/api/health
```

The build stage compiles the frontend and backend and bakes the SQLite demo
database into the image; the runtime stage installs no `node_modules` at all
(the compiled API has zero runtime dependencies) and runs as the non-root
`node` user.

View logs:
```bash
docker compose logs -f app
```

Stop containers:
```bash
docker compose down
```

### Development Container

To use hot reload during development, use the `dev` compose profile:

```bash
docker compose --profile dev up --build

# Frontend (with HMR): http://localhost:5173
# Backend API: http://localhost:5001 (mapped from container port 5000)
```

### Accessing the App

- **Production**: http://localhost:5000
  - Frontend served as static files
  - API available at `/api/*`

- **Development**: http://localhost:5173
  - Vite dev server with hot reload
  - API proxied to http://localhost:5000

## GitHub Pages (Static Export)

The app includes a static build mode for GitHub Pages deployment.

```bash
# Build static version (no backend required at runtime)
npm run build:static

# Output: dist/ directory (ready for GitHub Pages)
```

GitHub Actions automatically deploys to Pages when pushing to the `public-release` branch.

## Cloud Deployment

### Vercel

ERP Finance is not currently optimized for Vercel due to backend dependencies. However, you can deploy the frontend-only version:

```bash
# Build frontend only
npm run build

# Deploy dist/ to Vercel
vercel --prod
```

**Note**: This version won't have access to backend APIs. For full functionality, use Docker or a Node.js host.

### AWS, DigitalOcean, Heroku (Node.js Hosts)

1. Build the Docker image:
```bash
docker build -t erp-finance:latest -f Dockerfile --target demo .
```

2. Push to registry (e.g., Docker Hub):
```bash
docker tag erp-finance:latest username/erp-finance:latest
docker push username/erp-finance:latest
```

3. Deploy container:
```bash
# Example: AWS EC2
docker pull username/erp-finance:latest
docker run -d -p 80:5000 -e NODE_ENV=production username/erp-finance:latest
```

Access at: `http://your-host`

## Environment Configuration

See `.env.example` for the authoritative, up-to-date list — every variable there is
actually read by the code. The most relevant ones:

```bash
# Backend
PRIMAVERA_MODE=demo           # demo or sqlserver
NODE_ENV=development          # development or production
MEG_FINANCE_API_PORT=5000
MEG_FINANCE_API_HOST=127.0.0.1 # 0.0.0.0 in containers

# SQL Server mode only — no username/password: sqlcmd uses a trusted
# (Windows-integrated) connection, not credential-based auth
PRIMAVERA_SQL_SERVER=localhost
PRIMAVERA_SQL_DATABASE=PRIDEMO

# AI Integration (optional)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash-lite
```

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

## Database Setup

### Demo Mode (Default)
No setup required. Uses SQLite automatically.

### SQL Server Mode (Production)

1. Ensure SQL Server is running and accessible, and that `sqlcmd` is on `PATH`
   and already authenticated for a trusted (Windows-integrated) connection —
   there are no username/password variables, because `sqlserver.ts` shells out
   to `sqlcmd` rather than using a credentialed driver.
2. Set environment variables:
```bash
PRIMAVERA_MODE=sqlserver
PRIMAVERA_SQL_SERVER=your-server
PRIMAVERA_SQL_DATABASE=your-database
```

3. There is no migration step — this app only reads from PRIMAVERA's existing
   SQL Server schema via `sqlcmd`; it does not manage or migrate that schema.

4. Start the app:
```bash
npm run dev
```

See `DATABASE_SCHEMA.md` for the SQL Server schema this app reads.

## Production Checklist

- [ ] Environment variables configured in `.env.local` (not in repo)
- [ ] Database credentials secured (use container secrets)
- [ ] CORS origins configured in `ALLOWED_ORIGINS`
- [ ] HTTPS enabled on production domain
- [ ] Health check monitoring configured (GET `/api/health`)
- [ ] Logs and error tracking set up
- [ ] Database backups automated (if using SQL Server)
- [ ] Rate limiting enabled (100 req/min per IP)

## Monitoring & Health

Health check endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "backend": "operational",
  "database": "demo",
  "timestamp": "2026-08-15T12:00:00Z"
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
MEG_FINANCE_API_PORT=5001 npm run dev
```

### Docker Build Fails
```bash
# Clear build cache and rebuild
docker-compose down --volumes
docker-compose build --no-cache
docker-compose up
```

### Database Connection Error
1. Check `PRIMAVERA_SQL_SERVER`/`PRIMAVERA_SQL_DATABASE` in `.env.local`
2. Verify database server is running and `sqlcmd` is on `PATH`
3. Check firewall/network access
4. Run the failing query's `sqlcmd` command by hand to see the raw error — the
   backend has no separate logging flag

### CORS Error
Add your domain to `ALLOWED_ORIGINS` environment variable:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://your-domain.com
```

## Performance Optimization

- Frontend is code-split (lazy-loaded pages)
- Database queries cached where possible
- Gzipped static assets (~110 KB)
- Frontend build: ~395 KB (production)

## Security

- All query parameters validated and sanitized
- Content Security Policy headers enabled
- CORS whitelist enforced
- Rate limiting (100 req/min per IP)
- No sensitive data in error messages (production mode)
- HSTS configured for HTTPS

See `SECURITY_AUDIT.md` for detailed security documentation.

## Support

For issues, questions, or deployment help, check:
- `README.md` — Project overview
- `API.md` — API endpoint documentation
- `DATABASE_SCHEMA.md` — Database schema reference
- GitHub Issues — Report bugs or ask questions

---

**Last updated**: 2026-08-15
