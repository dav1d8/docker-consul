var Docker = require('dockerode');
var Consul = require('consul');
var oboe   = require('oboe');
var fs     = require('fs');

var DockerConsul = module.exports = {};

DockerConsul.start = function() {

  var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
  var stats  = fs.statSync(socket);

  if (!stats.isSocket()) {
    throw new Error("Are you sure the docker is running?");
  }

  var docker = new Docker({ socketPath: socket });
  var consul = new Consul({ baseUrl: process.env.BASE_URL || 'http://172.17.0.75:8500/v1' });

  docker.getEvents(function (err, stream) {
    if (err) {
      console.log('Error happened: ', err);
      throw "Error happened: " + err;
    }

    oboe(stream).node('!', function (event) {
      console.log(event.status, event.id);
      var container = docker.getContainer(event.id);
      container.inspect(function (err, data) {
        if (err) {
          console.log('Erorr happened: ', err);
          return;
        }
        var consulData = {
          ipAddress: data.NetworkSettings.IPAddress
        };
        var key = data.Config.Env.SERVICE_NAME;
        consul.kv.set('test', 'here', function (err) {
          console.log(err)
        });
      });
    });
  });
};