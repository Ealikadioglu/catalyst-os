---
name: ai-integration
description: >
  Integrate LLM and AI services into applications. Use when adding AI-powered
  features or integrating with OpenAI/Anthropic APIs.
agent: necromancer
---

# AI Integration

Integrate LLM and AI services.

## When to Use

- Adding AI features
- LLM API integration
- AI-powered workflows

## Process

1. **Choose provider**
   - OpenAI, Anthropic, etc.
   - Model selection

2. **Design integration**
   - Input/output format
   - Prompt structure
   - Error handling

3. **Implement**
   - API client
   - Prompt templates
   - Response parsing

## Integration Pattern

```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generate(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content ?? ''
}
```

## Checklist

- [ ] API key secured
- [ ] Rate limiting handled
- [ ] Errors caught
- [ ] Costs monitored
