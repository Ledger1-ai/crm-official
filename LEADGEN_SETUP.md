# LeadGen Wizard - Setup & Documentation

## 🚀 World-Class Lead Scraping System

This LeadGen Wizard implementation provides enterprise-grade lead generation with:
- **Intelligent SERP scraping** with rate limiting and error handling
- **Company enrichment** from website crawling (metadata, tech stack, social links)
- **Global deduplication** with private aggregation index
- **ICP fit scoring** for precise targeting
- **User-specific lead pools** with isolated data management
- **Clean data normalization** (emails, phones, domains, URLs)
- **Comprehensive provenance tracking** for audit trails

---

## 📋 What Was Built

### 1. Database Architecture (MongoDB via Prisma)

**New Global Aggregation Models** (Private, cross-user deduplication):
- `crm_Global_Companies`: Normalized company data with unique domain/dedupeKey
  - Fields: domain, companyName, homepageUrl, industry, techStack, dedupeKey, firstSeen, lastSeen, provenance, status
  - Indexes on domain and dedupeKey for fast lookups

- `crm_Global_Persons`: Normalized contact data with unique email/dedupeKey
  - Fields: email, fullName, title, linkedinUrl, phone, companyDomain, companyId, dedupeKey, emailStatus, confidence, firstSeen, lastSeen, provenance, status
  - Indexes on email, companyDomain, and dedupeKey

**User-Specific Models** (Already existed, enhanced):
- `crm_Lead_Pools`: User's lead collection with ICP config
- `crm_Lead_Candidates`: Pool-specific company candidates with dedupeKey
- `crm_Contact_Candidates`: Pool-specific contact candidates
- `crm_Lead_Gen_Jobs`: Job tracking with status, counters, logs
- `crm_Lead_Source_Events`: Query/source tracking per job

### 2. Scraping & Enrichment Modules

**lib/scraper/serp.ts**
- DuckDuckGo HTML search (avoids anti-bot measures)
- ICP-aware query generation
- Domain extraction and deduplication
- Upserts to global company index
- Creates pool-specific candidates
- Rate limiting (configurable via SCRAPER_QUERY_DELAY_MS env var)

**lib/scraper/normalize.ts**
- Email normalization & validation (filters disposable domains)
- Phone normalization to E.164 format
- Name/company name normalization
- URL canonicalization (removes tracking params)
- Domain normalization
- LinkedIn URL normalization
- Deterministic dedupe key generation
- Confidence scoring for data quality

**lib/scraper/company-enrichment.ts**
- Website metadata extraction (title, description, keywords)
- Tech stack detection (React, WordPress, Shopify, etc.)
- Social link discovery (LinkedIn, Twitter, Facebook, Instagram)
- Contact info extraction (email, phone)
- Industry inference from content
- Confidence scoring

**lib/scraper/icp-scoring.ts**
- Company ICP fit scoring (0-100)
  - Industry match (30 pts)
  - Tech stack match (25 pts)
  - Geography match (20 pts)
  - Data completeness (15 pts)
  - Company size (10 pts)
- Contact ICP fit scoring (0-100)
  - Title match (40 pts)
  - LinkedIn presence (20 pts)
  - Email availability (20 pts)
  - Name completeness (10 pts)
  - Company domain (10 pts)
- Exclusion filters
- Ranking functions
- ICP insights generator

### 3. Pipeline Orchestration

**actions/leads/run-pipeline.ts**
Enhanced pipeline with:
1. SERP scraping phase
2. Company enrichment phase
3. ICP scoring phase
4. Comprehensive logging and counters

**Counters tracked**:
- companiesFound
- candidatesCreated
- contactsCreated
- sourceEvents
- companiesEnriched
- enrichmentFailed

---

## 🔧 Setup Instructions

### Step 1: Apply Database Schema

The Prisma schema has been updated with the new global aggregation models. Apply it:

```bash
cd nextcrm-app

# Push schema to MongoDB
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 2: Configure Environment Variables

Add to your `.env` file (optional overrides):

```env
# Scraper rate limiting (milliseconds between queries)
SCRAPER_QUERY_DELAY_MS=1500

