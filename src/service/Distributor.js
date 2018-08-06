const core = require('gls-core-service');
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
        const time = new Data();
        const data = await Option.findOne(
            { user, profile },
            { __v: false, _id: false, id: false },
            { lean: true }
        );

        if (data) {
            stats.timing('options_get', new Data() - time);
            return data;
        } else {
            stats.increment('options_not_found');
            throw errors.E404.error;
        }
    }

    async _set({ user, profile, data }) {
        const time = new Data();

        try {
            Option.update({ user, profile, options: { $set: data } }, { runValidators: true });
            stats.timing('options_get', new Data() - time);
        } catch (error) {
            stats.increment('options_invalid_request');
            throw errors.E400.error;
        }
    }
}

module.exports = Distributor;
