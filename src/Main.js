const core = require('griboyedov');
const BasicService = core.service.Basic;
const logger = core.Logger;
const stats = core.Stats.client;
const MongoDB = core.service.MongoDB;
const Gate = core.service.Gate;
const Distributor = require('./service/Distributor');

class Main extends BasicService {
    constructor() {
        super();

        this.printEnvBasedConfig();
        this.addNested(new MongoDB(), new Distributor(Gate));
        this.stopOnExit();
    }

    async start() {
        await this.startNested();
        stats.increment('main_service_start');
    }

    async stop() {
        await this.stopNested();
        stats.increment('main_service_stop');
        process.exit(0);
    }
}

new Main().start().then(
    () => {
        logger.info('Main service started!');
    },
    error => {
        logger.error(`Main service failed - ${error}`);
        process.exit(1);
    }
);
