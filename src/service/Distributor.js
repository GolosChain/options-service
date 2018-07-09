const core = require('griboyedov');
const BasicService = core.service.Basic;
const stats = core.Stats.client;
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

    async _get(data) {
        let forcedUser = null;

        if (data._frontendGate) {
            forcedUser = data.user;
            data = data.params;
        }

        const result = [];
        const requestedOptions = this._normalizeData(data);

        for (let { user, service, path } of requestedOptions) {
            user = forcedUser || user;

            const timer = new Date();
            const record = await this._getUser(user);

            if (!record) {
                throw { code: 404, message: 'Not found' };
            }

            try {
                result.push(this._extractOptions(record, service, path));
            } catch (error) {
                result.push(null);
            } finally {
                stats.timing('extract_one_option', new Date() - timer);
            }
        }

        return result;
    }

    async _getUser(user) {
        return await Option.findOne({ user }, { _id: 0, options: 1 });
    }

    _extractOptions(record, service, path) {
        let options = record.options[service];

        if (path) {
            for (let token of path.split('.')) {
                options = options[token];
            }
        }

        return options;
    }

    async _set(data) {
        let forcedUser = null;

        if (data._frontendGate) {
            forcedUser = data.user;
            data = data.params;
        }

        const timer = new Date();
        const targetOptions = this._normalizeData(data);

        for (let { user, service, path, data } of targetOptions) {
            user = forcedUser || user;

            let pathQuery = `options.${service}`;

            if (path) {
                pathQuery += `.${path}`
            }

            try {
                await Option.updateOne(
                    { user },
                    { $set: { user, [pathQuery]: data } },
                    { upsert: true }
                );
            } catch (error) {
                throw {
                    code: 400,
                    message: `Invalid params - ${user} | ${service} | ${path}`,
                };
            } finally {
                stats.timing('update_one_option', new Date() - timer);
            }
        }
    }

    _normalizeData(data) {
        if (data instanceof Array) {
            return data;
        }

        return [data];
    }
}

module.exports = Distributor;
