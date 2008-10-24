qwebirc.irc.CommandParser = new Class({
  initialize: function(parentObject) {
    this.aliases = {
      "J": "JOIN",
      "K": "KICK",
      "MSG": "PRIVMSG",
      "Q": "QUERY",
      "BACK": "AWAY",
      "HOP": "CYCLE"
    };
    
    this.send = parentObject.send;
    this.parentObject = parentObject;
  },
  newTargetLine: function(target, type, message, extra) {
    if(!extra)
      extra = {}

    extra["n"] = this.parentObject.getNickname();
    extra["m"] = message;
    extra["t"] = target;

    var window = this.parentObject.getWindow(target);
    var channel;
    if(!window) {
      type = "TARGETED" + type;
      target = false;
      this.parentObject.newActiveLine("OUR" + type, extra);
      return;
    } else if(window.type == qwebirc.ui.WINDOW_CHANNEL) {
      type = "CHAN" + type;
    } else {
      type = "PRIV" + type;
    }

    this.parentObject.newLine(target, "OUR" + type, extra);
  },
  dispatch: function(line) {
    if(line.length == 0)
      return;

    if(line.charAt(0) != "/")
      line = "/SAY " + line;
    
    var line = line.substr(1);
    var allargs = line.splitMax(" ", 2);
    var command = allargs[0].toUpperCase();
    var args = allargs[1];
        
    var aliascmd = this.aliases[command];
    if(aliascmd)
      command = aliascmd;
    
    for(;;) {
      var cmdopts = this["cmd_" + command];
      if(!cmdopts) {
        if(args) {
          this.send(command + " " + args);
        } else {
          this.send(command);
        }
        return;
      }
      
      var activewin = cmdopts[0];
      var splitargs = cmdopts[1];
      var minargs = cmdopts[2];  
      var fn = cmdopts[3];
      
      var w = this.parentObject.getActiveWindow();
      if(activewin && w.type == qwebirc.ui.WINDOW_STATUS) {
        w.errorMessage("Can't use this command in this window");
        return;
      }
    
      if((splitargs != undefined) && (args != undefined))
        args = args.splitMax(" ", splitargs);
      
      if((minargs != undefined) && (
           ((args != undefined) && (minargs > args.length)) ||
           ((args == undefined) && (minargs > 0))
         )) {
        w.errorMessage("Insufficient arguments for command.");
        return;
      }
      
      var ret = fn.attempt([args], this);
      if(ret == undefined)
        return;
        
      command = ret[0];
      args = ret[1];
    }
  },
  /* [require_active_window, splitintoXargs, minargs, function] */
  cmd_ME: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";

    var target = this.parentObject.getActiveWindow().name;
    if(!this.send("PRIVMSG " + target + " :\x01ACTION " + args + "\x01"))
      return;

    this.newTargetLine(target, "ACTION", args);
  }],
  cmd_CTCP: [false, 3, 2, function(args) {
    var target = args[0];
    var type = args[1].toUpperCase();
    var message = args[2];
    
    if(message == undefined)
      message = "";

    if(message == "") {
      if(!this.send("PRIVMSG " + target + " :\x01" + type + "\x01"))
        return;
    } else {
      if(!this.send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01"))
        return;
    }
  
    this.newTargetLine(target, "CTCP", message, {"x": type});
  }],
  cmd_PRIVMSG: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];
    
    if(this.send("PRIVMSG " + target + " :" + message))
      this.newTargetLine(target, "MSG", message, {});  
  }],
  cmd_NOTICE: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];

    if(this.send("NOTICE " + target + " :" + message))
      this.newTargetLine(target, "NOTICE", message);
  }],
  cmd_QUERY: [false, 2, 1, function(args) {
    this.parentObject.newWindow(args[0], qwebirc.ui.WINDOW_QUERY, true);

    if((args.length > 1) && (args[1] != ""))
      return ["SAY", args[1]];
  }],
  cmd_SAY: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";
      
    return ["PRIVMSG", this.parentObject.getActiveWindow().name + " " + args]
  }],
  cmd_ABOUT: [false, undefined, undefined, function(args) {
    var lines = [
      "",
      "qwebirc v" + qwebirc.VERSION,
      "Copyright (C) 2008 Chris Porter. All rights reserved.",
      "http://webchat.quakenet.org/",
      "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.",
      "",
      "This software contains portions by the following third parties:",
      "- MooTools v1.2 -- http://mootools.net/",
      "  Copyright (C) 2006-2008 Valerio Proietti, MIT license.",
      "",
      "Thank you for flying QuakeNet!",
      "",
    ];
    
    var aw = this.parentObject.getActiveWindow();
    lines.forEach(function(x) {
      this.parentObject.newActiveLine("", x);
    }.bind(this));
  }],
  cmd_QUOTE: [false, 1, 1, function(args) {
    this.send(args[0]);
  }],
  cmd_KICK: [true, 2, 1, function(args) {
    var channel = this.parentObject.getActiveWindow().name;
    
    var message = "";
    var target = args[0];
    
    if(args.length == 2)
      message = args[1];
    
    this.send("KICK " + channel + " " + target + " :" + message);
  }],
  automode: function(direction, mode, args) {
    var channel = this.parentObject.getActiveWindow().name;

    var modes = direction;
    for(var i=0;i<args.length;i++)
      modes = modes + mode;
      
    this.send("MODE " + channel + " " + modes + " " + args.join(" "));
  },
  cmd_OP: [true, 6, 1, function(args) {
    this.automode("+", "o", args);
  }],
  cmd_DEOP: [true, 6, 1, function(args) {
    this.automode("-", "o", args);
  }],
  cmd_VOICE: [true, 6, 1, function(args) {
    this.automode("+", "v", args);
  }],
  cmd_DEVOICE: [true, 6, 1, function(args) {
    this.automode("-", "v", args);
  }],
  cmd_TOPIC: [true, 1, 1, function(args) {
    this.send("TOPIC " + this.parentObject.getActiveWindow().name + " :" + args[0]);
  }],
  cmd_AWAY: [false, 1, 0, function(args) {
    this.send("AWAY :" + (args?args[0]:""));
  }],
  cmd_QUIT: [false, 1, 0, function(args) {
    this.send("QUIT :" + (args?args[0]:""));
  }],
  cmd_CYCLE: [true, 1, 0, function(args) {
    var c = this.parentObject.getActiveWindow().name;
    
    this.send("PART " + c + " :" + (args?args[0]:"rejoining. . ."));
    this.send("JOIN " + c);
  }],
  cmd_CLEAR: [false, undefined, undefined, function(args) {
    var w = this.parentObject.getActiveWindow().lines;
    while(w.childNodes.length > 0)
      w.removeChild(w.firstChild);
  }],
  cmd_PART: [false, 2, 0, function(args) {
    var w = this.parentObject.getActiveWindow();
    var message = "";
    var channel;
    
    if(w.type == qwebirc.ui.WINDOW_STATUS) {
      if(!args || args.length == 0) {
        w.errorMessage("Insufficient arguments for command.");
        return;
      }
      channel = args[0];  
      if(args.length > 1)
        message = args[1];
    } else {
      if(!args || args.length == 0) {
        channel = w.name;
      } else {
        var isChan = args[0].charAt(0) == '#';
        if(isChan) {
          channel = args[0];
          if(args.length > 1)
            message = args[1];
        } else {
          channel = w.name;
          message = args.join(" ");
        }
      }
    }
    
    this.send("PART " + channel + " :" + message);
  }]
});
