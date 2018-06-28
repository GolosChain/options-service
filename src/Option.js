// TODO -

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