# Database URL (already configured)
DATABASE_URL="mongodb+srv://..."
```

### Step 3: Install Dependencies (if needed)

The system uses existing dependencies (Puppeteer, Prisma, etc.). If any are missing:

```bash
cd nextcrm-app
pnpm install
```

### Step 4: Test the System

#### A. Create a Lead Pool via UI

1. Navigate to `/crm/leads/autogen`
2. Fill in the LeadGen Wizard form:
   - **Pool Name**: "Q1 2025 Tech Companies"
   - **Industries**: Software & Technology, SaaS
   - **Geos**: United States, Canada
   - **Tech Stack**: React, Next.js
   - **Company Sizes**: 10-50, 50-250
   - **Max Companies**: 50

3. Submit the form - this creates a pool and job

#### B. Trigger the Pipeline

The job runs automatically when created, or manually trigger:

```bash
# Via API (replace {jobId} with actual job ID)
curl -X POST http://localhost:3000/api/leads/autogen/run/{jobId}
```

#### C. Monitor Progress

```bash
# Check job status
curl http://localhost:3000/api/leads/autogen/status/{jobId}
```

Expected response:
```json
{
  "job": {
    "id": "...",
    "status": "SUCCESS",
    "counters": {
      "companiesFound": 45,
      "candidatesCreated": 45,
      "companiesEnriched": 40,
      "sourceEvents": 12
    }
  },
  "candidatesCount": 45
}
```

#### D. View Results

Navigate to `/crm/leads/pools/{poolId}` to see:
- Companies ranked by ICP fit score
- Enriched data (description, industry, tech stack)
- Social links and contact info

---

## 🏗️ Architecture Overview

### Data Flow

```
1. User creates pool with ICP config
   ↓
2. Job created in QUEUED status
   ↓
3. Pipeline execution:
   a. SERP Scraping
      - Generate ICP-aware queries
      - Search and extract domains
      - Create source events
      - Upsert to global company index
      - Create pool candidates
   
   b. Company Enrichment
      - Crawl candidate websites
      - Extract metadata & tech stack
      - Update global companies
      - Update pool candidates
   
   c. ICP Scoring
      - Calculate fit scores
      - Update candidate scores
      - Rank by relevance
   ↓
4. Job marked SUCCESS
   ↓
5. Results available in pool
```

### Privacy & Isolation

- **Global Index**: Private, not exposed via APIs
  - Used for cross-job deduplication
  - Maintains provenance history
  - Updates timestamps on revisit

- **User Pools**: Isolated per user/pool
  - Contains references to global entities
  - Pool-specific metadata (tags, notes, stages)
  - User can only see their pool data

### Deduplication Strategy

**Company Deduplication**:
- Primary: Normalized domain (unique)
- Secondary: DedupeKey `company:{domain}`
- On collision: Update lastSeen, merge provenance

**Person Deduplication** (future):
- Priority 1: Normalized email
- Priority 2: Name + Company domain
- Priority 3: Name + Title + Company

---

## 🎯 Features & Capabilities

### Current Features

✅ **SERP Scraping**
- DuckDuckGo HTML search
- ICP-aware query generation
- Configurable rate limiting
- Error recovery and logging

✅ **Company Enrichment**
- Website metadata extraction
- Tech stack detection (20+ technologies)
- Social media link discovery
- Contact info extraction
- Industry inference

✅ **Data Normalization**
- Email validation & normalization
- Phone number standardization (E.164)
- URL canonicalization
- Domain normalization
- Name formatting

✅ **ICP Fit Scoring**
- Multi-factor scoring (industry, tech, geo, size)
- Configurable weights
- Automatic ranking
- Exclusion filters

✅ **Global Deduplication**
- Cross-job domain deduplication
- Provenance tracking
- Timestamp management
- Private global index

✅ **User-Specific Pools**
- Isolated data per user
- Custom ICP configurations
- Pool-level management

### Data Quality Metrics

- **Confidence scoring** for all extracted data
- **Source tracking** for audit trails
- **Provenance chains** showing data origin
- **Data completeness** indicators
- **ICP fit scores** for relevance

---

## 🚀 Usage Examples

### Example 1: Find SaaS Companies in Tech

```typescript
const wizard = {
  name: "SaaS Prospects - Q1",
  description: "B2B SaaS companies for outreach",
  icp: {
    industries: ["Software & Technology", "SaaS"],
    geos: ["United States", "United Kingdom"],
    techStack: ["React", "Node.js", "AWS"],
    titles: ["CEO", "CTO", "VP Engineering"],
    excludeDomains: ["competitor1.com", "competitor2.com"]
  },
  limits: {
    maxCompanies: 100,
    maxContactsPerCompany: 3
  }
};

