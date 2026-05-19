import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// GET /api/version - Return current app version
export async function GET() {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    return NextResponse.json({
      version: packageJson.version,
      name: packageJson.name,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read version' },
      { status: 500 }
    );
  }
}
