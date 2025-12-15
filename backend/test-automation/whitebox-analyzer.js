// White Box Testing - Cyclomatic Complexity Analyzer
const fs = require('fs');
const path = require('path');

class WhiteBoxAnalyzer {
  constructor() {
    this.results = {
      functions: [],
      totalComplexity: 0,
      averageComplexity: 0,
      highComplexityFunctions: []
    };
  }

  // Analyze cyclomatic complexity of a function
  analyzeCyclomaticComplexity(functionCode, functionName) {
    // Count decision points (predicate nodes)
    const decisionPatterns = [
      /if\s*\(/g,           // if statements
      /else\s+if\s*\(/g,    // else if statements
      /while\s*\(/g,        // while loops
      /for\s*\(/g,          // for loops
      /switch\s*\(/g,       // switch statements
      /case\s+/g,           // case statements
      /catch\s*\(/g,        // catch blocks
      /\?\s*.*\s*:/g,       // ternary operators
      /&&/g,                // logical AND
      /\|\|/g               // logical OR
    ];

    let complexity = 1; // Base complexity
    let predicateNodes = [];

    decisionPatterns.forEach((pattern, index) => {
      const matches = functionCode.match(pattern);
      if (matches) {
        complexity += matches.length;
        predicateNodes.push({
          type: this.getPatternType(index),
          count: matches.length
        });
      }
    });

    return {
      complexity,
      predicateNodes,
      riskLevel: this.getRiskLevel(complexity)
    };
  }

  getPatternType(index) {
    const types = [
      'if', 'else if', 'while', 'for', 'switch', 
      'case', 'catch', 'ternary', 'logical AND', 'logical OR'
    ];
    return types[index] || 'unknown';
  }

  getRiskLevel(complexity) {
    if (complexity <= 4) return 'Low';
    if (complexity <= 7) return 'Medium';
    if (complexity <= 10) return 'High';
    return 'Very High';
  }

  // Extract functions from JavaScript file
  extractFunctions(fileContent, fileName) {
    const functions = [];
    
    // Regex patterns for different function types
    const patterns = [
      // Express route handlers: router.method('/path', ...)
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,[\s\S]*?(?=router\.|module\.exports|$)/g,
      // Regular function declarations: function name() {}
      /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g,
      // Arrow functions: const name = () => {}
      /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\}/g,
      // Async functions: async function name() {}
      /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g
    ];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(fileContent)) !== null) {
        const functionCode = match[0];
        let functionName;
        
        if (patternIndex === 0) {
          // Route handler
          functionName = `${match[1].toUpperCase()} ${match[2]}`;
        } else {
          // Regular function
          functionName = match[1];
        }

        const analysis = this.analyzeCyclomaticComplexity(functionCode, functionName);
        
        functions.push({
          name: functionName,
          file: fileName,
          complexity: analysis.complexity,
          riskLevel: analysis.riskLevel,
          predicateNodes: analysis.predicateNodes,
          codeLength: functionCode.length,
          lineCount: functionCode.split('\n').length
        });
      }
    });

    return functions;
  }

  // Analyze all route files
  async analyzeRouteFiles() {
    const routesDir = path.join(__dirname, '..', 'src', 'routes');
    const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

    console.log('🔍 Analyzing Route Files for Cyclomatic Complexity\n');
    console.log('='.repeat(70));

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n📁 Analyzing: ${file}`);
      console.log('-'.repeat(50));
      
      const functions = this.extractFunctions(fileContent, file);
      
      functions.forEach(func => {
        console.log(`Function: ${func.name}`);
        console.log(`  Complexity: ${func.complexity} (${func.riskLevel} Risk)`);
        console.log(`  Lines: ${func.lineCount}`);
        console.log(`  Predicate Nodes: ${func.predicateNodes.length}`);
        
        if (func.predicateNodes.length > 0) {
          func.predicateNodes.forEach(node => {
            console.log(`    - ${node.type}: ${node.count}`);
          });
        }
        console.log('');
        
        this.results.functions.push(func);
        this.results.totalComplexity += func.complexity;
        
        if (func.complexity > 7) {
          this.results.highComplexityFunctions.push(func);
        }
      });
    }

    this.results.averageComplexity = this.results.totalComplexity / this.results.functions.length;
    this.generateReport();
  }

  // Generate detailed flow graph for specific function
  generateFlowGraph(functionName) {
    const func = this.results.functions.find(f => f.name === functionName);
    if (!func) {
      console.log(`Function ${functionName} not found`);
      return;
    }

    console.log(`\n📊 Flow Graph for: ${functionName}`);
    console.log('='.repeat(50));
    console.log('Nodes and Edges:');
    
    // Simplified flow graph representation
    let nodeCount = 1;
    console.log(`[${nodeCount++}] Start`);
    
    func.predicateNodes.forEach(node => {
      console.log(`[${nodeCount++}] ${node.type} (Decision Point)`);
      if (node.count > 1) {
        for (let i = 1; i < node.count; i++) {
          console.log(`[${nodeCount++}] ${node.type} ${i + 1}`);
        }
      }
    });
    
    console.log(`[${nodeCount++}] Process`);
    console.log(`[${nodeCount++}] End`);
    
    console.log(`\nComplexity Calculation:`);
    console.log(`V(G) = Decision Points + 1`);
    console.log(`V(G) = ${func.predicateNodes.reduce((sum, node) => sum + node.count, 0)} + 1 = ${func.complexity}`);
    
    // Generate independent paths
    console.log(`\nIndependent Paths (${func.complexity} paths needed):`);
    for (let i = 1; i <= func.complexity; i++) {
      console.log(`Path ${i}: [Simplified path representation]`);
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 WHITE BOX ANALYSIS REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n📈 SUMMARY STATISTICS:`);
    console.log(`Total Functions Analyzed: ${this.results.functions.length}`);
    console.log(`Total Complexity: ${this.results.totalComplexity}`);
    console.log(`Average Complexity: ${this.results.averageComplexity.toFixed(2)}`);
    console.log(`High Complexity Functions: ${this.results.highComplexityFunctions.length}`);
    
    // Complexity distribution
    const distribution = {
      low: this.results.functions.filter(f => f.complexity <= 4).length,
      medium: this.results.functions.filter(f => f.complexity >= 5 && f.complexity <= 7).length,
      high: this.results.functions.filter(f => f.complexity >= 8 && f.complexity <= 10).length,
      veryHigh: this.results.functions.filter(f => f.complexity > 10).length
    };
    
    console.log(`\n📊 COMPLEXITY DISTRIBUTION:`);
    console.log(`Low Risk (1-4): ${distribution.low} functions`);
    console.log(`Medium Risk (5-7): ${distribution.medium} functions`);
    console.log(`High Risk (8-10): ${distribution.high} functions`);
    console.log(`Very High Risk (>10): ${distribution.veryHigh} functions`);
    
    // Top complex functions
    const topComplex = this.results.functions
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 5);
    
