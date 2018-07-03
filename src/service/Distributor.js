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
        const result = [];
        const requestedOptions = this._normalizeData(data);

        for (let { user, service, path } of requestedOptions) {
            const timer = new Date();
            const record = await Option.findOne(
                { user },
                { _id: 0, options: 1 }
            );
            let options = record.options[service];

            for (let token of path.split('.')) {
                options = options[token];
            }

            result.push(options);
            stats.timing('extract_one_option', new Date() - timer);
        }

        return result;
    }

    async _set(data) {
        const timer = new Date();
        const targetOptions = this._normalizeData(data);

        for (let { user, service, path, data } of targetOptions) {
            const pathQuery = `options.${service}.${path}`;

            await Option.updateOne({ user }, { $set: { [pathQuery]: data } });
            stats.timing('update_one_option', new Date() - timer);
        }
    }

    _normalizeData(data) {
        if (typeof data === 'object') {
            data = [data];
        }

        return data;
    }
}

module.exports = Distributor;
