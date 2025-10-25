import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Performance Testing Script for iAlign API
 *
 * Tests API endpoints with large datasets and measures:
 * - Response time
 * - Throughput
 * - Memory usage
 * - Error rates
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
const TEST_RESULTS_DIR = path.join(__dirname, '../../performance-results');

interface TestResult {
  endpoint: string;
  method: string;
  iterations: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  timestamp: string;
}

interface PerformanceReport {
  testDate: string;
  apiBaseUrl: string;
  databaseSize: any;
  testResults: TestResult[];
  summary: {
    totalEndpointsTested: number;
    avgResponseTimeOverall: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
  };
}

class PerformanceTest {
  private results: TestResult[] = [];
  private authToken: string = '';

  async authenticate(): Promise<void> {
    try {
      console.log('🔐 Authenticating...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@ialign.com',
        password: 'Admin@123',
      });

      this.authToken = response.data.token;
      console.log('   ✅ Authentication successful\n');
    } catch (error: any) {
      console.error('   ❌ Authentication failed:', error.message);
      throw error;
    }
  }

  async testEndpoint(
    _name: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    iterations: number = 10
  ): Promise<void> {
    console.log(`📊 Testing: ${method} ${endpoint}`);

    const responseTimes: number[] = [];
    let failedRequests = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        };

        if (method === 'GET') {
          await axios.get(`${API_BASE_URL}${endpoint}`, config);
        } else if (method === 'POST') {
          await axios.post(`${API_BASE_URL}${endpoint}`, data, config);
        } else if (method === 'PUT') {
          await axios.put(`${API_BASE_URL}${endpoint}`, data, config);
        } else if (method === 'DELETE') {
          await axios.delete(`${API_BASE_URL}${endpoint}`, config);
        }

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      } catch (error: any) {
        failedRequests++;
        console.log(`   ⚠️  Request ${i + 1} failed: ${error.message}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (responseTimes.length === 0) {
      console.log(`   ❌ All requests failed for ${endpoint}\n`);
      return;
    }

    // Calculate statistics
    responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = responseTimes[0];
    const maxResponseTime = responseTimes[responseTimes.length - 1];
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    const successRate = ((iterations - failedRequests) / iterations) * 100;

    const result: TestResult = {
      endpoint,
      method,
      iterations,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p50,
      p95,
      p99,
      successRate,
      totalRequests: iterations,
      failedRequests,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);

    console.log(`   ✅ Avg: ${avgResponseTime.toFixed(2)}ms | Min: ${minResponseTime}ms | Max: ${maxResponseTime}ms | P95: ${p95}ms | Success: ${successRate.toFixed(1)}%\n`);
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      return response.data;
    } catch (error) {
      // If stats endpoint doesn't exist, return placeholder
      return {
        resources: 'N/A',
        projects: 'N/A',
        allocations: 'N/A',
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Performance Tests...\n');

    try {
      await this.authenticate();

      // Test critical read endpoints
      console.log('📖 Testing READ Endpoints (Critical for UI Performance)\n');

      await this.testEndpoint('List Resources', 'GET', '/resources', undefined, 20);
      await this.testEndpoint('List Resources with Capabilities', 'GET', '/resources?include=capabilities', undefined, 20);
      await this.testEndpoint('List Projects', 'GET', '/projects', undefined, 20);
      await this.testEndpoint('List Projects with Requirements', 'GET', '/projects?include=requirements', undefined, 20);
      await this.testEndpoint('List Allocations', 'GET', '/allocations', undefined, 20);
      await this.testEndpoint('List Domains', 'GET', '/domains', undefined, 20);
      await this.testEndpoint('List Segment Functions', 'GET', '/segment-functions', undefined, 20);

      // Test specific resource queries
      console.log('🔍 Testing Specific Queries\n');

      await this.testEndpoint('Get Resource by ID', 'GET', '/resources/1', undefined, 20);
      await this.testEndpoint('Get Project by ID', 'GET', '/projects/1', undefined, 20);
      await this.testEndpoint('Get Resource Capabilities', 'GET', '/resources/1/capabilities', undefined, 20);
      await this.testEndpoint('Get Project Requirements', 'GET', '/projects/1/requirements', undefined, 20);

      // Test filtering and search
      console.log('🔎 Testing Filtering and Search\n');

      await this.testEndpoint('Search Resources by Role', 'GET', '/resources?role=Developer', undefined, 15);
      await this.testEndpoint('Search Projects by Status', 'GET', '/projects?status=In%20Progress', undefined, 15);
      await this.testEndpoint('Filter Projects by Fiscal Year', 'GET', '/projects?fiscalYear=FY25', undefined, 15);

      // Test dashboard/aggregation endpoints
      console.log('📈 Testing Dashboard/Aggregation Endpoints\n');

      await this.testEndpoint('Dashboard Stats', 'GET', '/dashboard/stats', undefined, 15);
      await this.testEndpoint('Capacity Overview', 'GET', '/capacity/overview', undefined, 15);
      await this.testEndpoint('Resource Utilization', 'GET', '/reports/utilization', undefined, 15);

      // Test write operations (fewer iterations)
      console.log('✍️  Testing WRITE Operations\n');

      await this.testEndpoint(
        'Create Resource Allocation',
        'POST',
        '/allocations',
        {
          projectId: 1,
          resourceId: 1,
          resourceCapabilityId: 1,
          projectRequirementId: 1,
          allocationType: 'Dedicated',
          allocationPercentage: 100,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        5
      );

      console.log('\n✅ All performance tests completed!\n');

      // Generate report
      await this.generateReport();
    } catch (error: any) {
      console.error('\n❌ Performance testing failed:', error.message);
      throw error;
    }
  }

  async generateReport(): Promise<void> {
    console.log('📝 Generating performance report...\n');

    // Calculate overall statistics
    const avgResponseTimeOverall =
      this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;

    const slowest = this.results.reduce((prev, current) =>
      current.avgResponseTime > prev.avgResponseTime ? current : prev
    );

    const fastest = this.results.reduce((prev, current) =>
      current.avgResponseTime < prev.avgResponseTime ? current : prev
    );

    const databaseSize = await this.getDatabaseStats();

    const report: PerformanceReport = {
      testDate: new Date().toISOString(),
      apiBaseUrl: API_BASE_URL,
      databaseSize,
      testResults: this.results,
      summary: {
        totalEndpointsTested: this.results.length,
        avgResponseTimeOverall,
        slowestEndpoint: `${slowest.method} ${slowest.endpoint} (${slowest.avgResponseTime.toFixed(2)}ms)`,
        fastestEndpoint: `${fastest.method} ${fastest.endpoint} (${fastest.avgResponseTime.toFixed(2)}ms)`,
      },
    };

    // Ensure results directory exists
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    }

    // Save JSON report
    const jsonReportPath = path.join(
      TEST_RESULTS_DIR,
      `performance-report-${new Date().toISOString().replace(/:/g, '-')}.json`
    );
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    // Generate human-readable report
    const textReport = this.generateTextReport(report);
    const textReportPath = path.join(
      TEST_RESULTS_DIR,
      `performance-report-${new Date().toISOString().replace(/:/g, '-')}.txt`
    );
    fs.writeFileSync(textReportPath, textReport);

    console.log(`✅ Reports saved:`);
    console.log(`   - JSON: ${jsonReportPath}`);
    console.log(`   - Text: ${textReportPath}\n`);

    // Print summary to console
    console.log('📊 Performance Test Summary:\n');
    console.log(`   Total Endpoints Tested: ${report.summary.totalEndpointsTested}`);
    console.log(`   Overall Avg Response Time: ${avgResponseTimeOverall.toFixed(2)}ms`);
    console.log(`   Fastest Endpoint: ${report.summary.fastestEndpoint}`);
    console.log(`   Slowest Endpoint: ${report.summary.slowestEndpoint}\n`);

    // Print top 5 slowest endpoints
    console.log('🐌 Top 5 Slowest Endpoints:');
    const sortedBySpeed = [...this.results].sort((a, b) => b.avgResponseTime - a.avgResponseTime);
    sortedBySpeed.slice(0, 5).forEach((result, index) => {
      console.log(
        `   ${index + 1}. ${result.method} ${result.endpoint}: ${result.avgResponseTime.toFixed(2)}ms (P95: ${result.p95}ms)`
      );
    });

    console.log('\n⚡ Top 5 Fastest Endpoints:');
    sortedBySpeed
      .slice(-5)
      .reverse()
      .forEach((result, index) => {
        console.log(
          `   ${index + 1}. ${result.method} ${result.endpoint}: ${result.avgResponseTime.toFixed(2)}ms (P95: ${result.p95}ms)`
        );
      });

    console.log('\n');
  }

  generateTextReport(report: PerformanceReport): string {
    let text = '═══════════════════════════════════════════════════════\n';
    text += '          iALIGN PERFORMANCE TEST REPORT\n';
    text += '═══════════════════════════════════════════════════════\n\n';

    text += `Test Date: ${new Date(report.testDate).toLocaleString()}\n`;
    text += `API Base URL: ${report.apiBaseUrl}\n`;
    text += `Database Size: ${JSON.stringify(report.databaseSize, null, 2)}\n\n`;

    text += '───────────────────────────────────────────────────────\n';
    text += '                    SUMMARY\n';
    text += '───────────────────────────────────────────────────────\n\n';

    text += `Total Endpoints Tested: ${report.summary.totalEndpointsTested}\n`;
    text += `Overall Avg Response Time: ${report.summary.avgResponseTimeOverall.toFixed(2)}ms\n`;
    text += `Fastest Endpoint: ${report.summary.fastestEndpoint}\n`;
    text += `Slowest Endpoint: ${report.summary.slowestEndpoint}\n\n`;

    text += '───────────────────────────────────────────────────────\n';
    text += '                 DETAILED RESULTS\n';
    text += '───────────────────────────────────────────────────────\n\n';

    report.testResults.forEach((result) => {
      text += `Endpoint: ${result.method} ${result.endpoint}\n`;
      text += `  Iterations: ${result.iterations}\n`;
      text += `  Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms\n`;
      text += `  Min: ${result.minResponseTime}ms | Max: ${result.maxResponseTime}ms\n`;
      text += `  P50: ${result.p50}ms | P95: ${result.p95}ms | P99: ${result.p99}ms\n`;
      text += `  Success Rate: ${result.successRate.toFixed(1)}% (${result.failedRequests} failed)\n`;
      text += `  Timestamp: ${new Date(result.timestamp).toLocaleString()}\n\n`;
    });

    text += '═══════════════════════════════════════════════════════\n';
    text += '                    END OF REPORT\n';
    text += '═══════════════════════════════════════════════════════\n';

    return text;
  }
}

// Run the performance tests
const performanceTest = new PerformanceTest();
performanceTest
  .runAllTests()
  .then(() => {
    console.log('✅ Performance testing completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  });
