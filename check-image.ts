import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage() {
  const zai = await ZAI.create();
  
  const imageBuffer = fs.readFileSync('/home/z/my-project/upload/pasted_image_1773772141675.png');
  const base64Image = imageBuffer.toString('base64');
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is shown in this image? Is this a design mockup or request for a golf status feature? Describe any UI elements, text, or requirements visible. Be detailed.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });
  
  console.log(response.choices[0]?.message?.content);
}

analyzeImage().catch(console.error);
