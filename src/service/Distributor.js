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
        let data = await Option.findOne(
            { user, profile },
            { __v: false, _id: false, id: false },
            { lean: true }
        );

        if (!data) {
            data = new Option({ user, profile });

            data.save();
        }

        stats.timing('options_get', new Date() - time);
        return data.options;
    }

    async _set({ user, profile, data }) {
        const time = new Date();

        try {
            const document = await Option.findOne(
                { user, profile },
                { _id: true, options: true },
                { lean: true }
            );

            if (document) {
                await this._updateOptions(document, data);
            } else {
                await this._createOptions(user, profile, data);
            }

            stats.timing('options_get', new Date() - time);
        } catch (error) {
            logger.error(error);
            stats.increment('options_invalid_request');
            throw errors.E400.error;
        }
    }

    async _updateOptions(document, data) {
        const options = Object.assign({}, document.options, data);

        await Option.update({ _id: document._id }, { $set: { options } }, { runValidators: true });
    }

    async _createOptions(user, profile, data) {
        const model = new Option({ user, profile, options: { ...data } });

        await model.save();
    }
}

module.exports = Distributor;
