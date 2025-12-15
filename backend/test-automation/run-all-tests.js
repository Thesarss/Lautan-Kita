// Master Test Runner - Executes both Black Box and White Box Testing
const BlackBoxTester = require('./blackbox-tests');
const WhiteBoxAnalyzer = require('./whitebox-analyzer');
const fs = require('fs');
const path = require('path');

class MasterTestRunner {
  constructor() {
    this.results = {
      blackBox: null,
      whiteBox: null,
      timestamp: new Date().toISOString(),
      summary: {}
    };
  }

  async runCompleteTestSuite() {
    console.log('🚀 LAUTAN KITA - COMPLETE TESTING SUITE');
    console.log('='.repeat(80));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));

    try {
      // 1. Run Black Box Tests
      console.log('\n📋 PHASE 1: BLACK BOX TESTING');
      console.log('='.repeat(50));
      await this.runBlackBoxTests();

      // 2. Run White Box Analysis
      console.log('\n📊 PHASE 2: WHITE BOX ANALYSIS');
      console.log('='.repeat(50));
      await this.runWhiteBoxAnalysis();

      // 3. Generate Combined Report
      console.log('\n📄 PHASE 3: GENERATING COMPREHENSIVE REPORT');
      console.log('='.repeat(50));
      this.generateCombinedReport();

      // 4. Generate Test Summary
      this.generateTestSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runBlackBoxTests() {
    console.log('Starting functional testing...\n');
    
    const tester = new BlackBoxTester();
    await tester.runAllTests();
    
    this.results.blackBox = {
      total: tester.results.total,
      passed: tester.results.passed,
      failed: tester.results.failed,
      passRate: Math.round(tester.results.passed / tester.results.total * 100),
      tests: tester.results.tests
    };
    
    console.log('\n✅ Black box testing completed');
  }

  async runWhiteBoxAnalysis() {
    console.log('Starting structural analysis...\n');
    
    const analyzer = new WhiteBoxAnalyzer();
    await analyzer.analyzeRouteFiles();
    
    this.results.whiteBox = {
      totalFunctions: analyzer.results.functions.length,
      totalComplexity: analyzer.results.totalComplexity,
      averageComplexity: analyzer.results.averageComplexity,
      highComplexityCount: analyzer.results.highComplexityFunctions.length,
      functions: analyzer.results.functions,
      recommendations: analyzer.generateRecommendations()
    };
    
    console.log('\n✅ White box analysis completed');
  }

  generateCombinedReport() {
    const reportData = {
      metadata: {
        system: 'Lautan Kita E-commerce System',
        version: '1.0',
        testDate: this.results.timestamp,
        tester: 'Automated Test Suite'
      },
      blackBoxResults: this.results.blackBox,
      whiteBoxResults: this.results.whiteBox,
      overallAssessment: this.generateOverallAssessment()
    };

    // Save detailed JSON report
    const jsonFilename = `test-report-${Date.now()}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    this.generateHTMLReport(reportData);
    
    console.log(`📄 Detailed report saved: ${jsonFilename}`);
    console.log(`🌐 HTML report saved: test-report.html`);
  }

  generateOverallAssessment() {
    const blackBoxScore = this.results.blackBox.passRate;
    const whiteBoxScore = this.calculateWhiteBoxScore();
    const overallScore = Math.round((blackBoxScore + whiteBoxScore) / 2);
    
    let quality = 'Poor';
    let recommendation = 'Major refactoring required';
    
    if (overallScore >= 90) {
      quality = 'Excellent';
      recommendation = 'Ready for production';
    } else if (overallScore >= 80) {
      quality = 'Good';
      recommendation = 'Minor improvements needed';
    } else if (overallScore >= 70) {
      quality = 'Fair';
      recommendation = 'Moderate improvements needed';
    } else if (overallScore >= 60) {
      quality = 'Poor';
      recommendation = 'Significant improvements required';
    }

    return {
      overallScore,
      quality,
      recommendation,
      blackBoxScore,
      whiteBoxScore,
      criticalIssues: this.identifyCriticalIssues()
    };
  }

  calculateWhiteBoxScore() {
    const avgComplexity = this.results.whiteBox.averageComplexity;
    const highComplexityRatio = this.results.whiteBox.highComplexityCount / this.results.whiteBox.totalFunctions;
    
    let score = 100;
    
    // Penalize high average complexity
    if (avgComplexity > 6) score -= (avgComplexity - 6) * 10;
    if (avgComplexity > 8) score -= (avgComplexity - 8) * 15;
    
    // Penalize high complexity functions
    score -= highComplexityRatio * 30;
    
    return Math.max(0, Math.round(score));
  }

  identifyCriticalIssues() {
    const issues = [];
    
    // Black box critical issues
    if (this.results.blackBox.passRate < 95) {
      issues.push({
        type: 'Functional',
        severity: 'High',
        description: `${this.results.blackBox.failed} functional tests failed`,
        impact: 'System reliability compromised'
      });
    }
    
    // White box critical issues
    if (this.results.whiteBox.averageComplexity > 8) {
      issues.push({
        type: 'Structural',
        severity: 'High',
        description: `Average complexity (${this.results.whiteBox.averageComplexity.toFixed(2)}) exceeds recommended threshold`,
        impact: 'Code maintainability at risk'
      });
    }
    
    if (this.results.whiteBox.highComplexityCount > 0) {
      issues.push({
        type: 'Structural',
        severity: 'Medium',
        description: `${this.results.whiteBox.highComplexityCount} functions have high complexity`,
        impact: 'Increased bug risk and maintenance cost'
      });
    }
    
    return issues;
  }

  generateHTMLReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lautan Kita - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #0077B6; padding-bottom: 20px; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: #0077B6; }
        .quality { font-size: 24px; margin: 10px 0; }
        .section { margin: 30px 0; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #0077B6; }
        .metric-label { font-size: 14px; color: #666; }
        .pass { color: #10B981; }
        .fail { color: #EF4444; }
        .warning { color: #F59E0B; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .issue { padding: 15px; margin: 10px 0; border-left: 4px solid #EF4444; background: #FEF2F2; }
        .recommendation { padding: 15px; margin: 10px 0; border-left: 4px solid #10B981; background: #F0FDF4; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 Lautan Kita - Test Report</h1>
            <div class="score">${data.overallAssessment.overallScore}%</div>
            <div class="quality ${data.overallAssessment.quality.toLowerCase()}">${data.overallAssessment.quality} Quality</div>
            <p>Generated on: ${new Date(data.metadata.testDate).toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>📊 Overall Metrics</h2>
            <div class="metric">
                <div class="metric-value pass">${data.blackBoxResults.passRate}%</div>
                <div class="metric-label">Functional Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value ${data.overallAssessment.whiteBoxScore >= 80 ? 'pass' : 'warning'}">${data.overallAssessment.whiteBoxScore}%</div>
                <div class="metric-label">Code Quality</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.whiteBoxResults.averageComplexity.toFixed(1)}</div>
                <div class="metric-label">Avg Complexity</div>
            </div>
        </div>

        <div class="section">
            <h2>🔲 Black Box Testing Results</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Total Tests</td>
                    <td>${data.blackBoxResults.total}</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Passed</td>
                    <td>${data.blackBoxResults.passed}</td>
                    <td class="pass">✅</td>
                </tr>
                <tr>
                    <td>Failed</td>
                    <td>${data.blackBoxResults.failed}</td>
                    <td class="${data.blackBoxResults.failed === 0 ? 'pass' : 'fail'}">${data.blackBoxResults.failed === 0 ? '✅' : '❌'}</td>
                </tr>
                <tr>
                    <td>Pass Rate</td>
                    <td>${data.blackBoxResults.passRate}%</td>
                    <td class="${data.blackBoxResults.passRate >= 95 ? 'pass' : 'warning'}">${data.blackBoxResults.passRate >= 95 ? '✅' : '⚠️'}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>⚪ White Box Analysis Results</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Functions Analyzed</td>
                    <td>${data.whiteBoxResults.totalFunctions}</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Average Complexity</td>
                    <td>${data.whiteBoxResults.averageComplexity.toFixed(2)}</td>
                    <td class="${data.whiteBoxResults.averageComplexity <= 6 ? 'pass' : 'warning'}">${data.whiteBoxResults.averageComplexity <= 6 ? '✅' : '⚠️'}</td>
                </tr>
                <tr>
                    <td>High Complexity Functions</td>
                    <td>${data.whiteBoxResults.highComplexityCount}</td>
                    <td class="${data.whiteBoxResults.highComplexityCount === 0 ? 'pass' : 'warning'}">${data.whiteBoxResults.highComplexityCount === 0 ? '✅' : '⚠️'}</td>
                </tr>
            </table>
        </div>

        ${data.overallAssessment.criticalIssues.length > 0 ? `
        <div class="section">
            <h2>🚨 Critical Issues</h2>
            ${data.overallAssessment.criticalIssues.map(issue => `
                <div class="issue">
                    <strong>${issue.type} - ${issue.severity}</strong><br>
                    ${issue.description}<br>
                    <em>Impact: ${issue.impact}</em>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendation">
                <strong>Overall Assessment:</strong> ${data.overallAssessment.recommendation}
            </div>
            ${data.whiteBoxResults.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.priority} Priority:</strong> ${rec.recommendation}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync('test-report.html', html);
  }

  generateTestSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TESTING SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL SCORE: ${this.results.blackBox.passRate}% (${this.generateOverallAssessment().quality})`);
    
    console.log(`\n🔲 BLACK BOX RESULTS:`);
    console.log(`   Tests: ${this.results.blackBox.passed}/${this.results.blackBox.total} passed (${this.results.blackBox.passRate}%)`);
    
    console.log(`\n⚪ WHITE BOX RESULTS:`);
    console.log(`   Functions: ${this.results.whiteBox.totalFunctions} analyzed`);
    console.log(`   Avg Complexity: ${this.results.whiteBox.averageComplexity.toFixed(2)}`);
    console.log(`   High Complexity: ${this.results.whiteBox.highComplexityCount} functions`);
    
    const assessment = this.generateOverallAssessment();
    console.log(`\n💡 RECOMMENDATION: ${assessment.recommendation}`);
    
    if (assessment.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES: ${assessment.criticalIssues.length} found`);
      assessment.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.description}`);
      });
    }
    
    console.log(`\n📄 Reports generated:`);
    console.log(`   - test-report.html (Open in browser)`);
    console.log(`   - test-report-${Date.now()}.json (Detailed data)`);
    
    console.log('\n✅ Complete testing suite finished!');
  }
}

// Run complete test suite if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runCompleteTestSuite().catch(console.error);
}

module.exports = MasterTestRunner;