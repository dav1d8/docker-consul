var Docker = require('dockerode');
var oboe = require('oboe');
var fs = require('fs');
var ConsulManager = require('consulManager');
var Promise = require('promise');

var DockerConsul = module.exports = {};

DockerConsul.listen = function () {

    var docker = new Docker({socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'});
    var consulManager = new ConsulManager({baseUrl: process.env.CONSUL_BASE_URL});

    Promise.denodeify(docker.getEvents)().then(function (stream) {
        oboe(stream).node('!', function (event) {
            console.log(event);
            if (event.status == 'start') {
                getContainerData(event.id).then(function (containerData) {
                    consulManager.registerService(containerData);
                });
            }
            if (event.status == 'die') {
                getContainerData(event.id).then(function (containerData) {
                    consulManager.deregisterService(containerData);
                });
            }
        });
    }, function () {
        console.log('Error happened while registering to docker events: ', err);
    });

    function getContainerData(containerId) {
        var container = docker.getContainer(containerId);
        return Promise.denodeify(container.inspect)();
    }
};