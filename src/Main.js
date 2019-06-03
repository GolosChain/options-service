const core = require('gls-core-service');
const BasicMain = core.services.BasicMain;
const stats = core.utils.statsClient;
const MongoDB = core.services.MongoDB;
const Connector = core.services.Connector;
const Distributor = require('./service/Distributor');
const env = require('./data/env');

class Main extends BasicMain {
    constructor() {
        super(stats, env);
        this.addNested(new MongoDB(), new Distributor(Connector));
    }
}

module.exports = Main;
