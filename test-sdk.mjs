import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  console.log('Creating ZAI instance...');
  const zai = await ZAI.create();
  console.log('ZAI created successfully');
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in one word' }
    ],
    thinking: { type: 'disabled' }
  });
  
  console.log('Response:', completion.choices[0]?.message?.content);
}

test().catch(console.error);
