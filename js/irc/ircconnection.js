/* This could do with a rewrite from scratch. */

qwebirc.irc.IRCConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    timeout: 45000,
    floodInterval: 200,
    floodMax: 10,
    floodReset: 5000,
    errorAlert: true,
    maxRetries: 5,
    serverPassword: null
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.initialNickname = this.options.initialNickname;
    
    this.counter = 0;
    this.disconnected = false;

    this.websocket = null;
    this.parser = null;
  },
  send: function(data, synchronous) {
    if(this.disconnected)
      return false;
    
    this.parser.sendMessage(data)
    return true;
  },
  handleCommands: function(command, params, userData) {
    userData.fireEvent("recv", [['c', command].concat(params)])
  },
  connect: function() {
    var self = this;

    function connected () {
      //console.log('connected');
      if(console && console.log)
        console.log(self.websocket);
      self.firstmessage = false;
      self.parser = new IRCParser(self.websocket)
    }

    function onmessage (msg) {
      if (!self.firstmessage) {
        self.firstmessage = true;
        self.parser.unhandled = self.handleCommands;
        self.parser.sendMessage('NICK ' + self.options.initialNickname);
        self.parser.sendMessage('USER oftc-webirc blah blah :OFTC WebIRC Client')
        self.fireEvent("recv", [['connected']])
      }
      self.parser.parsePacket(msg.data || msg, self)
    }

    function onclose (error) {
      self.disconnect(error);
    }

    function onerror () {
      var url = 'https://webirc.oftc.net:8443';
      if (window.location.search)
        url += window.location.search;
      self.fireEvent("recv", [['disconnect', 'Failed to connect, please connect to '+ url +' and accept the certificate and try again']]);
      self.fireEvent('error', 'fail')
    }

    var remoteHost = "webirc.oftc.net:";
    var port = getParameterByName('ircport');
    remoteHost += port || '8443';
    self.websocket = io.connect('https://' + remoteHost);
    self.websocket.on('connect', connected);
    self.websocket.on('message', onmessage);
    self.websocket.on('error', onerror);
    self.websocket.on('disconnect', onclose);
  },

  disconnect: function(error) {
    this.disconnected = true;
    if(this.websocket) {
      this.websocket.disconnect()
      this.websocket = null;
    }
    error = error || '';
    self.fireEvent("recv", [['disconnect', error.toString()]]);
  },
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
