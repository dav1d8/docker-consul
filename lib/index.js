var Docker = require('dockerode');
var oboe = require('oboe');
var fs = require('fs');
var ConsulManager = require('./consulManager');
var HaproxyManager = require('./haproxyManager');

var DockerConsul = module.exports = {};

DockerConsul.listen = function () {
    var docker = new Docker({socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'});
    var consulManager = new ConsulManager({baseUrl: process.env.CONSUL_BASE_URL});
    var haproxyManager = new HaproxyManager({docker: docker});

    console.log('Docker-consul started.');
    docker.getEvents(function (err, stream) {
        if (err){
            console.error('Error happened while registering to docker events: ', err);
        } else {
            console.log('Listening for events.');
            oboe(stream).node('!', function (event) {
                if (event.status == 'start' || event.status == 'restart' || event.status == 'unpause') {
                    getContainerData(event.id, function(containerData){
                        consulManager.registerService(containerData, function(){
                            haproxyManager.reload();
                        });
                    });
                }
                if (event.status == 'stop' || event.status == 'kill' || event.status == 'die' || event.status == 'pause') {
                    getContainerData(event.id, function(containerData){
                        consulManager.deregisterService(containerData, function(){
                            haproxyManager.reload();
                        });
                    });
                }
                //Do nothing on 'create', 'destroy' or 'export' events
            });
        }
    });

    function getContainerData(containerId, callback) {
        var container = docker.getContainer(containerId);
        container.inspect(function(err, containerData){
            if (err){
                console.error('Error happened while inspect container: ', containerId, err);
            } else {
                callback(containerData);
            }
        });
    }
};