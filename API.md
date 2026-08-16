# API Documentation

Complete API reference for ERP Finance backend.

**Base URL**: `http://localhost:5000` (development)

**Content-Type**: All endpoints return `application/json`

## Health & Status

### GET /api/health
Server health check endpoint.

```bash
curl http://localhost:5000/api/health
```

**Response** (200):
```json
{
  "status": "ok",
  "backend": "operational",
  "database": "demo",
  "timestamp": "2026-08-15T12:00:00Z"
}
```

---

## Financial Data

### GET /api/dashboard
Executive dashboard KPIs and summaries.

```bash
curl http://localhost:5000/api/dashboard
```

**Response** (200):
```json
{
  "period": "2026",
  "revenue": 1500000,
  "expenses": 800000,
  "profit": 700000,
  "cashFlow": 250000,
  "receivables": 350000,
  "payables": 120000,
  "topCustomers": [
    { "name": "Customer A", "amount": 150000 },
    { "name": "Customer B", "amount": 120000 }
  ]
}
```

### GET /api/receivables
Accounts receivable details and aging analysis.

**Query Parameters**:
- `limit` (optional): Max records to return, default 100
- `order` (optional): Sort order (asc/desc)

```bash
curl "http://localhost:5000/api/receivables?limit=50"
```

**Response** (200):
```json
{
  "total": 45,
  "overdue": 12,
  "data": [
    {
      "documentId": "FT2026001",
      "customer": "Acme Corp",
      "amount": 25000,
      "dueDate": "2026-07-15",
      "status": "overdue",
      "days": 31
    }
  ]
}
```

### GET /api/payables
Accounts payable details.

```bash
curl http://localhost:5000/api/payables
```

**Response** (200):
```json
{
  "total": 350000,
  "overdue": 50000,
  "upcoming30": 120000,
  "data": [
    {
      "documentId": "FC2026001",
      "vendor": "Supplier Ltd",
      "amount": 35000,
      "dueDate": "2026-08-20",
      "status": "pending"
    }
  ]
}
```

### GET /api/cashflow
Cash flow analysis and forecasting.

```bash
curl http://localhost:5000/api/cashflow
```

**Response** (200):
```json
{
  "period": "Jan-Jun 2026",
  "inflows": 1200000,
  "outflows": 950000,
  "netFlow": 250000,
  "monthlyBreakdown": [
    { "month": "Jan", "inflow": 200000, "outflow": 160000 },
    { "month": "Feb", "inflow": 220000, "outflow": 170000 }
  ]
}
```

### GET /api/banks
Bank account information and balances.

```bash
curl http://localhost:5000/api/banks
```

**Response** (200):
```json
{
  "accounts": [
    {
      "accountId": "PT50001012345678901234",
      "bank": "Bank A",
      "type": "Checking",
      "balance": 75000,
      "lastUpdate": "2026-08-15T12:00:00Z"
    }
  ],
  "totalBalance": 150000
}
```

---

## Analysis & Insights

### GET /api/profitability
Profitability analysis by period.

```bash
curl http://localhost:5000/api/profitability
```

**Response** (200):
```json
{
  "gross_margin": 45,
  "operating_margin": 35,
  "net_margin": 28,
  "roi": 125,
  "trend": "positive"
}
```

### GET /api/profitability/product
Profitability breakdown by product.

```bash
curl http://localhost:5000/api/profitability/product
```

### GET /api/breakeven
Break-even analysis.

```bash
curl http://localhost:5000/api/breakeven
```

**Response** (200):
```json
{
  "breakeven_units": 1250,
  "breakeven_revenue": 62500,
  "current_volume": 3000,
  "margin_of_safety": 140,
  "contribution_margin": 50
}
```

### GET /api/budget-vs-actual
Budget vs. actual expense comparison.

```bash
curl http://localhost:5000/api/budget-vs-actual
```

**Response** (200):
```json
{
  "period": "2026-Q2",
  "budget": 500000,
  "actual": 485000,
  "variance": 15000,
  "variance_percent": 3,
  "status": "under-budget"
}
```

---

## Inventory & Products

### GET /api/inventory-detail
Inventory levels and movement.

```bash
curl http://localhost:5000/api/inventory-detail
```

**Response** (200):
```json
{
  "total_items": 450,
  "inventory_value": 125000,
  "slow_moving": 45,
  "stockouts": 2,
  "products": [
    {
      "sku": "PROD-001",
      "name": "Product A",
      "stock": 150,
      "min_stock": 50,
      "value": 15000
    }
  ]
}
```

### GET /api/products-detail
Product catalog and performance.

```bash
curl http://localhost:5000/api/products-detail
```

---

## HR & Personnel

### GET /api/hr-costs
Human resources costs and analytics.

```bash
curl http://localhost:5000/api/hr-costs
```

**Response** (200):
```json
{
  "total_employees": 15,
  "monthly_payroll": 45000,
  "annual_payroll": 540000,
  "social_security": 135000,
  "cost_per_employee": 3000,
  "salary_expense_ratio": 15,
  "by_department": {
    "Sales": { "count": 5, "cost": 18000 },
    "Operations": { "count": 6, "cost": 18000 },
    "Administration": { "count": 4, "cost": 9000 }
  }
}
```

