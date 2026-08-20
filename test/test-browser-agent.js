async function verifyBrowserAndAgent() {
  console.log('1. Testing Browser AI Agent Navigation & DOM Mapping:');
  const navRes = await fetch('http://localhost:3000/api/browser/navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://localhost:4100/products/titan-carbide-drill-5000' })
  });
  const navData = await navRes.json();
  console.log('   Target Page:', navData.state.pageTitle);
  console.log('   Discovered Elements Count:', navData.state.discoveredElements.length);
  for (const el of navData.state.discoveredElements) {
    console.log(`     - [${el.role}] ${el.selector} -> "${el.text}" (Confidence: ${Math.round(el.confidence * 100)}%)`);
  }

  console.log('\n2. Testing Browser Agent Zero-Token Compilation:');
  const compRes = await fetch('http://localhost:3000/api/browser/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapterId: 'apex-industrial', threshold: 50.00 })
  });
  const compData = await compRes.json();
  console.log('   Compile Status:', compData.success ? 'SUCCESS' : 'FAILED');
  console.log('   Compiled Message:', compData.message);

  console.log('\n3. Testing AI Agent Chat (Prompt: "Explore target store and extract drill bit price"):');
  const chatRes = await fetch('http://localhost:3000/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Explore the target store and extract drill bit price' })
  });
  const chatData = await chatRes.json();
  console.log('   Agent Thoughts:\n   - ' + chatData.response.thoughts.join('\n   - '));
  console.log('   Agent Response:\n   ' + chatData.response.responseMessage);
}

verifyBrowserAndAgent().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
