import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Ensure config file exists
function ensureConfig() {
  const configContent = JSON.stringify({ provider: 'default' });
  const configPaths = [
    join(process.cwd(), '.z-ai-config'),
    join(homedir(), '.z-ai-config'),
  ];
  
  for (const configPath of configPaths) {
    try {
      if (!existsSync(configPath)) {
        writeFileSync(configPath, configContent, 'utf-8');
      }
    } catch {
      // Ignore errors
    }
  }
}

// POST /api/ai-caddie - Get AI caddie recommendations
export async function POST(request: NextRequest) {
  try {
    ensureConfig();
    
    const body = await request.json();
    const { shotDistance, windSpeed, windDirection, lie } = body;

    if (shotDistance === undefined || shotDistance === null) {
      return NextResponse.json(
        { error: 'Shot distance is required' },
        { status: 400 }
      );
    }

    const distance = Number(shotDistance);
    if (isNaN(distance) || distance < 0 || distance > 600) {
      return NextResponse.json(
        { error: 'Invalid shot distance. Please enter a value between 0 and 600 meters.' },
        { status: 400 }
      );
    }

    const defaultDistances = [
      { club: 'Driver', avgDistance: 220 },
      { club: '3-wood', avgDistance: 200 },
      { club: '5-wood', avgDistance: 185 },
      { club: '3-iron', avgDistance: 175 },
      { club: '4-iron', avgDistance: 165 },
      { club: '5-iron', avgDistance: 155 },
      { club: '6-iron', avgDistance: 145 },
      { club: '7-iron', avgDistance: 135 },
      { club: '8-iron', avgDistance: 125 },
      { club: '9-iron', avgDistance: 115 },
      { club: 'PW', avgDistance: 100 },
      { club: 'GW', avgDistance: 90 },
      { club: 'SW', avgDistance: 75 },
      { club: 'LW', avgDistance: 60 },
    ];

    const zai = await ZAI.create();
    
    const prompt = `You are an expert golf caddie. Based on the following information, recommend the best club to use and provide strategic advice.

Shot Information:
- Distance to target: ${distance} meters
- Wind: ${windSpeed || 0} km/h ${windDirection || 'N/A'}
- Lie: ${lie || 'fairway'}

Player's Club Distances (in meters):
${defaultDistances.map((d) => `- ${d.club}: ${d.avgDistance}m`).join('\n')}

Provide:
1. Recommended club
2. Reasoning (consider wind, lie, and distance)
3. Strategic tips for this shot
4. Risk assessment

Keep the response concise and actionable.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert golf caddie with years of experience. Provide clear, actionable advice for golfers of all skill levels. Always consider course management and risk-reward scenarios.'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const recommendation = completion.choices[0]?.message?.content;

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Unable to generate a recommendation. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch (error: any) {
    console.error('Error getting AI caddie recommendation:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
