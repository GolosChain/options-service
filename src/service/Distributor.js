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
                        properties: {
                            required: ['data'],
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

    async _get({ user, profile }) {
        const model = await this._findOrCreate(user, profile);

        return model.options;
    }

    async _set({ user, profile, data }) {
        try {
            const model = await this._findOrCreate(user, profile);

            model.options = Object.assign({}, model.options, data);

            await model.save();
        } catch (error) {
            Logger.error(error);

            throw { code: 400, message: 'Bad request' };
        }
    }

    async _getFavorites({ user }) {
        const model = await this._findOrCreateFavorites(user);

        return { list: model.list };
    }

    async _addFavorite({ user, permlink }) {
        const model = await this._findOrCreateFavorites(user);

        model.list.push(permlink);
        model.save();
    }

    async _removeFavorite({ user, permlink }) {
        const model = await this._findOrCreateFavorites(user);

        model.list.pull(permlink);
        model.save();
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
