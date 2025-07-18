import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful AI assistant specialized in research and DeSci applications. Provide detailed, accurate responses.',
      messages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse({
      getErrorMessage: error => {
        if (error == null) {
          return 'An unknown error occurred.';
        }
        
        if (typeof error === 'string') {
          return error;
        }
        
        if (error instanceof Error) {
          return error.message;
        }
        
        return 'An error occurred while processing your request.';
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}