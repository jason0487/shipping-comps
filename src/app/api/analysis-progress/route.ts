import { NextRequest } from 'next/server';

// Store active connections
const connections = new Map<string, WritableStreamDefaultWriter>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Set up writer for this session
      const writer = controller;
      connections.set(sessionId, writer as any);
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      try {
        controller.enqueue(encoder.encode(data));
      } catch (error) {
        console.error('Error sending initial message:', error);
      }
    },
    cancel() {
      // Clean up connection
      if (sessionId) {
        connections.delete(sessionId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper function to send progress updates
export function sendProgressUpdate(sessionId: string, update: {
  stage: string;
  message: string;
  progress: number;
  completedStages: string[];
}) {
  const connection = connections.get(sessionId);
  if (connection) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({ type: 'progress', ...update })}\n\n`;
    
    try {
      (connection as any).enqueue(encoder.encode(data));
    } catch (error) {
      console.error('Error sending progress update:', error);
      // Clean up dead connection
      connections.delete(sessionId);
    }
  }
}

// Helper function to send completion
export function sendAnalysisComplete(sessionId: string, result: any) {
  const connection = connections.get(sessionId);
  if (connection) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({ type: 'complete', result })}\n\n`;
    
    try {
      (connection as any).enqueue(encoder.encode(data));
      // Close connection after completion
      (connection as any).close();
      connections.delete(sessionId);
    } catch (error) {
      console.error('Error sending completion:', error);
      connections.delete(sessionId);
    }
  }
}