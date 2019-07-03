const core = require('gls-core-service');
const { Logger } = core.utils;
const BasicService = core.services.Basic;
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
                get: {
                    handler: this._get,
                    scope: this,
                    inherits: ['identification', 'profileSpecify'],
                    validation: {},
                },
                set: {
                    handler: this._set,
                    scope: this,
                    inherits: ['identification', 'profileSpecify'],
                    validation: {
                        required: ['data'],
                        properties: {
                            data: {
                                type: 'object',
                            },
                        },
                    },
                },
                getFavorites: {
                    handler: this._getFavorites,
                    scope: this,
                    inherits: ['identification'],
                    validation: {},
                },
                addFavorite: {
                    handler: this._addFavorite,
                    scope: this,
                    inherits: ['identification', 'permlinkSpecify'],
                    validation: {},
                },
                removeFavorite: {
                    handler: this._removeFavorite,
                    scope: this,
                    inherits: ['identification', 'permlinkSpecify'],
                    validation: {},
                },
            },
            serverDefaults: {
                parents: {
                    identification: {
                        validation: {
                            required: ['user'],
                            properties: {
                                user: {
                                    type: 'string',
                                },
                                app: {
                                    type: 'string',
                                    enum: ['cyber', 'gls'],
                                    default: 'cyber',
                                },
                            },
                        },
                    },
                    profileSpecify: {
                        validation: {
                            required: ['profile'],
                            properties: {
                                profile: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                    permlinkSpecify: {
                        validation: {
                            required: ['permlink'],
                            properties: {
                                permlink: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
        });

        this.addNested(this._connector);
    }

    async stop() {
        await this.stopNested();
    }

    async _get({ user, app, profile }) {
        const model = await this._findOrCreate(user, app, profile);

        return model.options;
    }

    async _set({ user, app, profile, data }) {
        try {
            const model = await this._findOrCreate(user, app, profile);

            model.options = Object.assign({}, model.options, data);

            await model.save();
        } catch (error) {
            Logger.error(error);

            throw { code: 400, message: 'Bad request' };
        }
    }

    async _getFavorites({ user, app }) {
        const model = await this._findOrCreateFavorites(user, app);

        return { list: model.list };
    }

    async _addFavorite({ user, app, permlink }) {
        const model = await this._findOrCreateFavorites(user, app);

        model.list.push(permlink);
        model.save();
    }

    async _removeFavorite({ user, app, permlink }) {
        const model = await this._findOrCreateFavorites(user, app);

        model.list.pull(permlink);
        model.save();
    }

    async _findOrCreate(user, app, profile) {
        let model = await Option.findOne({ user, app, profile });

        if (!model) {
            model = await new Option({ user, app, profile });

            await model.save();
        }

        return model;
    }

    async _findOrCreateFavorites(user, app) {
        let model = await Favorite.findOne({ user, app });

        if (!model) {
            model = await new Favorite({ user, app });

            await model.save();
        }

        return model;
    }
}

module.exports = Distributor;
