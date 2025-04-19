import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import aiService from '../services/aiService';
import MaliciousRequest from '../models/MaliciousRequest';

// Process a chatbot message
export const processMessage = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { messages, ipContext } = req.body;
    
    // If an IP context is provided, fetch recent monitoring logs for that IP
    let contextData = '';
    if (ipContext) {
      // Fetch the latest 5 monitoring logs for the specified IP
      const recentLogs = await MaliciousRequest.find({
        sourceIp: ipContext,
        requestMethod: 'MONITOR'
      })
      .sort({ createdAt: -1 })
      .limit(5);
      
      if (recentLogs.length > 0) {
        contextData = await aiService.prepareMonitoringDataForChatbot(recentLogs);
      }
    }

    // Process message using Groq LLM
    const response = await processWithGroq(messages, contextData);
    
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to process messages with Groq LLM
const processWithGroq = async (messages: any[], contextData: string) => {
  try {
    const groq = new (await import('groq-sdk')).Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
    
    // Create system message with security context
    const systemMessage = {
      role: 'system',
      content: `You are a cybersecurity assistant specialized in analyzing network monitoring data and providing security advice. 
      You help security teams understand potential threats and recommend mitigation strategies.
      
      ${contextData ? 'Here is recent monitoring data you should consider when answering:' : ''}
      ${contextData || ''}
      
      Always be precise and technical in your answers. Provide actionable advice when possible.`
    };
    
    // Add system message to the beginning of messages array
    const completionMessages = [systemMessage, ...messages];
    
    const completion = await groq.chat.completions.create({
      messages: completionMessages,
      model: "llama3-70b-8192",
      temperature: 0.5,
      max_tokens: 2048,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error processing with Groq:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
};