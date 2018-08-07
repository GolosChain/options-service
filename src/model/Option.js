const core = require('gls-core-service');
const MongoDB = core.service.MongoDB;

module.exports = MongoDB.makeModel(
    'Option',
    {
        user: {
            type: String,
            required: true,
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
