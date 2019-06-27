const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'Option',
    {
        user: {
            type: String,
            required: true,
        },
        app: {
            type: String,
            enum: ['cyber', 'gls'],
            default: 'cyber',
        },
        profile: {
            type: String,
            required: true,
        },
        options: {
            type: Object,
            default: {},
        },
    },
    {
        index: [
            {
                fields: {
                    user: 1,
                    profile: 1,
                },
            },
        ],
    }
);
