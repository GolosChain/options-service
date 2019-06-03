const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'Favorite',
    {
        user: {
            type: String,
            required: true,
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
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
