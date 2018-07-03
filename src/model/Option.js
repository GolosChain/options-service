const core = require('griboyedov');
const MongoDB = core.service.MongoDB;

module.exports = MongoDB.makeModel('Option', {
    user: {
        type: String,
        required: true,
    },
    options: {
        type: Object,
        required: true,
    }
});
