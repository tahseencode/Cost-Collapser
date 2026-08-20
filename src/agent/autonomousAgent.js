import { adapterEngine } from '../adapters/adapterEngine.js';
import { AdapterCompiler } from '../adapters/compiler.js';
import { sentinelMonitor } from '../sentinel/monitor.js';
import { approvalGate } from './approvalGate.js';
import { wakeUpEngine } from './wakeUpEngine.js';
import * as cheerio from 'cheerio';

/**
 * Autonomous AI Agent Engine (Sentinel-Prime)
 */
export class AutonomousAgent {
  constructor() {
    this.name = 'Sentinel-Prime (Autonomous Cost-Collapsing Agent)';
    this.history = [];
    this.tools = [
      {
        name: 'explore_page',
        description: 'Navigate to target URL, inspect DOM tree, and identify price/stock elements (Layer 0 exploration)',
        parameters: { url: 'string' }
      },
      {
        name: 'compile_zero_token_adapter',
        description: 'Compile mapped selector into a deterministic 0-token Layer 2 CLI adapter',
        parameters: { id: 'string', name: 'string', url: 'string', priceSelector: 'string', titleSelector: 'string', threshold: 'number' }
      },
      {
        name: 'start_sentinel_monitor',
        description: 'Deploy 0-token deterministic monitoring loop for an adapter',
        parameters: { adapterId: 'string', intervalSec: 'number' }
      },
      {
        name: 'evaluate_procurement_deal',
        description: 'Wake up AI reasoning engine to analyze discount margins, lot ROI, and formulate purchase recommendation',
        parameters: { currentPrice: 'number', baselinePrice: 'number', itemName: 'string', threshold: 'number' }
      },
      {
        name: 'request_human_approval',
        description: 'Submit an action to the Human-in-the-Loop gate before executing purchase order',
        parameters: { wakeUpId: 'string', actionSummary: 'string', suggestedQty: 'number' }
      },
      {
        name: 'execute_approved_order',
        description: 'Dispatch ERP purchase order after receiving explicit human authorization',
        parameters: { gateId: 'string', operator: 'string' }
      }
    ];
  }

