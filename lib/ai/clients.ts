import OpenAI from 'openai';

// =====================================================
// AI Client Factory
// Supports: DeepSeek, OpenAI
// Priority: DeepSeek > OpenAI (configurable)
// =====================================================

// DeepSeek client (OpenAI-compatible API)
let deepseekClient: OpenAI | null = null;

export function getDeepSeekClient(): OpenAI | null {
  if (deepseekClient) return deepseekClient;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log('DeepSeek API key not configured');
    return null;
  }

  deepseekClient = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });

  return deepseekClient;
}

// OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('OpenAI API key not configured');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// =====================================================
// Unified AI Call Interface
// =====================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  provider?: 'deepseek' | 'openai' | 'auto';
}

export interface AICallResult {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// DeepSeek models
export const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',           // General purpose, fast
  REASONER: 'deepseek-reasoner',   // Complex reasoning (R1)
} as const;

// OpenAI models
export const OPENAI_MODELS = {
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4O: 'gpt-4o',
  GPT4_TURBO: 'gpt-4-turbo',
} as const;

/**
 * Call AI with automatic provider fallback
 * Priority: DeepSeek > OpenAI (unless specified)
 */
export async function callAI(
  messages: AIMessage[],
  options: AICallOptions = {}
): Promise<AICallResult> {
  const {
    temperature = 0.3,
    maxTokens = 4000,
    jsonMode = false,
    provider = 'auto',
  } = options;

  // Determine provider order
  const providers = provider === 'auto'
    ? ['deepseek', 'openai'] as const
    : [provider];

  let lastError: Error | null = null;

  for (const p of providers) {
    try {
      switch (p) {
        case 'deepseek': {
          const client = getDeepSeekClient();
          if (!client) continue;

          const model = options.model || DEEPSEEK_MODELS.CHAT;
          const completion = await client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(jsonMode && { response_format: { type: 'json_object' } }),
          });

          return {
            content: completion.choices[0]?.message?.content?.trim() || '',
            model,
            provider: 'deepseek',
            usage: {
              promptTokens: completion.usage?.prompt_tokens,
              completionTokens: completion.usage?.completion_tokens,
              totalTokens: completion.usage?.total_tokens,
            },
          };
        }

        case 'openai': {
          const client = getOpenAIClient();
          if (!client) continue;

          const model = options.model || OPENAI_MODELS.GPT4O_MINI;
          const completion = await client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(jsonMode && { response_format: { type: 'json_object' } }),
          });

          return {
            content: completion.choices[0]?.message?.content?.trim() || '',
            model,
            provider: 'openai',
            usage: {
              promptTokens: completion.usage?.prompt_tokens,
              completionTokens: completion.usage?.completion_tokens,
              totalTokens: completion.usage?.total_tokens,
            },
          };
        }
      }
    } catch (error: any) {
      console.error(`AI call failed with ${p}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('No AI provider available');
}

/**
 * Simple helper for text completion
 */
export async function completeText(
  prompt: string,
  systemPrompt?: string,
  options?: AICallOptions
): Promise<string> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const result = await callAI(messages, options);
  return result.content;
}

/**
 * Helper for JSON responses
 */
export async function completeJSON<T = any>(
  prompt: string,
  systemPrompt?: string,
  options?: AICallOptions
): Promise<{ data: T; model: string; provider: string }> {
  const messages: AIMessage[] = [];

  const jsonSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\nResponds ONLY with valid JSON, no markdown or explanations.`
    : 'Respond ONLY with valid JSON, no markdown or explanations.';

  messages.push({ role: 'system', content: jsonSystemPrompt });
  messages.push({ role: 'user', content: prompt });

  const result = await callAI(messages, { ...options, jsonMode: true });

  // Parse JSON from response
  let jsonContent = result.content;

  // Try to extract JSON if wrapped in markdown
  const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  } else {
    // Try to find JSON object or array
    const objectMatch = jsonContent.match(/\{[\s\S]*\}/);
    const arrayMatch = jsonContent.match(/\[[\s\S]*\]/);
    jsonContent = objectMatch?.[0] || arrayMatch?.[0] || jsonContent;
  }

  try {
    const data = JSON.parse(jsonContent) as T;
    return { data, model: result.model, provider: result.provider };
  } catch (error) {
    console.error('Failed to parse AI JSON response:', jsonContent);
    throw new Error('AI returned invalid JSON');
  }
}

/**
 * Call DeepSeek Reasoner (R1) for complex reasoning tasks
 */
export async function callDeepSeekReasoner(
  prompt: string,
  systemPrompt?: string
): Promise<AICallResult> {
  const deepseek = getDeepSeekClient();
  if (!deepseek) {
    throw new Error('DeepSeek API key not configured');
  }

  const messages: AIMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODELS.REASONER,
    messages,
    max_tokens: 8000,
  });

  return {
    content: completion.choices[0]?.message?.content?.trim() || '',
    model: DEEPSEEK_MODELS.REASONER,
    provider: 'deepseek',
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    },
  };
}
