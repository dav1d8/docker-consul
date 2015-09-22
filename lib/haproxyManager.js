var _ = require('lodash');

var HaproxyManager = function (options) {
    this.docker = options.docker;
    this.haproxyName = options.haproxyName || 'HAPROXY_1';
};

module.exports = HaproxyManager;

HaproxyManager.prototype.reload = function () {
    var self = this;
    self._getHaproxyContainer(function (haproxyContainer) {
        if (!haproxyContainer) {
            console.error('Haproxy container not found for reload.');
        } else {
            self._doReload(haproxyContainer);
        }
    });
};

HaproxyManager.prototype._doReload = function (haproxyContainer) {
    var opts = {
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        Cmd: ["/scripts/run-confd.sh"]
    };
    haproxyContainer.exec(opts, function (err, exec) {
        if (err) {
            console.error('Error while exec confd: ', err);
        } else {
            var opts = {
                Detach: false,
                Tty: false
            };
            exec.start(opts, function (err, result) {
                if (err) {
                    console.error('Error while reload haproxy: ', err);
                } else {
                    console.log('Haproxy has been reloaded');
                }
            });
        }
    });
};

HaproxyManager.prototype._getHaproxyContainer = function (callback) {
    var self = this;
    self.docker.listContainers(function (err, containers) {
        if (err) {
            console.error('Error while get containers: ', err);
        } else {
            var haproxyContainer = null;
            _.forEach(containers, function (container) {
                if (_.indexOf(container.Names, process.env[self.haproxyName + '_NAME']) != -1) {
                    haproxyContainer = self.docker.getContainer(container.Id);
                    return false;
                }
            });
            callback(haproxyContainer);
        }
    });
};