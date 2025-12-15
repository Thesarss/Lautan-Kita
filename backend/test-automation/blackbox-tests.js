// Automated Black Box Testing Suite for Lautan Kita System
const axios = require('axios');

const API_BASE = 'http://localhost:4000';
let authTokens = {};

class BlackBoxTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testId, description, testFunction) {
    this.results.total++;
    console.log(`\n🧪 Running ${testId}: ${description}`);
    
    try {
      const result = await testFunction();
      if (result.success) {
        this.results.passed++;
        console.log(`✅ PASS: ${testId}`);
        this.results.tests.push({
          id: testId,
          description,
          status: 'PASS',
          message: result.message || 'Test passed'
        });
      } else {
        this.results.failed++;
        console.log(`❌ FAIL: ${testId} - ${result.message}`);
        this.results.tests.push({
          id: testId,
          description,
          status: 'FAIL',
          message: result.message
        });
      }
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ERROR: ${testId} - ${error.message}`);
      this.results.tests.push({
        id: testId,
        description,
        status: 'ERROR',
        message: error.message
      });
    }
  }

  // Authentication Tests
  async testAuth001() {
    return this.runTest('AUTH-001', 'User Registration Valid', async () => {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        nama: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'pembeli'
      });
      
      if (response.status === 200 && response.data.token) {
        authTokens.pembeli = response.data.token;
        return { success: true, message: 'Registration successful' };
      }
      return { success: false, message: 'Registration failed' };
    });
  }

  async testAuth002() {
    return this.runTest('AUTH-002', 'Invalid Email Registration', async () => {
      try {
        await axios.post(`${API_BASE}/auth/register`, {
          nama: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          role: 'pembeli'
        });
        return { success: false, message: 'Should have failed validation' };
      } catch (error) {
        if (error.response?.status === 422) {
          return { success: true, message: 'Validation error correctly returned' };
        }
        return { success: false, message: 'Unexpected error' };
      }
    });
  }

  async testAuth003() {
    return this.runTest('AUTH-003', 'Duplicate Email Registration', async () => {
      const email = 'duplicate@example.com';
      
      // First registration
      await axios.post(`${API_BASE}/auth/register`, {
        nama: 'First User',
        email,
        password: 'password123',
        role: 'pembeli'
      });
      
      // Second registration with same email
      try {
        await axios.post(`${API_BASE}/auth/register`, {
          nama: 'Second User',
          email,
          password: 'password456',
          role: 'penjual'
        });
        return { success: false, message: 'Should have failed with duplicate email' };
      } catch (error) {
        if (error.response?.status === 409 && error.response?.data?.error === 'email_exists') {
          return { success: true, message: 'Duplicate email correctly rejected' };
        }
        return { success: false, message: 'Unexpected error response' };
      }
    });
  }

  async testAuth004() {
    return this.runTest('AUTH-004', 'Valid Login', async () => {
      const email = `login${Date.now()}@example.com`;
      const password = 'password123';
      
      // Register first
      await axios.post(`${API_BASE}/auth/register`, {
        nama: 'Login Test User',
        email,
        password,
        role: 'penjual'
      });
      
      // Then login
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });
      
      if (response.status === 200 && response.data.token) {
        authTokens.penjual = response.data.token;
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: 'Login failed' };
    });
  }

  async testAuth005() {
    return this.runTest('AUTH-005', 'Invalid Login Credentials', async () => {
      try {
        await axios.post(`${API_BASE}/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
        return { success: false, message: 'Should have failed with invalid credentials' };
      } catch (error) {
        if (error.response?.status === 401 && error.response?.data?.error === 'invalid_credentials') {
          return { success: true, message: 'Invalid credentials correctly rejected' };
        }
        return { success: false, message: 'Unexpected error response' };
      }
    });
  }

  // Product Tests
  async testProd001() {
    return this.runTest('PROD-001', 'Create Product Valid', async () => {
      const response = await axios.post(`${API_BASE}/penjual/produk`, {
        nama_produk: 'Test Ikan Tuna',
        harga: 50000,
        stok: 10,
        kategori: 'ikan',
        deskripsi: 'Ikan tuna segar untuk testing'
      }, {
        headers: { Authorization: `Bearer ${authTokens.penjual}` }
      });
      
      if (response.status === 201 && response.data.produk_id) {
        return { success: true, message: 'Product created successfully' };
      }
      return { success: false, message: 'Product creation failed' };
    });
  }

  async testProd002() {
    return this.runTest('PROD-002', 'Create Product Invalid Price', async () => {
      try {
        await axios.post(`${API_BASE}/penjual/produk`, {
          nama_produk: 'Test Product',
          harga: -1000,
          stok: 10
        }, {
          headers: { Authorization: `Bearer ${authTokens.penjual}` }
        });
        return { success: false, message: 'Should have failed with negative price' };
      } catch (error) {
        if (error.response?.status === 422) {
          return { success: true, message: 'Negative price correctly rejected' };
        }
        return { success: false, message: 'Unexpected error response' };
      }
    });
  }

  async testProd003() {
    return this.runTest('PROD-003', 'Get Public Products', async () => {
      const response = await axios.get(`${API_BASE}/products`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        return { success: true, message: 'Products retrieved successfully' };
      }
      return { success: false, message: 'Failed to retrieve products' };
    });
  }

  // Order Tests
  async testOrd001() {
    return this.runTest('ORD-001', 'Checkout Empty Cart', async () => {
      try {
        await axios.post(`${API_BASE}/orders/checkout`, {
          alamat_kirim: 'Test Address'
        }, {
          headers: { Authorization: `Bearer ${authTokens.pembeli}` }
        });
        return { success: false, message: 'Should have failed with empty cart' };
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error === 'cart_empty') {
          return { success: true, message: 'Empty cart correctly rejected' };
        }
        return { success: false, message: 'Unexpected error response' };
      }
    });
  }

  // Rating Tests
  async testRat001() {
    return this.runTest('RAT-001', 'Get Rateable Orders', async () => {
      const response = await axios.get(`${API_BASE}/ratings/rateable-orders`, {
        headers: { Authorization: `Bearer ${authTokens.pembeli}` }
      });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        return { success: true, message: 'Rateable orders retrieved successfully' };
      }
      return { success: false, message: 'Failed to retrieve rateable orders' };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Black Box Testing Suite for Lautan Kita\n');
    console.log('=' .repeat(60));
    
    // Authentication Tests
    console.log('\n📋 AUTHENTICATION TESTS');
    console.log('-'.repeat(30));
    await this.testAuth001();
    await this.testAuth002();
    await this.testAuth003();
    await this.testAuth004();
    await this.testAuth005();
    
    // Product Tests
    console.log('\n📦 PRODUCT TESTS');
    console.log('-'.repeat(30));
    await this.testProd001();
    await this.testProd002();
    await this.testProd003();
    
    // Order Tests
    console.log('\n🛒 ORDER TESTS');
    console.log('-'.repeat(30));
    await this.testOrd001();
    
    // Rating Tests
    console.log('\n⭐ RATING TESTS');
    console.log('-'.repeat(30));
    await this.testRat001();
    
    // Print Results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLACK BOX TESTING RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} (${Math.round(this.results.passed/this.results.total*100)}%)`);
    console.log(`Failed: ${this.results.failed} (${Math.round(this.results.failed/this.results.total*100)}%)`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(t => t.status !== 'PASS')
        .forEach(test => {
          console.log(`  - ${test.id}: ${test.message}`);
        });
    }
    
    console.log('\n✅ Test suite completed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new BlackBoxTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BlackBoxTester;