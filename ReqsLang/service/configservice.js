module.exports = ConfigService;

function ConfigService(fileJsonService) {
    this.fileJsonService = fileJsonService;
    
    this.getConfig = function () {
        const sArgs = ConfigService.programArgs;
        return this.fileJsonService.load("./config/config.json")
            .map(c => {
                c.programArgs = sArgs;
                return c;
            });
    };
}