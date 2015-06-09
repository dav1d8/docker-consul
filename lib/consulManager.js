var Consul = require('consul');

var ConsulManager = function (options) {
    this.consul = new Consul(options);
};

module.exports = ConsulManager;

ConsulManager.prototype.registerService = function (containerData, callback) {
    var consulService = createFromContainerData(containerData);
    if (!consulService){
        console.log('Consul service definition not found for: ', containerData.Name);
    } else {
        this.consul.agent.service.register(consulService, function (err) {
            if (err) {
                console.error("Error while registering new service: ", consulService, err);
            } else {
                console.log("New service has been registered: ", consulService);
                callback(consulService);
            }
        });
    }
};

ConsulManager.prototype.deregisterService = function (containerData, callback) {
    var consulService = createFromContainerData(containerData);
    if (!consulService){
        console.log('Consul service definition not found for: ', containerData.Name);
    } else {
        this.consul.agent.service.deregister(consulService.id, function (err) {
            if (err) {
                console.error("Error while deregistering service: ", consulService, err);
            } else {
                console.log("New service has been unregistered: ", consulService);
                callback(consulService);
            }
        });
    }
};

function createFromContainerData(data) {
    var env = convertEnv(data.Config.Env);

    var service = {
        id: env.CONSUL_SERVICE_ID ? env.CONSUL_SERVICE_ID : env.CONSUL_SERVICE_NAME,
        name: env.CONSUL_SERVICE_NAME,
        address: data.NetworkSettings.IPAddress,
        port: parseInt(env.CONSUL_SERVICE_PORT)
    };

    if (!service.name || !service.address || !service.port){
        return null;
    }

    return service;
}

function convertEnv(envArr) {
    var env = {};
    for (var i = 0; i < envArr.length; i++) {
        var item = envArr[i],
            pos = item.indexOf("="),
            key = item.substr(0, pos);
        env[key] = item.substr(pos + 1);
    }
    return env;
}