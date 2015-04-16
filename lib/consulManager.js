var Consul = require('consul');
var Promise = require('promise');

function ConsulManager(baseUrl) {
    this.consul = new Consul({baseUrl: baseUrl});
}

ConsulManager.prototype.registerService = function (containerData) {
    var consulService = createFromContainerData(containerData),
        serviceId = consulService.Service.ID;

    Promise.denodeify(consul.agent.service.register, 1)(consulService).then(function () {
        console.log("New service has been registered: " + serviceId);
    }, function (error) {
        console.log("Error while registering new service: " + serviceId + ', ' + error);
    });
};

ConsulManager.prototype.deregisterService = function (containerData) {
    var consulService = createFromContainerData(containerData),
        serviceId = consulService.Service.ID;

    Promise.denodeify(consul.agent.service.deregister, 1)(serviceId).then(function () {
        console.log("New service has been unregistered: " + serviceId);
    }, function (error) {
        console.log("Error while deregistering service: " + serviceId + ', ' + error);
    });
};

module.exports = ConsulManager;

function createFromContainerData(data) {
    return {
        Node: data.Config.Env.SERVICE_NAME,
        Address: data.NetworkSettings.IPAddress,
        Service: {
            ID: data.Config.Env.SERVICE_ID,
            Service: data.Config.Env.SERVICE_NAME,
            Address: data.NetworkSettings.IPAddress,
            Port: data.Config.Env.SERVICE_PORT
        }
    };
}