  async executeTool(toolName, args) {
    const startTime = performance.now();
    try {
      switch (toolName) {
        case 'explore_page': {
          const url = args.url || 'http://localhost:4100/products/titan-carbide-drill-5000';
          const res = await fetch(url, { headers: { 'User-Agent': 'ZeroTokenSentinel-Agent/1.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach ${url}`);
          const html = await res.text();
          const $ = cheerio.load(html);

          const titleText = $('#product-title, h1, .product-name').first().text().trim() || 'Apex Titan Carbide Drill Bit 5000';
          const priceText = $('#product-price, .price').first().text().trim() || '$129.99';
          const stockText = $('#stock-status, .stock').first().text().trim() || 'In Stock';

          return {
            success: true,
            url,
            discoveredMetadata: {
              title: titleText,
              titleSelector: '#product-title',
              rawPrice: priceText,
              priceSelector: '#product-price',
              stockStatus: stockText
            },
            latencyMs: Math.round(performance.now() - startTime),
            tokensBurned: 0
          };
        }

        case 'compile_zero_token_adapter': {
          const id = args.id || 'apex-industrial';
          const adapterConfig = {
            id,
            name: args.name || 'Apex Titan Carbide Bit',
            url: args.url || 'http://localhost:4100/products/titan-carbide-drill-5000',
            threshold: parseFloat(args.threshold || 50.00),
            selectors: {
              item: args.titleSelector || '#product-title',
              price: args.priceSelector || '#product-price',
              currency: '#currency-symbol',
              inStock: '#stock-status',
              sku: '#product-sku',
              vendor: '#vendor-name'
            }
          };

          const registered = adapterEngine.registerAdapter(adapterConfig);
          const standaloneScript = AdapterCompiler.compileToScript(registered);

          return {
            success: true,
            adapterId: id,
            threshold: adapterConfig.threshold,
            scriptPreview: standaloneScript.split('\n').slice(0, 6).join('\n'),
            message: `Compiled adapter "${id}" to Layer 2 Zero-Token CLI! Polling cost is now $0.00.`
          };
        }

        case 'start_sentinel_monitor': {
          const adapterId = args.adapterId || 'apex-industrial';
          const interval = parseInt(args.intervalSec || 5, 10);
          sentinelMonitor.start(adapterId, interval);
          return {
            success: true,
            activeAdapterId: adapterId,
            intervalSec: interval,
            status: 'MONITORING_ACTIVE',
            message: `Sentinel daemon launched. Polling "${adapterId}" every ${interval}s with 0 tokens.`
          };
        }

        case 'evaluate_procurement_deal': {
          const currentPrice = parseFloat(args.currentPrice || 39.99);
          const baselinePrice = parseFloat(args.baselinePrice || 129.99);
          const threshold = parseFloat(args.threshold || 50.00);
          const itemName = args.itemName || 'Apex Titan Carbide Drill Bit 5000';

          const wakeEvent = await wakeUpEngine.awakenAgent({
            item: itemName,
            price: currentPrice,
            initialPrice: baselinePrice,
            threshold: threshold,
            vendor: 'Apex Industrial Supply Corp',
            sku: 'APX-TCB-5000',
            inStock: true,
            adapterId: 'apex-industrial'
          });

          return {
            success: true,
            wakeUpEvent: wakeEvent,
            message: `AI Agent awakened! Evaluated ${itemName} at $${currentPrice}. Recommendation: ${wakeEvent.analysis.recommendation}.`
          };
        }

        case 'request_human_approval': {
          let wakeEvent = await wakeUpEngine.awakenAgent({
            item: args.actionSummary || 'Apex Titan Carbide Drill Bit 5000',
            price: 39.99,
            initialPrice: 129.99,
            threshold: 50.00,
            vendor: 'Apex Industrial Supply Corp',
            sku: 'APX-TCB-5000',
            inStock: true,
            adapterId: 'apex-industrial'
          });

          const gate = await approvalGate.createGate(wakeEvent);
          return {
            success: true,
            gateId: gate.gateId,
            status: 'PENDING_HUMAN_APPROVAL',
            message: `Human Approval Gate ${gate.gateId} created. Halting sensitive execution until authorized.`
          };
        }

        case 'execute_approved_order': {
          const gateId = args.gateId;
          const operator = args.operator || 'Human Chief Procurement Officer';
          const approved = await approvalGate.approveGate(gateId, operator, 'Authorized via AI Agent Copilot');
          return {
            success: true,
            result: approved,
            poNumber: approved.executionResult.poNumber,
            totalAmount: approved.executionResult.totalAmount,
            message: `Purchase Order ${approved.executionResult.poNumber} executed and audited!`
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (err) {
      return { success: false, error: err.message, toolName };
    }
  }

  async chat(userPrompt) {
    const startMs = performance.now();
    const prompt = userPrompt.toLowerCase();
    const thoughts = [];
    const toolExecutions = [];

    if (prompt.includes('explore') || prompt.includes('find price') || prompt.includes('inspect') || prompt.includes('map')) {
      thoughts.push('Analyzing target URL structure using webcmd Layer 0 live DOM exploration...');
      const exploreRes = await this.executeTool('explore_page', { url: 'http://localhost:4100/products/titan-carbide-drill-5000' });
      toolExecutions.push({ tool: 'explore_page', result: exploreRes });
      thoughts.push(`Discovered: "${exploreRes.discoveredMetadata.title}" with price "${exploreRes.discoveredMetadata.rawPrice}" located at selector "${exploreRes.discoveredMetadata.priceSelector}".`);

      const response = {
        agentName: this.name,
        thoughts,
        toolExecutions,
        responseMessage: `I explored the target site and extracted **${exploreRes.discoveredMetadata.title}** at **${exploreRes.discoveredMetadata.rawPrice}** (Selector: \`${exploreRes.discoveredMetadata.priceSelector}\`). I can now compile this path into a reusable Layer 2 zero-token adapter so subsequent checks consume **0 LLM reasoning tokens**.`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 145
      };
      this.history.push({ prompt: userPrompt, response });
      return response;

    } else if (prompt.includes('compile') || prompt.includes('adapter') || prompt.includes('zero-token') || prompt.includes('0 token')) {
      thoughts.push('Compiling discovered DOM path into a deterministic 0-token Layer 2 CLI adapter...');
      const compileRes = await this.executeTool('compile_zero_token_adapter', {
        id: 'apex-industrial',
        name: 'Apex Titan Carbide Bit 5000',
        url: 'http://localhost:4100/products/titan-carbide-drill-5000',
        priceSelector: '#product-price',
        titleSelector: '#product-title',
        threshold: 50.00
      });
      toolExecutions.push({ tool: 'compile_zero_token_adapter', result: compileRes });

      const response = {
        agentName: this.name,
        thoughts,
        toolExecutions,
        responseMessage: `⚙️ **Adapter Compiled Successfully!** Created \`apex-industrial\` targeting **$50.00** threshold. Running this adapter executes purely deterministically with **0 LLM tokens ($0.00)**.`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 130
      };
      this.history.push({ prompt: userPrompt, response });
      return response;

    } else if (prompt.includes('monitor') || prompt.includes('start') || prompt.includes('sentinel') || prompt.includes('watch')) {
      thoughts.push('Initiating continuous Zero-Token Sentinel monitoring loop...');
      const monitorRes = await this.executeTool('start_sentinel_monitor', { adapterId: 'apex-industrial', intervalSec: 5 });
      toolExecutions.push({ tool: 'start_sentinel_monitor', result: monitorRes });

      const response = {
        agentName: this.name,
        thoughts,
        toolExecutions,
        responseMessage: `🛡️ **Zero-Token Sentinel is active!** Monitoring **Apex Titan Carbide Drill Bit 5000** every 5 seconds. Polling burn is strictly **0 TOKENS ($0.00)**. I will awaken automatically when the price drops below **$50.00**.`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 110
      };
      this.history.push({ prompt: userPrompt, response });
      return response;

    } else if (prompt.includes('drop') || prompt.includes('simulate') || prompt.includes('flash') || prompt.includes('deal') || prompt.includes('wake')) {
      thoughts.push('Simulating flash price crash to $39.99 (below $50 threshold)...');
      await fetch('http://localhost:3000/api/demo/trigger-drop', { method: 'POST' }).catch(() => {});

      thoughts.push('Zero-Token Sentinel triggered! Awakening AI reasoning engine...');
      const evalRes = await this.executeTool('evaluate_procurement_deal', {
        currentPrice: 39.99,
        baselinePrice: 129.99,
        threshold: 50.00,
        itemName: 'Apex Titan Carbide Drill Bit 5000 (Industrial Grade)'
      });
      toolExecutions.push({ tool: 'evaluate_procurement_deal', result: evalRes });

      const gateRes = await this.executeTool('request_human_approval', {
        wakeUpId: evalRes.wakeUpEvent.wakeUpId,
        actionSummary: 'Apex Titan Carbide Drill Bit 5000',
        suggestedQty: 25
      });
      toolExecutions.push({ tool: 'request_human_approval', result: gateRes });

      const response = {
        agentName: this.name,
        thoughts,
        toolExecutions,
        responseMessage: `🚨 **Agentic Wake-Up Triggered!** Price dropped from **$129.99** to **$39.99** (-69% discount). My recommendation is **STRONG_BUY** (Batch 25 savings: **$2,250.00**). I have created Human Approval Gate **\`${gateRes.gateId}\`**. Awaiting your authorization before placing the Purchase Order.`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 380
      };
      this.history.push({ prompt: userPrompt, response });
      return response;

    } else if (prompt.includes('approve') || prompt.includes('buy') || prompt.includes('authorize') || prompt.includes('order')) {
      const pendingGates = approvalGate.getPendingGates();
      if (pendingGates.length === 0) {
        return {
          agentName: this.name,
          thoughts: ['Checking for pending human approval gates...'],
          toolExecutions: [],
          responseMessage: 'There are currently no pending approval gates. Simulate a price drop first to generate a purchase decision request.',
          latencyMs: Math.round(performance.now() - startMs),
          tokensUsed: 65
        };
      }

      const targetGate = pendingGates[0];
      const execRes = await this.executeTool('execute_approved_order', {
        gateId: targetGate.gateId,
        operator: 'Human Chief Procurement Officer'
      });
      toolExecutions.push({ tool: 'execute_approved_order', result: execRes });

      const response = {
        agentName: this.name,
        thoughts,
        toolExecutions,
        responseMessage: `✅ **Purchase Order Transmitted!** Successfully issued **${execRes.poNumber}** for **${targetGate.data.analysis.suggestedOrderQty || 25} units ($${execRes.totalAmount})**. Recorded in the immutable audit log. Sentinel has resumed idle 0-token monitoring.`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 120
      };
      this.history.push({ prompt: userPrompt, response });
      return response;

    } else {
      const response = {
        agentName: this.name,
        thoughts: ['Processing user inquiry...'],
        toolExecutions: [],
        responseMessage: `Hello! I am **${this.name}**. I am an autonomous browser AI agent designed to collapse your web monitoring and procurement token costs to **$0.00** using deterministic webcmd Layer 2 adapters.\n\nYou can ask me to:\n- 🔍 **"Explore http://localhost:4100 and extract drill bit prices"**\n- ⚙️ **"Compile a 0-token adapter for Titan Carbide Drill Bit with $50 threshold"**\n- 🛡️ **"Start 0-token sentinel monitoring"**\n- 🚨 **"Simulate a flash price drop deal"**\n- ✅ **"Authorize and issue the purchase order"**`,
        latencyMs: Math.round(performance.now() - startMs),
        tokensUsed: 85
      };
      this.history.push({ prompt: userPrompt, response });
      return response;
    }
  }
}

export const autonomousAgent = new AutonomousAgent();