### GET /api/hr
Human resources module data (employees, payroll, etc).

```bash
curl http://localhost:5000/api/hr
```

---

## Operational Data

### GET /api/customers
Customer list and profile information.

```bash
curl http://localhost:5000/api/customers
```

**Response** (200):
```json
{
  "total": 127,
  "active": 95,
  "data": [
    {
      "id": "CLI001",
      "name": "Customer Name",
      "email": "contact@customer.com",
      "phone": "+351 123 456 789",
      "city": "Lisbon",
      "outstanding": 25000,
      "status": "active"
    }
  ]
}
```

### GET /api/collections
Collections and receivables management.

```bash
curl http://localhost:5000/api/collections
```

### GET /api/vendors-analysis
Vendor performance and analysis.

```bash
curl http://localhost:5000/api/vendors-analysis
```

### GET /api/production-costs
Production and manufacturing costs.

```bash
curl http://localhost:5000/api/production-costs
```

### GET /api/cost-analysis
Detailed cost analysis by category.

```bash
curl http://localhost:5000/api/cost-analysis
```

---

## System & Configuration

### GET /api/modules
Available modules and entity counts.

```bash
curl http://localhost:5000/api/modules
```

**Response** (200):
```json
{
  "modules": [
    { "name": "Customers", "count": 127 },
    { "name": "Vendors", "count": 45 },
    { "name": "Products", "count": 450 },
    { "name": "Sales Orders", "count": 1200 },
    { "name": "Purchase Orders", "count": 650 }
  ]
}
```

### GET /api/alerts
Alerts and warnings (budget exceeded, overdue invoices, etc).

```bash
curl http://localhost:5000/api/alerts
```

**Response** (200):
```json
{
  "critical": 2,
  "warning": 5,
  "info": 12,
  "alerts": [
    {
      "id": "ALERT001",
      "level": "critical",
      "message": "12 invoices overdue by 30+ days",
      "amount": 125000,
      "timestamp": "2026-08-15T10:30:00Z"
    }
  ]
}
```

---

## CRM & Communications

### GET /api/crm
CRM data (interactions, opportunities, etc).

```bash
curl http://localhost:5000/api/crm
```

### GET /api/open-erp
Open ERP integration data.

```bash
curl http://localhost:5000/api/open-erp
```

---

## AI Workspace

### POST /api/ai/chat
Chat with Gemini AI for financial insights.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "What are my top customers by revenue?",
  "model": "gemini-2.0-flash-lite",
  "apiKey": "your-gemini-api-key"
}
```

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my top customers by revenue?",
    "model": "gemini-2.0-flash-lite",
    "apiKey": "your-api-key"
  }'
```

**Response** (200):
```json
{
  "reply": "Based on your financial data, your top 5 customers by revenue are...",
  "sources": ["dashboard", "receivables"]
}
```

**Error** (503 - if API key not configured):
```json
{
  "error": "Gemini not configured",
  "message": "Please provide GEMINI_API_KEY environment variable"
}
```

---

## Transactions

### POST /api/register-payment
Register a payment against an invoice.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "documentId": "FT2026001",
  "amount": 25000,
  "paymentDate": "2026-08-15",
  "paymentMethod": "bank_transfer",
  "reference": "Payment for invoice FT2026001"
}
```

```bash
curl -X POST http://localhost:5000/api/register-payment \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "FT2026001",
    "amount": 25000,
    "paymentDate": "2026-08-15",
    "paymentMethod": "bank_transfer"
  }'
```

**Response** (200):
```json
{
  "success": true,
  "payment_id": "PAY2026001",
  "document": "FT2026001",
  "amount": 25000,
  "status": "registered"
}
```

---

## Error Handling

Error responses are JSON with an `error` field and, outside production, a
`message`/`detail` field with more context (stripped in production — see
[ERROR_HANDLING.md](./ERROR_HANDLING.md)). There is no `code` field in error
responses.

**4xx Client Errors** (e.g., malformed JSON body):
```json
{ "error": "Invalid JSON" }
```

**5xx Server Errors**:
```json
{ "error": "Request failed. Please try again." }
```
Development mode includes a `message` field with the actual error text.

## Rate Limiting

- **Limit**: 100 requests per minute per IP address (in-memory, per-process)
- Exceeding the limit returns `429 Too Many Requests` with
  `{ "error": "Too many requests. Max 100 requests per minute." }`
- There are currently no `X-RateLimit-*` response headers — the limit is
  enforced but not advertised per-response.

## Authentication

Currently, all endpoints are publicly accessible (for portfolio demo). In production, implement:

```bash
# Future: Bearer token authentication
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer eyJhbGc..."
```

## CORS

Frontend requests from `localhost:5173` are allowed. Configure additional origins via `ALLOWED_ORIGINS` environment variable:

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://your-domain.com
```

## Pagination

Endpoints support limit-based pagination:

```bash
# Get 50 records
curl "http://localhost:5000/api/receivables?limit=50"

# Sort order
curl "http://localhost:5000/api/receivables?order=desc"
```

---

**Last updated**: 2026-08-15

For more details, see:
- `README.md` — Project overview
- `DEPLOYMENT.md` — Deployment instructions
- `DATABASE_SCHEMA.md` — Database schema
