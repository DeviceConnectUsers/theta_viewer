var DeviceConnect = (function(){
  var scopes = Array("battery","serviceinformation", "servicediscovery", "file", "mediastream_recording", "omnidirectional_image");
  var host = "http://localhost:4035";
  
  var DeviceConnect = function(args) {
    this.applicationName = args.applicationName;
    this.clientId = localStorage.getItem('clientId') || "";
    this.host = args.host || host;
    this.scopes = args.scopes || scopes;
    this.accessToken = localStorage.getItem('accessToken') || "";
    this.services = [];
    // dConnect.setHost(document.location.hostname);
  }
  
  var p = DeviceConnect.prototype;
    
  p.getMediaRecorder = function(id) {
    me = this;
    return $.ajax({
      url: me.host + "/gotapi/mediastream_recording/mediarecorder",
      type: "GET",
      data: {
        serviceId: id,
        accessToken: me.accessToken
      }
    });
  };
  
  p.getPreviewUrl = function(id, recorder_id) {
    me = this;
    return $.ajax({
      url: me.host + "/gotapi/mediastream_recording/preview",
      type: "PUT",
      data: {
        serviceId: id,
        accessToken: me.accessToken,
        target: recorder_id
      }
    });
  };
  
  p.thetaImageUrl = function() {
    me = this;
    var p = new Promise(function(resolve, reject) {
      var id = me.findService("host");
      if (typeof id == 'undefined') {
        return reject({
          errorCode: 99,
          errorMessage: 'THETA is not found.'
        });
      }
      me.getMediaRecorder(id)
      .then(function(result) {
        var recorder_id = result.recorders[0].id
        return me.getPreviewUrl(id, recorder_id);
      })
      .then(function(result) {
        return resolve(result.uri);
      })
      .fail(function(error) {
        return reject(error);
      })
    });
    return p;
  }
  
  p.findService = function(name) {
    for (i in this.services) {
      if (this.services[i].id.toLowerCase().indexOf(name.toLowerCase()) == 0) {
        return this.services[i].id;
      }
    }
  }
  
  p.setLocalStorage = function() {
    localStorage.setItem('clientId', me.clientId);
    localStorage.setItem('accessToken', me.accessToken);
  }
  
  p.setup = function() {
    var me = this;
    var p = new Promise(function(resolve, reject) {
      me.check()
      .then(function(res) {
        return me.grant()
      }, function(res) {
        return reject(res);
      })
      .then(function(res) {
        me.accessToken = res.accessToken;
        me.clientId = res.clientId;
        me.setLocalStorage()
        return me.discover()
      }, function(res) {
        return reject(res);
      })
      .then(function(services) {
        me.services = services;
        return resolve(services);
      }, function(res) {
        return reject(res);
      })
    });
    return p;
  };
  
  p.discover = function() {
    me = this;
    var p = new Promise(function(resolve, reject) {
      dConnect.discoverDevices(me.accessToken,
        function(json) {
          return resolve(json.services);
        },
        function(errorCode, errorMessage) {
          
          return reject({errorCode: errorCode, errorMessage: errorMessage})
        });
    });
    return p;
  };
  
  p.grant = function() {
    me = this;
    var p = new Promise(function(resolve, reject) {
      if (me.clientId && me.accessToken != "") {
        return resolve({clientId: me.clientId, accessToken: me.accessToken});
      }
      dConnect.authorization(me.scopes, me.applicationName,
        function(clientId, accessToken) {
          return resolve({clientId: clientId, accessToken: accessToken});
        },
        function(errorCode, errorMessage) {
          return reject({errorCode: errorCode, errorMessage: errorMessage})
        });
    });
    return p;
  };
  
  p.check = function() {
    var p = new Promise(function(resolve, reject) {
      dConnect.checkDeviceConnect(
        function(apiVersion) {
          return resolve({apiVersion: apiVersion});
        }, function(errorCode, errorMessage) {
          return reject({errorCode: errorCode, errorMessage: errorMessage})
        });
    });
    return p;
  }
  return DeviceConnect;
})();


