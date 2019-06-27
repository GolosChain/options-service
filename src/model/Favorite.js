const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'Favorite',
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
        list: {
            type: [String],
            default: [],
        },
    },
    {
        index: [
            {
                fields: {
                    user: 1,
                    app: 1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
