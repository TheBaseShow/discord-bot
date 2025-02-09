const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

class AnthropicChat {
    constructor(options) {
        const { tools, systemPrompt } = options ?? {};
        this.tools = tools;
        this.systemPrompt = systemPrompt;
        this.messages = [];
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        this.model = 'claude-3-5-sonnet-20241022';
    }

    async ask(content) {
        this.messages.push({
            role: 'user',
            content: typeof content === 'string' ? content : [content],
        });
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                tools: this.tools.map(t => t.details),
                system: this.systemPrompt,
                messages: this.messages,
            })
        }).then(res => res.json());
        if (response.type === 'error') {
            console.dir(this.messages[this.messages.length - 1], { depth: null });
            throw new Error(`${response.error.type}: ${response.error.message}`);
        }
        this.messages.push({
            role: 'assistant',
            content: response.content,
        });
        if (response.stop_reason === 'tool_use') {
            const toolUseMessage = response.content.find(c => c.type === 'tool_use');
            if (!toolUseMessage) {
                console.error(response);
                throw new Error('Could not find tool use message');
            }
            const tool = this.tools.find(t => t.details.name === toolUseMessage.name);
            if (!tool) {
                console.error(response);
                throw new Error(`Agent requested unknown tool ${toolUseMessage.name}`);
            }
            const toolResult = await tool.func(toolUseMessage.input);
            const nextMessage = {
                type: 'tool_result',
                tool_use_id: toolUseMessage.id,
                content: [{
                    type: tool.returnType,
                    text: toolResult,
                }],
            };
            return this.ask(nextMessage);
        }
        return response;
    }
}

module.exports = AnthropicChat;