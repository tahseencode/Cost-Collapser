import { adapterEngine } from '../src/adapters/adapterEngine.js';
import { AdapterCompiler } from '../src/adapters/compiler.js';
import { costCalculator } from '../src/sentinel/costCalculator.js';
import { wakeUpEngine } from '../src/agent/wakeUpEngine.js';
import { approvalGate } from '../src/agent/approvalGate.js';
import { createMockStoreServer } from '../src/mock-store/server.js';
import { CONFIG } from '../src/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting Zero-Token Sentinel Test Suite...\n');

  // Start mock store server locally for testing
  const storeApp = createMockStoreServer();
  const server = storeApp.listen(CONFIG.MOCK_STORE_PORT);

  try {
    // Test 1: Adapter Extraction (0 Tokens)
    console.log('Test 1: Layer 2 Deterministic Adapter Extraction');
    const checkResult = await adapterEngine.execute('apex-industrial');
    assert(checkResult.success === true, 'Adapter executes successfully');
    assert(checkResult.tokensConsumed === 0, 'Zero tokens consumed for check (0 tokens)');
    assert(typeof checkResult.price === 'number' && checkResult.price > 0, 'Price parsed correctly as number');
    assert(checkResult.inStock === true, 'In-stock status parsed correctly');

    // Test 2: Adapter Compiler
    console.log('\nTest 2: Adapter Compiler (Layer 0 -> Layer 2 Compilation)');
    const adapter = adapterEngine.getAdapter('apex-industrial');
    const compiledCode = AdapterCompiler.compileToScript(adapter);
    assert(typeof compiledCode === 'string' && compiledCode.includes('ZeroTokenSentinel-Compiled'), 'Compiler generated valid standalone script');

    // Test 3: Cost Calculator & Cost Collapse Formula
    console.log('\nTest 3: Cost Collapse Calculation Metrics');
    costCalculator.reset();
    costCalculator.recordCheck();
    costCalculator.recordCheck();
    costCalculator.recordCheck();
    const metrics = costCalculator.getMetrics();
    assert(metrics.totalChecks === 3, 'Recorded 3 checks');
    assert(metrics.sentinel.tokensBurned === 0, 'Sentinel burned 0 tokens during polling');
    assert(metrics.traditional.tokensBurned > 0, 'Traditional agent benchmark calculated token burn');
    assert(metrics.savings.dollarsSaved >= 0, 'Savings dollars calculated');

    // Test 4: Agentic Wake-Up Engine
    console.log('\nTest 4: Agentic Wake-Up Layer');
    const simulatedDrop = {
      item: 'Apex Titan Carbide Drill Bit 5000',
      price: 39.99,
      initialPrice: 129.99,
      threshold: 50.00,
      vendor: 'Apex Industrial Supply Corp',
      sku: 'APX-TCB-5000',
      inStock: true,
      adapterId: 'apex-industrial'
    };
    const wakeEvent = await wakeUpEngine.awakenAgent(simulatedDrop);
    assert(wakeEvent.status === 'PENDING_HUMAN_APPROVAL', 'Wake-up event flagged for human approval');
    assert(wakeEvent.analysis.recommendation === 'STRONG_BUY', 'AI correctly recommended STRONG_BUY on 69% discount');
    assert(wakeEvent.tokensBurned > 0, 'Tokens recorded specifically for wake-up reasoning action');

    // Test 5: Human-in-the-Loop Approval Gate
    console.log('\nTest 5: Human-in-the-Loop Approval Gate & Purchase Order Dispatch');
    const gate = await approvalGate.createGate(wakeEvent);
    assert(gate.status === 'PENDING_HUMAN_APPROVAL', 'Gate created in pending state');
    
    const approvedGate = await approvalGate.approveGate(gate.gateId, 'Judge Admin', 'Special hackathon authorization');
    assert(approvedGate.status === 'APPROVED', 'Gate transitioned to APPROVED');
    assert(approvedGate.executionResult.action === 'PURCHASE_ORDER_ISSUED', 'Autonomous ERP action executed');
    assert(approvedGate.executionResult.poNumber.startsWith('PO-'), 'Purchase Order generated');

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    server.close();
  } catch (err) {
    console.error('Test runner fatal error:', err);
    server.close();
  }
}

runTests();


