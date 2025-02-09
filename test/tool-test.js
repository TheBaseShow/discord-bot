const AnthropicChat = require('../lib/anthropic');

const tools = [
    {
        details: {
            name: 'add',
            description: 'Add two numbers',
            input_schema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'integer',
                        description: 'The first number'
                    },
                    b: {
                        type: 'integer',
                        description: 'The second number'
                    }
                },
                required: ['a', 'b']
            }
        },
        func: async ({ a, b }) => {
            return (a + b).toString();
        },
        returnType: 'text',
    },
    {
        details: {
            name: 'multiply',
            description: 'Multiply two numbers',
            input_schema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'integer',
                        description: 'The first number'
                    },
                    b: {
                        type: 'integer',
                        description: 'The second number'
                    }
                },
                required: ['a', 'b']
            }
        },
        func: async ({ a, b }) => {
            return (a * b).toString();
        },
        returnType: 'text',
    }
]

async function main() {
    const chat = new AnthropicChat({ tools, systemPrompt: 'You are a helpful assistant.' });
    const r = await chat.ask('Hello');
    console.log(r);
    const result = await chat.ask('What is 1 + 1?');
    console.log(result);
    const result2 = await chat.ask('What is 2 * 2?');
    console.log(result2);
    const result3 = await chat.ask('What is 3 * 3 + 5?');
    console.log(result3);
    console.dir(chat.messages, { depth: null });
}

main().catch(e => {
    console.error(e);
});