module.exports = {
    name: 'create_contest',
    description: 'Create a new contest',
    input_schema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'The title of the contest'
            },
            description: {
                type: 'string',
                description: 'The description of the contest'
            },
            entry_fee: {
                type: 'integer',
                description: 'The entry fee for the contest'
            },
            deadline: {
                type: 'string',
                description: 'The deadline for the contest'
            }
        },
        required: ['title', 'description', 'entry_fee', 'deadline']
    },
    func: async({ title, description, entry_fee, deadline }) => {
        
    },
    returnType: 'text',
}