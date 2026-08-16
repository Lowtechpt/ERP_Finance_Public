# Contributing to ERP Finance

## Development Workflow

### Setup

```bash
# Clone and install
git clone <repo>
cd ERP_Finance_Public
npm install

# Start development server
npm run dev

# Open http://127.0.0.1:5173 in browser
```

### Backend Development

```bash
# Start backend only (API on port 5000)
npm run dev:api

# Seed demo database
npm run seed:demo

# Build backend TypeScript (tsc -p tsconfig.server.json -> dist-server/)
npm run build:server
```

### Code Standards

#### TypeScript
- `tsc --strict` must pass
- `any` is not banned outright — the SQL backends legitimately return
  `Promise<any[]>` for raw query rows shaped by PRIMAVERA's schema — but avoid
  it anywhere the shape is actually known; don't reach for it as a shortcut
- Explicit function signatures
- React hooks with proper dependencies

```tsx
// ✅ Good
export default function Page(): React.ReactNode {
  const [data, setData] = useState<DataType[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return <div>...</div>;
}

// ❌ Bad
export default function Page() {
  const [data, setData] = useState([]); // Missing type
  return <div>...</div>;
}
```

#### Components
1. Use `PageWrapper` for fullscreen containers
2. Use `KPIGrid` for metric headers (5 columns)
3. Use `SectionHeader` for page titles
4. Use `DataTable` for data presentation
5. Handle loading/error states with `PageLoadingState` / `PageEmptyState`

```tsx
// ✅ Pattern
<PageWrapper>
  <KPIGrid kpis={kpis} />
  <SectionHeader category="..." title="..." description="..." />
  <DataTable columns={columns} data={data} />
  {loading && <PageLoadingState />}
  {error && <PageEmptyState message={error} />}
</PageWrapper>
```

#### Styling
- Use Tailwind CSS (no inline styles)
- Gradient backgrounds: `bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50`
- Card styling: `rounded-3xl bg-white shadow-sm border border-white/40`
- Color coding:
  - Positive: `emerald-600`/`emerald-700`
  - Negative: `rose-600`
  - Neutral: `blue-600`
  - Warning: `amber-600`

#### API Integration
- Use `apiUrl()` from `@/lib/api` for endpoint URLs
- Type requests/responses with interfaces
- Handle errors with try/catch in fetch
- Set loading state before fetch, clear after

```tsx
// ✅ Good
interface DataResponse {
  items: Item[];
  count: number;
}

const [data, setData] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch(apiUrl("/api/endpoint"))
    .then(r => r.json() as Promise<DataResponse>)
    .then(d => setData(d.items))
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, []);
```

### Building

```bash
# Full build
npm run build

# Check TypeScript
npm run typecheck
```

### Testing

```bash
# Unit tests (Jest, with coverage)
npm test

# Node backend tests (compiled demo backend)
npm run test:node

# Typecheck + Jest + Node tests
npm run test:all
```

Current coverage: 323 Jest tests + 43 Node tests (366 total, all passing). All
23 dedicated pages have a test file — see README.md's "Testing" section for
the honest coverage breakdown, including which modules sit at 100% versus the
overall 43.7% line coverage.

## Commit Message Format

```
[TYPE] Brief description

- Bullet 1
- Bullet 2

Fixes #123
```

**Types**:
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring
- `style:` — CSS/styling changes
- `docs:` — Documentation
- `test:` — Tests
- `perf:` — Performance improvement

**Example**:
```
refactor: extract KPIGrid component

- Moved KPI logic from 5 pages into reusable KPIGrid
- Reduced code duplication by 50 lines
- Maintained all existing features

Fixes #45
```

## Adding a New Page

1. Create `src/pages/MyNewPage.tsx`
2. Follow the pattern:
   ```tsx
   import { useState, useEffect } from "react";
   import { PageWrapper, SectionHeader, KPIGrid, DataTable, PageLoadingState } from "@/components";
   import { formatCurrency } from "@/lib/format";
   import { apiUrl } from "@/lib/api";

   interface DataType {
     // Your types here
   }

   export default function MyNewPage() {
     const [data, setData] = useState<DataType[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       fetch(apiUrl("/api/myendpoint"))
         .then(r => r.json())
         .then(d => setData(d))
         .finally(() => setLoading(false));
     }, []);

     if (loading) return <PageLoadingState />;

     return (
       <PageWrapper>
         <KPIGrid kpis={[...]} />
         <SectionHeader category="..." title="..." description="..." />
         <DataTable columns={[...]} data={data} />
       </PageWrapper>
     );
   }
   ```
3. Add route to `src/App.tsx`
4. Test responsive design (mobile, tablet, desktop)
5. Run `npm run build` and validate

## Backend API Development

### Adding an Endpoint

1. Edit `server/primavera-api.ts`
2. Add route handler:
   ```ts
   if (request.url === "/api/myendpoint") {
     try {
       const data = await fetchFromDatabase(...);
       response.writeHead(200, { "Content-Type": "application/json" });
       response.end(JSON.stringify(data));
     } catch (error) {
       response.writeHead(500, { "Content-Type": "application/json" });
       response.end(JSON.stringify({ error: error.message }));
     }
   }
   ```
3. Update backend TypeScript with types
4. Test with `npm run dev:api`
5. Build with `npm run build:server`

### Working with Databases

- **SQL Server** (production): Uses `sqlserver.ts` adapter
- **SQLite** (demo): Uses `demo.ts` adapter

Both respond to the same API calls. No code changes needed to switch.

## Performance Guidelines

- Page bundles should be < 100KB each
- API responses should be < 1MB
- Component renders should be memoized if props-heavy
- Use React DevTools Profiler to check for unnecessary re-renders

## Debugging

### Check TypeScript Errors
```bash
npx tsc -b --pretty false
```

### Check Component Rendering
```bash
npm run dev
# Open React DevTools in browser
# Check Profiler tab
```

### API Issues
```bash
npm run dev:api
# Check server console for errors
# Verify SQL queries with sqlcmd directly
```

### Build Validation
```bash
npm run typecheck && npm run build && npm run test && npm run test:node
```

## Questions?

- **TypeScript Issues**: Check `tsconfig.json` and error messages
- **Design System**: See `ARCHITECTURE.md` → Design System section
- **API Routes**: See `ARCHITECTURE.md` → Backend Architecture section
- **Component Usage**: Check `src/components/` for examples

## Code Review Checklist

Before submitting PR:
- [ ] `npm run build` passes
- [ ] `tsc -b` has no errors
- [ ] `npm run test` and `npm run test:node` pass
- [ ] `npm audit` shows no new vulnerabilities
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] No unused imports or variables
- [ ] No new `any` where the shape is actually known (see TypeScript section above)
- [ ] Components use design system (PageWrapper, KPIGrid, etc.)
- [ ] API calls have proper error handling
- [ ] Commit messages follow format

