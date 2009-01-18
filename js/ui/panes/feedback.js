qwebirc.ui.FeedbackPane = new Class({
  Implements: [Events],
  initialize: function(parent) {
    parent.set("html", "<div class=\"loading\">Loading. . .</div>");
    var r = new Request.HTML({url: "feedback.html", update: parent, onSuccess: function() {
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      parent.getElement("input[class=close2]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      
      var textbox = parent.getElement("textarea");
      parent.getElement("input[class=submitfeedback]").addEvent("click", function() {
        this.sendFeedback(parent, textbox, textbox.value);
      }.bind(this));
      
      textbox.focus();
    }.bind(this)});
    r.get();
  },
  sendFeedback: function(parent, textbox, text) {
    text = text.replace(/^\s*/, "").replace(/\s*$/, "");
    var mainText = parent.getElement("p[class=maintext]");
    
    if(text.length < 25) {
      mainText.set("text", "I don't suppose you could enter a little bit more? Thanks!");
      textbox.focus();
      return;
    }
    
    var mainBody = parent.getElement("div[class=enterarea]");
    mainBody.setStyle("display", "none");
    
    var messageBody = parent.getElement("div[class=messagearea]");
    var messageText = parent.getElement("p[class=messagetext]");
    var messageClose = parent.getElement("input[class=close2]");
    
    messageText.set("text", "Submitting. . .");
    messageBody.setStyle("display", "");
    
    /* basic checksum to stop really lame kiddies spamming */
    var checksum = 0;
    for(var i=0;i<text.length;i++)
      checksum = ((checksum + 1) % 256) ^ text.charCodeAt(i);

    var r = new Request({url: "/feedback", onSuccess: function() {
      messageText.set("text", "Submitted successfully, thanks for the feedback!");
      messageClose.setStyle("display", "");
    }, onFailure: function() {
      messageBody.setStyle("display", "none");
      mainBody.setStyle("display", "");
      mainText.set("text", "Looks like something went wrong submitting :(");
    }}).send("feedback=" + escape(text) + "&c=" + checksum);
  }
});