    console.log(`\n🔴 TOP 5 MOST COMPLEX FUNCTIONS:`);
    topComplex.forEach((func, index) => {
      console.log(`${index + 1}. ${func.name} (${func.file})`);
      console.log(`   Complexity: ${func.complexity} (${func.riskLevel} Risk)`);
      console.log(`   Lines: ${func.lineCount}`);
    });
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (this.results.highComplexityFunctions.length > 0) {
      console.log(`⚠️  ${this.results.highComplexityFunctions.length} functions need refactoring (complexity > 7)`);
      this.results.highComplexityFunctions.forEach(func => {
        console.log(`   - ${func.name}: Break down into smaller functions`);
      });
    } else {
      console.log(`✅ All functions have acceptable complexity levels`);
    }
    
    if (this.results.averageComplexity > 6) {
      console.log(`⚠️  Average complexity (${this.results.averageComplexity.toFixed(2)}) is above recommended level (≤6)`);
    } else {
      console.log(`✅ Average complexity is within acceptable range`);
    }
    
    // Generate detailed analysis for high complexity functions
    if (this.results.highComplexityFunctions.length > 0) {
      console.log(`\n🔍 DETAILED ANALYSIS OF HIGH COMPLEXITY FUNCTIONS:`);
      this.results.highComplexityFunctions.forEach(func => {
        this.generateFlowGraph(func.name);
      });
    }
  }

  // Export results to JSON
  exportResults(filename = 'whitebox-analysis-results.json') {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFunctions: this.results.functions.length,
        totalComplexity: this.results.totalComplexity,
        averageComplexity: this.results.averageComplexity,
        highComplexityCount: this.results.highComplexityFunctions.length
      },
      functions: this.results.functions,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Results exported to: ${filename}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    this.results.highComplexityFunctions.forEach(func => {
      recommendations.push({
        function: func.name,
        file: func.file,
        complexity: func.complexity,
        recommendation: `Refactor ${func.name} to reduce complexity from ${func.complexity} to ≤7`,
        priority: func.complexity > 10 ? 'High' : 'Medium'
      });
    });
    
    return recommendations;
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new WhiteBoxAnalyzer();
  analyzer.analyzeRouteFiles()
    .then(() => {
      analyzer.exportResults();
    })
    .catch(console.error);
}

module.exports = WhiteBoxAnalyzer;