// Creates pool and job
const { poolId, jobId } = await startLeadGenJob({ userId, wizard });
```

### Example 2: Target E-commerce Brands

```typescript
const wizard = {
  name: "E-commerce Leads",
  icp: {
    industries: ["E-commerce", "Retail"],
    techStack: ["Shopify", "WooCommerce"],
    geos: ["United States", "Canada"],
    companySizes: ["10-50", "50-250"],
    titles: ["CMO", "Marketing Director", "E-commerce Manager"]
  },
  limits: {
    maxCompanies: 150
  }
};
```

---

## 📊 Monitoring & Metrics

### Job Logs

Each job tracks detailed logs accessible via the status endpoint:

```json
{
  "logs": [
    {
      "ts": "2025-10-08T20:30:00.000Z",
      "msg": "SERP query results for 'SaaS companies in US'"
    },
    {
      "ts": "2025-10-08T20:30:15.000Z",
      "msg": "Company enrichment: 40 enriched, 2 failed"
    },
    {
      "ts": "2025-10-08T20:30:45.000Z",
      "msg": "LeadGen pipeline complete: domains=42, candidates=42, enriched=40"
    }
  ]
}
```

### Key Performance Indicators

- **Success Rate**: enriched / (enriched + failed)
- **ICP Match Rate**: candidates with score >= 60 / total candidates
- **Data Completeness**: avg(fields populated) per candidate
- **Dedup Efficiency**: unique domains / total domains found

---

## 🔮 Future Enhancements

### Phase 2: Contact Discovery
- LinkedIn profile scraping
- Email pattern detection
- Hunter.io / Apollo.io integration
- Contact-level ICP scoring

### Phase 3: Email Verification
- Syntax validation (already done)
- MX record checking
- SMTP verification
- Disposable domain detection (already done)
- Catch-all detection

### Phase 4: Advanced Features
- Bulk export to CSV
- CRM integration (auto-create Accounts/Contacts)
- Email sequence triggers
- Webhook notifications
- API access for external integrations
- Machine learning for scoring optimization

### Phase 5: Scale & Performance
- Background job queues (Bull/BullMQ)
- Distributed scraping
- Caching layers
- Real-time progress updates (WebSockets)
- Rate limit management across workers

---

## 🐛 Troubleshooting

### Issue: Prisma schema validation errors

**Solution**: Ensure you're using MongoDB provider and run:
```bash
npx prisma db push
npx prisma generate
```

### Issue: Browser/Puppeteer errors

**Solution**: Ensure Puppeteer is installed:
```bash
pnpm install puppeteer
```

### Issue: Rate limiting / Too many requests

**Solution**: Increase delay between queries:
```env
SCRAPER_QUERY_DELAY_MS=3000
```

### Issue: Low enrichment success rate

**Solution**: 
- Check network connectivity
- Verify website accessibility
- Increase timeout in company-enrichment.ts (line 48)
- Review error logs in job.logs

---

## 📝 API Reference

### POST /api/leads/autogen
Creates a new lead pool and job.

**Request Body**:
```json
{
  "name": "Pool Name",
  "description": "Optional description",
  "icp": {
    "industries": ["Software"],
    "geos": ["US"],
    "techStack": ["React"],
    "titles": ["CEO"],
    "limits": { "maxCompanies": 100 }
  }
}
```

**Response**:
```json
{
  "poolId": "...",
  "jobId": "..."
}
```

### POST /api/leads/autogen/run/{jobId}
Triggers pipeline execution for a job.

**Response**:
```json
{
  "ok": true,
  "createdCandidates": 45,
  "createdContacts": 0
}
```

### GET /api/leads/autogen/status/{jobId}
Retrieves job status and metrics.

**Response**:
```json
{
  "job": {
    "id": "...",
    "status": "SUCCESS",
    "counters": { ... }
  },
  "pool": { ... },
  "candidatesCount": 45
}
```

---

## 🎉 Conclusion

You now have a world-class lead scraping system that rivals enterprise tools like Apollo.io, Hunter.io, and ZoomInfo - but fully integrated into your CRM with complete data ownership.

**Key Differentiators**:
- Private global deduplication
- ICP-aware intelligent targeting
- Clean, normalized data
- Full provenance tracking
- User-specific isolation
- Extensible architecture

**Next Steps**:
1. Apply the Prisma schema: `npx prisma db push && npx prisma generate`
2. Test the wizard via UI
3. Review results and refine ICP configurations
4. Monitor job logs and metrics
5. Scale up with additional features from Phase 2+

**Remember**: This system respects rate limits and websites' robots.txt. Always scrape responsibly and in compliance with applicable laws and terms of service.

🌍 **Empowering businesses globally with clean, targeted leads!**
