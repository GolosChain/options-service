const core = require('gls-core-service');
const logger = core.Logger;
const BasicService = core.service.Basic;
const stats = core.Stats.client;
const errors = core.HttpError;
const Option = require('../model/Option');

class Distributor extends BasicService {
    constructor(Gate) {
        super();

        this._gate = new Gate();
    }

    async start() {
        await this._gate.start({
            serverRoutes: {
                get: this._get.bind(this),
                set: this._set.bind(this),
            },
        });

        this.addNested(this._gate);
    }

    async stop() {
        await this.stopNested();
    }

    async _get({ user, profile }) {
        const time = new Date();
        let model = await this._findOrCreate(user, profile);

        stats.timing('options_get', new Date() - time);
        return model.options;
    }

    async _set({ user, profile, data }) {
        const time = new Date();

        try {
            let model = await this._findOrCreate(user, profile);

            model.options = Object.assign({}, model.options, data);

            await model.save();

            stats.timing('options_get', new Date() - time);
        } catch (error) {
            logger.error(error);
            stats.increment('options_invalid_request');
            throw errors.E400.error;
        }
    }

    async _findOrCreate(user, profile) {
        let model = await Option.findOne({ user, profile });

        if (!model) {
            model = await new Option({ user, profile });
        }

        return model;
    }
}

module.exports = Distributor;
