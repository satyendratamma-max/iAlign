# iAlign Performance Testing Guide

## Overview

This guide documents the large-scale performance testing infrastructure created for the iAlign application, including data generation scripts, performance testing tools, and usage instructions.

## What Was Created

### 1. Large-Scale Data Generation Script
**File:** `backend/src/scripts/seed-large-scale.ts`

**Purpose:** Generate enterprise-scale test data for performance and scalability testing

**Target Scale:**
- **1,000 Resources** with full profiles and capabilities
- **~500 Projects** across all domains and fiscal years
- **~5,000 Resource Capabilities** (5 per resource)
- **~5,000 Project Requirements** (10 per project)
- **~10,000 Resource Allocations** (20 per project)
- **700 Milestones** (first 100 projects, 7 phases each)

**Key Features:**
- Batch processing for performance (100 records per batch)
- Realistic data distribution across domains
- Proper foreign key relationships
- Progress indicators during execution
- Detailed execution summary

**Usage:**
```bash
cd backend
npm run seed:large
```

**Expected Runtime:** 2-4 minutes (depending on hardware)

### 2. Performance Testing Script
**File:** `backend/src/scripts/performance-test.ts`

**Purpose:** Automated API performance testing with detailed metrics

**What It Tests:**
- **Read Operations:**
  - List endpoints (Resources, Projects, Allocations, Domains, Segment Functions)
  - Single record queries (by ID)
  - Include queries (with associations)
  - Filtering and search operations

- **Write Operations:**
  - Resource allocation creation
  - Other CRUD operations

- **Aggregation Endpoints:**
  - Dashboard stats
  - Capacity overview
  - Resource utilization reports

**Metrics Collected:**
- Average Response Time
- Min/Max Response Time
- P50, P95, P99 Percentiles
- Success Rate
- Failed Request Count

**Output:**
- JSON report (`performance-results/performance-report-[timestamp].json`)
- Human-readable text report (`performance-results/performance-report-[timestamp].txt`)
- Console summary with top slowest/fastest endpoints

**Usage:**
```bash
cd backend
npm run perf:test
```

## NPM Scripts Added

```json
{
  "seed:large": "ts-node src/scripts/seed-large-scale.ts",
  "perf:test": "ts-node src/scripts/performance-test.ts"
}
```

## Performance Testing Workflow

### Step 1: Populate Large-Scale Data
```bash
cd backend
npm run seed:large
```

This will:
1. Drop all existing data (with foreign key constraint handling)
2. Create fresh database schema
3. Populate with 10,000+ records
4. Display progress indicators
5. Show final summary

### Step 2: Run Performance Tests
```bash
cd backend
npm run perf:test
```

This will:
1. Authenticate with admin credentials
2. Test 15+ API endpoints
3. Run 10-20 iterations per endpoint
4. Generate comprehensive reports
5. Display summary in console

### Step 3: Analyze Results

**Console Output:**
- Real-time progress for each endpoint
- Success rate and response times
- Top 5 slowest endpoints
- Top 5 fastest endpoints

**Report Files:**
- JSON file: Machine-readable for further analysis
- Text file: Human-readable formatted report

## Expected Performance Baselines

### With Large-Scale Data (~10,000 records):

**List Endpoints (Paginated):**
- List Resources: 100-300ms
- List Projects: 100-300ms
- List Allocations: 150-400ms

**Single Record Queries:**
- Get Resource by ID: 20-50ms
- Get Project by ID: 20-50ms

**Include Queries (with associations):**
- Resources with Capabilities: 200-500ms
- Projects with Requirements: 200-500ms

**Filtering/Search:**
- Filter by Role: 150-350ms
- Filter by Status: 150-350ms
- Filter by Fiscal Year: 150-350ms

**Aggregation Endpoints:**
- Dashboard Stats: 300-800ms
- Capacity Overview: 400-1000ms
- Resource Utilization: 300-800ms

## Performance Optimization Opportunities

### Database Level
1. **Indexing:**
   - Already indexed: scenarioId, projectId, domainId
   - Consider adding: status, fiscalYear, role fields for frequent filters

2. **Query Optimization:**
   - Use SELECT specific columns instead of SELECT *
   - Implement pagination for large result sets
   - Use database-level aggregations where possible

3. **Caching:**
   - Implement Redis for frequently accessed data
   - Cache dashboard aggregations
   - Cache user sessions and permissions

### API Level
1. **Response Pagination:**
   - Limit default page size to 50-100 records
   - Implement cursor-based pagination for large datasets

2. **Field Selection:**
   - Allow clients to specify which fields they need
   - Reduce payload size for list endpoints

