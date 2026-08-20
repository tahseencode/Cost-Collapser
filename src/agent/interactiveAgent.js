#!/usr/bin/env node
import readline from 'readline';
import chalk from 'chalk';
import { autonomousAgent } from './autonomousAgent.js';

console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════════════════════╗
║   🤖 SENTINEL-PRIME: AUTONOMOUS COST-COLLAPSING AI AGENT          ║
║   Webcmd Layer 0 Exploration ➔ Layer 2 Deterministic 0-Token Loop   ║
╚════════════════════════════════════════════════════════════════════╝
`));

console.log(chalk.gray(`Try prompts like:`));
console.log(chalk.yellow(`  • "Explore the target store and find drill bit prices"`));
console.log(chalk.yellow(`  • "Compile this into a 0-token adapter with $50 threshold"`));
console.log(chalk.yellow(`  • "Start 0-token sentinel monitoring"`));
console.log(chalk.yellow(`  • "Simulate flash price drop below threshold"`));
console.log(chalk.yellow(`  • "Approve the pending purchase order"`));
console.log(chalk.gray(`Type "exit" to quit.\n`));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.bold.magenta('User ➔ ')
});

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }
  if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
    console.log(chalk.cyan('Shutting down Sentinel Agent. Goodbye!'));
    process.exit(0);
  }

  console.log(chalk.blue('\n🧠 Agent is reasoning...'));
  try {
    const result = await autonomousAgent.chat(input);

    // Print thoughts
    if (result.thoughts && result.thoughts.length > 0) {
      console.log(chalk.dim('\n[Internal Agent Monologue / ReAct Trace]:'));
      for (const thought of result.thoughts) {
        console.log(chalk.italic.gray(`  💭 ${thought}`));
      }
    }

    // Print tool executions
    if (result.toolExecutions && result.toolExecutions.length > 0) {
      console.log(chalk.cyan('\n[Tool Invocations]:'));
      for (const exec of result.toolExecutions) {
        console.log(chalk.green(`  ⚡ Tool: [${exec.tool}] ➔ Success`));
      }
    }

    // Print final agent response
    console.log(chalk.bold.green('\n🤖 Sentinel-Prime:'));
    console.log(result.responseMessage);
    console.log(chalk.dim(`\n(Latency: ${result.latencyMs}ms | Reasoning Tokens: ${result.tokensUsed})\n`));

  } catch (err) {
    console.error(chalk.red('Agent Error:', err.message));
  }

  rl.prompt();
});
