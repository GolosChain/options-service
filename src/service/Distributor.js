const core = require('gls-core-service');
const logger = core.Logger;
const BasicService = core.services.Basic;
const stats = core.utils.statsClient;
const Option = require('../model/Option');
const Favorite = require('../model/Favorite');

class Distributor extends BasicService {
    constructor(Connector) {
        super();

        this._connector = new Connector();
    }

    async start() {
        await this._connector.start({
            serverRoutes: {
                get: this._get.bind(this),
                set: this._set.bind(this),
                getFavorites: this._getFavorites.bind(this),
                addFavorite: this._addFavorite.bind(this),
                removeFavorite: this._removeFavorite.bind(this),
            },
        });

        this.addNested(this._connector);
    }

    async stop() {
        await this.stopNested();
    }

    async _get({ user, profile }) {
        if (!user || !profile) {
            throw {
                code: 1101,
                message: 'Both user and profile params are required',
            };
        }

        const time = new Date();
        const model = await this._findOrCreate(user, profile);

        stats.timing('options_get', new Date() - time);
        return model.options;
    }

    async _set({ user, profile, data }) {
        const time = new Date();

        try {
            const model = await this._findOrCreate(user, profile);

            model.options = Object.assign({}, model.options, data);

            await model.save();

            stats.timing('options_get', new Date() - time);
        } catch (error) {
            logger.error(error);
            stats.increment('options_invalid_request');
            throw {
                code: 400,
                message: 'Bad request',
            };
        }
    }

    async _getFavorites({ user }) {
        const time = new Date();
        const model = await this._findOrCreateFavorites(user);

        stats.timing('favorites_get', new Date() - time);

        return { list: model.list };
    }

    async _addFavorite({ user, permlink }) {
        const time = new Date();
        const model = await this._findOrCreateFavorites(user);

        model.list.push(permlink);
        model.save();

        stats.timing('favorites_add', new Date() - time);
    }

    async _removeFavorite({ user, permlink }) {
        const time = new Date();
        const model = await this._findOrCreateFavorites(user);

        model.list.pull(permlink);
        model.save();

        stats.timing('favorites_remove', new Date() - time);
    }

    async _findOrCreate(user, profile) {
        let model = await Option.findOne({ user, profile });

        if (!model) {
            model = await new Option({ user, profile });

            await model.save();
        }

        return model;
    }

    async _findOrCreateFavorites(user) {
        let model = await Favorite.findOne({ user });

        if (!model) {
            model = await new Favorite({ user });

            await model.save();
        }

        return model;
    }
}

module.exports = Distributor;
