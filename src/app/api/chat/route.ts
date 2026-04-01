import { NextRequest, NextResponse } from 'next/server';
import { handleChatbot } from '@/lib/agents/chatbot/handler';

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const result = await handleChatbot({ message, language, clientId });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, response: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
