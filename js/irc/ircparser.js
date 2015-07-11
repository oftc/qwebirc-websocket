function splitMax(str, sep, max) {
  var tmp = str.split(sep, max)
  var txt = tmp.join(sep)
  var rest = str.replace(txt, '').replace(sep, '')
  tmp.push(rest)
  return tmp
}

var IRCParser = function(socket) {
  var self = this
  var leftOver = ''
  
  self.socket = socket;

  self.parsePacket = function(data, userData) {
    leftOver += data
    var messages = leftOver.split(/\n/)
    for(i in messages) {
      var message = messages[i]
      var omessage = message
      
      if(message.substr(-1) == '\r') {
        message = message.replace('\r', '')

        var source = null
        var parts = null
        
        if(message[0] == ':') {
          parts = splitMax(message, ' ', 1)
          source = parts[0].substr(1)
          message = parts[1]
        }
        
        parts = splitMax(message, ' ', 1)

        var command = '';
        
        if(parts.length == 1) {
          command = parts[0]
          message = undefined
        } else {
          command = parts[0]
          message = parts[1]
        }
        
        var params = []
        
        while(message && message[0] != ':') {
          var middle = splitMax(message, ' ', 1)
          params.push(middle[0])
          if(middle.length > 1) {
            message = middle[1]
          } else {
            message = null
          }
        }
        
        if(message && message[0] == ':')
          params.push(message.substr(1))
       
        var rawcommand = command.toUpperCase()

        self.unhandled(rawcommand, [source, params], userData)
      } else {
        leftOver = message
        break
      }
    }
  }
}

IRCParser.prototype.write = function(data) {
  //console.log(data);
  if(this.socket.write) {
    this.socket.write(data)
  } else {
    this.socket.send(data)
  }
}

IRCParser.prototype.sendMessage = function (msg) {
  this.write(msg + '\r\n');
}
