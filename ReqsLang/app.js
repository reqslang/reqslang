'use strict';
const cmd = require('commander');
const Container = require('./container');

cmd
    .version(require('./package.json').version)
    .usage("[options] file")
    //.option('--logLevel <required>', 'logging level')
    .option('--outputFileFormat <required>', 'export file format, i.e. json')
    .option('--outputFile <required>', 'where to store results of evaluation, default console')
    .option('--showDatabase <required>', 'shows database content')
    .parse(process.argv);

if (cmd.outputFileFormat && "json".localeCompare(cmd.outputFileFormat) !== 0) {
    console.log("Only json file format allowed");
    return;
}

const LoaderArgs = {
    logLevel: cmd.logLevel || "info",
    showDatabase: cmd.showDatabase !== undefined ? (cmd.showDatabase === 'true') : true,
    fileFormat: cmd.fileFormat || "json",
    outputFile: cmd.outputFile
};
const container = new Container(LoaderArgs);
const mainLoader = container.getInstance('mainLoader');
const logger = container.logger;
const path = require('path');
const args = cmd.args || [];

if (!args.length) {
    console.log("Please provide file");
    return;
}

logger.info("Attempting to process project file");
const projectFile = path.normalize(args[args.length - 1]);

const processExiter = (errorCode) => {
    process.exit(errorCode);
};

const destroyer = (errorCode) => {
    container.destroy().subscribe(_ => {
        logger.info("Database destroyed");
        processExiter(errorCode);
    }, ex => {
        console.error(ex);
        processExiter(-2);
    });
};

mainLoader.processProjFile(projectFile)
    .subscribe(fc => {
        if (!fc || !fc.hasData) {
            destroyer(0);
            return;
        }

        if (LoaderArgs.outputFile) {
            container.getInstance('fileService').writeFile(LoaderArgs.outputFile, fc.data)
                .subscribe(_ => { }, err => mainLoader.logger.error(err), () => destroyer(-1));

        } else {
            console.log(fc.data);
            destroyer(-1);
        }
    }, ex => {
        mainLoader.logger.error(ex);
        destroyer(-2);
    }, () => {
        destroyer(0);
    });

