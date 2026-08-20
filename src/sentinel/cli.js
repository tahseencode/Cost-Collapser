#!/usr/bin/env node
import { adapterEngine } from '../adapters/adapterEngine.js';
import { AdapterCompiler } from '../adapters/compiler.js';
import { wakeUpEngine } from '../agent/wakeUpEngine.js';
import { approvalGate } from '../agent/approvalGate.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'check': {
      let adapterId = 'apex-industrial';
      const adapterIdx = args.indexOf('--adapter');
      if (adapterIdx !== -1 && args[adapterIdx + 1]) {
        adapterId = args[adapterIdx + 1];
      }
      const targetIdx = args.indexOf('--target');
      if (targetIdx !== -1 && args[targetIdx + 1]) {
        adapterId = args[targetIdx + 1];
      }

      const result = await adapterEngine.execute(adapterId);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }

    case 'compile': {
      const adapterId = args[1] || 'apex-industrial';
      const adapter = adapterEngine.getAdapter(adapterId);
      if (!adapter) {
        console.error(`Adapter "${adapterId}" not found.`);
        process.exit(1);
      }
      const script = AdapterCompiler.compileToScript(adapter);
      console.log(script);
      break;
    }

    case 'list': {
      const adapters = adapterEngine.getAllAdapters();
      console.log(JSON.stringify(adapters, null, 2));
      break;
    }

    case 'wake-test': {
      console.log('⚡ Triggering Agentic Wake-Up Test...');
      const sampleTrigger = {
        item: 'Apex Titan Carbide Drill Bit 5000',
        price: 39.99,
        initialPrice: 129.99,
        threshold: 50.00,
        vendor: 'Apex Industrial Supply Corp',
        sku: 'APX-TCB-5000',
        inStock: true,
        adapterId: 'apex-industrial'
      };
      const wakeEvent = await wakeUpEngine.awakenAgent(sampleTrigger);
      const gate = await approvalGate.createGate(wakeEvent);
      console.log('\n🧠 Agent Reasoning & Executive Briefing:\n', JSON.stringify(wakeEvent, null, 2));
      console.log('\n🔒 Human Approval Gate Created:\n', JSON.stringify(gate, null, 2));
      break;
    }

    case 'help':
    default: {
      console.log(`
Zero-Token Sentinel CLI (webcmd-compatible deterministic runner)
Usage:
  node src/sentinel/cli.js check [--adapter <id>]   Execute 0-token deterministic inspection
  node src/sentinel/cli.js compile <id>             Compile adapter into standalone JS script
  node src/sentinel/cli.js list                     List configured site adapters
  node src/sentinel/cli.js wake-test                Test agentic wake-up & approval gate
      `);
      break;
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
