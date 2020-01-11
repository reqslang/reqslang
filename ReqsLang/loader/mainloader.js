module.exports = MainLoader;

const RxOp = require('rxjs/operators');

function MainLoader(loaderArgs, logger, projectLoader) {
    
    const BaseLoader = require('./baseloader');
    BaseLoader.call(this, logger);

    this.programArgs = loaderArgs;
    this.projectLoader = projectLoader;

    this.valueConverter = function (resultsArray) {
        const result = {};
        result.hasData = resultsArray && resultsArray.length > 0;
        result.data = JSON.stringify(resultsArray);
        return result;
    };

    this.processProjFile = function (projectFile) {
        return this.oWrapper((observer) => {
            this.projectLoader.load(projectFile)
                .pipe(RxOp.toArray())
                .map(array => this.valueConverter(array))
                .subscribe(observer);
        });
    };
}