import { NextRequest, NextResponse } from 'next/server';
import { handleChatbot } from '@/lib/agents/chatbot/handler';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentType, input } = body;

  if (!agentType || !input) {
    return NextResponse.json(
      { success: false, error: 'Missing agentType and input' },
      { status: 400 }
    );
  }

  try {
    switch (agentType) {
      case 'chatbot': {
        const result = await handleChatbot({
          message: input.message,
          language: input.language,
          clientId: request.headers.get('x-forwarded-for') || 'anonymous',
        });
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { success: false, error: `Unknown agent type: ${agentType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`Agent ${agentType} error:`, error);
    return NextResponse.json(
      { success: false, error: 'Agent execution failed' },
      { status: 500 }
    );
  }
}