3. **Database Connection Pool:**
   - Optimize pool size based on concurrent requests
   - Monitor connection usage

### Frontend Level
1. **Virtual Scrolling:**
   - Implement for large tables (Resource lists, Project lists)
   - Only render visible rows

2. **Lazy Loading:**
   - Load details only when needed
   - Defer loading of charts and visualizations

3. **Debouncing:**
   - Implement for search inputs
   - Reduce API calls during typing

## Monitoring Recommendations

### Key Metrics to Track

1. **Response Time:**
   - P95 and P99 percentiles (not just average)
   - Track over time to identify degradation

2. **Throughput:**
   - Requests per second
   - Concurrent users supported

3. **Error Rate:**
   - 4xx errors (client errors)
   - 5xx errors (server errors)

4. **Resource Utilization:**
   - CPU usage
   - Memory usage
   - Database connection pool usage

### Tools to Consider

1. **Application Performance Monitoring (APM):**
   - New Relic
   - Datadog
   - Application Insights

2. **Database Monitoring:**
   - SQL Server Profiler
   - Query Store
   - Execution plans for slow queries

3. **Load Testing:**
   - Apache JMeter
   - k6
   - Artillery

## Scale Testing Scenarios

### Scenario 1: Current Scale (10K records)
- **Purpose:** Baseline performance
- **Data:** 1,000 resources, 500 projects, 10,000 allocations
- **Expected Users:** 50-100 concurrent
- **Script:** `npm run seed:large`

### Scenario 2: Medium Enterprise (50K records)
- **Purpose:** Test medium enterprise scale
- **Data:** 5,000 resources, 2,500 projects, 50,000 allocations
- **Expected Users:** 200-500 concurrent
- **Script:** Modify `SCALE_CONFIG` in `seed-large-scale.ts`:
  ```typescript
  const SCALE_CONFIG = {
    RESOURCES_COUNT: 5000,
    PROJECTS_PER_DOMAIN: 208,  // ~2,500 projects
    ...
  };
  ```

### Scenario 3: Large Enterprise (100K+ records)
- **Purpose:** Test large enterprise scale
- **Data:** 10,000 resources, 5,000 projects, 100,000 allocations
- **Expected Users:** 500-1000 concurrent
- **Script:** Modify `SCALE_CONFIG`:
  ```typescript
  const SCALE_CONFIG = {
    RESOURCES_COUNT: 10000,
    PROJECTS_PER_DOMAIN: 416,  // ~5,000 projects
    ...
  };
  ```

## Troubleshooting

### Seed Script Issues

**Problem:** Foreign key constraint errors
**Solution:** The script includes automatic FK constraint dropping. If issues persist, manually run:
```sql
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.'
            + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT '
            + QUOTENAME(name) + ';'
FROM sys.foreign_keys;
EXEC sp_executesql @sql;
```

**Problem:** Out of memory during seeding
**Solution:** Reduce batch size or use smaller scale configuration

**Problem:** Slow seeding performance
**Solution:**
- Temporarily disable database logging
- Increase batch size
- Use faster storage (SSD)

### Performance Test Issues

**Problem:** Authentication failed
**Solution:** Ensure admin user exists with password `Admin@123`

**Problem:** All endpoints failing
**Solution:** Verify backend server is running on port 5000

**Problem:** High error rates
**Solution:** Check API logs for specific errors

## Best Practices

1. **Regular Testing:**
   - Run performance tests after major changes
   - Establish baseline metrics
   - Monitor trends over time

2. **Realistic Data:**
   - Use production-like data distributions
   - Include edge cases
   - Test with various user roles

3. **Incremental Optimization:**
   - Start with slowest endpoints
   - Measure impact of each change
   - Don't optimize prematurely

4. **Documentation:**
   - Document baseline performance
   - Record optimization changes
   - Share findings with team

## Next Steps

1. **Establish Baselines:**
   - Run initial performance tests
   - Document current performance
   - Set target metrics

2. **Identify Bottlenecks:**
   - Use performance test results
   - Analyze slow endpoints
   - Check database query plans

3. **Implement Optimizations:**
   - Start with high-impact items
   - Test each change
   - Document improvements

4. **Continuous Monitoring:**
   - Set up APM tool
   - Create performance dashboards
   - Establish alerts for degradation

## Conclusion

This performance testing infrastructure provides:
- ✅ Automated large-scale data generation
- ✅ Comprehensive API performance testing
- ✅ Detailed metrics and reporting
- ✅ Scalability testing capabilities
- ✅ Foundation for continuous performance monitoring

Use these tools regularly to ensure iAlign performs well as your data grows and user base expands.
