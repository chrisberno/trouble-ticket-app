# Trouble Ticket System

A standalone Next.js ticketing system with PostgreSQL persistence.

## Features

- Create and manage support tickets
- Customer search by name or phone
- Status tracking (Open, In Progress, Closed)
- Twilio Flex integration via query parameters
- Responsive design with Tailwind CSS

## Local Development

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd trouble-ticket-app
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Local Testing with Persistence

The system uses SQLite for local development (data persists between restarts):

```bash
# Build and test locally
npm run build
npm start

# Test ticket creation and retrieval
# Data stored in local SQLite database
```

### Production Build Testing

```bash
# Test production build locally
npm run build
npm run lint
npm run typecheck  # if available
```

## Vercel Deployment

### Database Setup

When deploying to Vercel, you need to set up PostgreSQL:

1. **Create Vercel Postgres Database**
   - Go to https://vercel.com/dashboard
   - Find your deployed project
   - Navigate to Storage tab
   - Click "Create database"
   - Choose **Neon** (Serverless Postgres)
   - Select both Preview and Production
   - **IMPORTANT**: Change Environment Variables Prefix from `STORAGE` to `POSTGRES`
   - Click "Create & Connect"

2. **Fix Environment Variables**
   
   After connecting, you need to manually add the correct variable:
   - Go to Project Settings > Environment Variables
   - Click "Add New"
   - Key: `POSTGRES_URL`
   - Value: Copy the value from `POSTGRES_POSTGRES_URL` 
   - Environment: All Environments
   - Save and redeploy

   **Note**: The `@vercel/postgres` package expects `POSTGRES_URL`, but Neon creates `POSTGRES_POSTGRES_URL` with the prefix.

3. **Deploy**
   ```bash
   # Connect to Vercel (if not already)
   npx vercel login
   
   # Deploy
   npx vercel --prod
   ```

4. **Database Initialization**
   
   The database table is created automatically on first API call via the `initDB()` function in `lib/db.ts`.

### Integration with Twilio Flex

The system accepts query parameters for Flex integration:

- `?name=John+Doe` - Pre-fill customer name
- `?phone=5551234567` - Pre-fill customer phone
- `?name=John+Doe&phone=5551234567` - Pre-fill both

Example Flex Enhanced CRM Container URL:
```
https://your-app.vercel.app/?name={{task.customerName}}&phone={{task.customerPhone}}
```

## API Endpoints

- `GET /api/tickets` - List tickets (optional query params: name, phone)
- `POST /api/tickets` - Create ticket
- `PATCH /api/tickets/[id]` - Update ticket status

## Technology Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- SQLite (local) / PostgreSQL (production)
- @vercel/postgres