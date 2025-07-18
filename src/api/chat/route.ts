import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Mock OpenAI response since we don't have a real API key
    const mockResponse = `This is a mock AI response for your research request. In a real implementation, this would be connected to an actual AI service like OpenAI, Anthropic, or your custom AI agents.

Your request: "${messages[messages.length - 1]?.content || 'No message'}"

This would typically generate a detailed research paper or analysis based on your prompt. The response would include:

• Comprehensive research findings
• Data analysis and insights
• Relevant citations and sources
• Actionable recommendations

For a production application, you would:
1. Add your OpenAI API key to environment variables
2. Configure the model and parameters
3. Implement proper error handling
4. Add rate limiting and authentication`;

    // Create a readable stream to simulate streaming
    const stream = new ReadableStream({
      start(controller) {
        const words = mockResponse.split(' ');
        let index = 0;
        
        const interval = setInterval(() => {
          if (index < words.length) {
            controller.enqueue(new TextEncoder().encode(words[index] + ' '));
            index++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 50);
      },
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}