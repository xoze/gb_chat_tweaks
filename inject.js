// Handles most Chrome/Firefox incompatibilities.
if (navigator.userAgent.indexOf("Chrome") != -1) {
  browser = chrome;
}

function modLastLogins() {
  var tmplist = [...Phoenix.FireChat.Core.Rooms.Mod.Users.models];
  
  tmplist.sort(function(a, b) { return a.attributes.joinedAt - b.attributes.joinedAt; });
  
  for (var i = 0; i < tmplist.length; i++) {
    console.log(tmplist[i].attributes.displayName + " " + new Date(tmplist[i].attributes.joinedAt));
  }
}

function printMessage(msg) {
  var attrs = msg.attributes;
  var msgTime = new Date(attrs.timestamp);
  var timeStr = msgTime.toLocaleString("en-US", {timeZoneName: "short"});
  var txt = "(" + timeStr + ") " + attrs.name + ":";
  var reply = "";
  
  if (attrs.replyUsers) {
    var first = true;
    
    for (var i = 0; i < attrs.replyUsers.length; i++) {
      if (first) {
        txt += " ";
        first = false;
      } else {
        txt += ", ";
      }
      txt += "@" + attrs.replyUsers[i].username;
    }
    
    reply = " <replying to: " + attrs.replyMessageText + ">";
  }
  
  txt += " " + attrs.text + reply;
  
  return txt;
}

function printLastMessage() {
  var msg = Phoenix.FireChat.Core.Rooms.Main.Messages.models[99];
  
  return printMessage(msg);
}

function logAllMessages() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderAddMessage.bind(main);
  var messages = Phoenix.FireChat.Core.Rooms.Main.Messages.models;
  
  for (i = 0; i < messages.length; i += 1) {
    var msg = messages[i];
  
    console.log("OLD: " + printMessage(msg));
  }
  
  main.renderAddMessage = function(old, e) {
    old(e);
    console.log("NEW: " + printMessage(e));
  }.bind(main, oldRender);
}

function getMessageElement(msg, conv) {
  var singleMessage = "#{id}-{conversation}";
  var selector = singleMessage.replace(new RegExp(/{id}/,"g"), msg.get("id")).replace("{conversation}", conv);
  var t = document.querySelector(selector);
  
  return t;
}

function logRemovedMessages() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderRemoveMessage.bind(main);
  
  main.renderRemoveMessage = function(old, e) {
    var msg = Phoenix.FireChat.Core.Rooms.Main.Messages.get(e.get("id"));
    var t = getMessageElement(msg, this.Name);
    
    if (t.nextElementSibling) {
      //var t = $(c(e.get("id"), s.Name));
      var date = new Date();
      var time = date.toLocaleString("en-US", {timeZoneName: "short"});
      console.log("REMOVED (" + time + "): " + printMessage(msg));
    }
    
    old(e);
  }.bind(main, oldRender);
}

function logMatchingMessages(text) {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderAddMessage.bind(main);
  
  if (main.logKeywords) {
    main.logKeywords.push(text);
  } else {
    main.logKeywords = [text];
  
    main.renderAddMessage = function(old, e) {
      old(e);
      var doesMatch = false;
      var name = e.get("name");
      var reply = e.get("reply");
      var replyMessageText = e.get("replyMessageText");
      var kw = this.logKeywords;
      
      for (var i = 0; i < kw.length; i++) {
        if (name && name.toLowerCase().includes(kw[i])) {
          doesMatch = true;
          break;
        } else if (reply && reply.toLowerCase().includes(kw[i])) {
          doesMatch = true;
          break;
        } else if (replyMessageText && replyMessageText.toLowerCase().includes(kw[i])) {
          doesMatch = true;
          break;
        } else {
          var r = e.get("replyUsers");
          if (r) {
//            $.each(r, function(r, n) {
//              if (n.username.toLowerCase().includes(kw[i])) {
//                doesMatch = true;
//                break;
//              }
//            })
            
            for (var j = 0; j < r.length; j++) {
              var n = r[j];
              if (n.username.toLowerCase().includes(kw[i])) {
                doesMatch = true;
                break;
              }
            }
          }
        }
      }
      if (doesMatch) {
        console.log("MATCHED(\"" + kw[i] + "\"):" + printMessage(e));
      }
    }.bind(main, oldRender);
  }
}

function ignoreSaltybet() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderAddMessage.bind(main);
  
  main.renderAddMessage = function(old, e) {
      var doesMatch = false;
      
      var text = e.get("text");
      
      if (text.startsWith("!bet") ||
          text.startsWith("!funds") ||
          text.startsWith("!newbet") ||
          text.startsWith("!winner") ||
          text.startsWith("!cancel") ||
          text.startsWith("!help")) {
        doesMatch = true;
      } else if (e.get("name") == "Fobwashed") {
        if (text.endsWith("credits.") ||
        (text.includes("[") && text.includes("]")) || 
        (e.get("replyMessageText") == "!help")) {
          doesMatch = true;
        }
      }
      
      if (!doesMatch) {
        old(e);
      }
    }.bind(main, oldRender);
}

function seeSnomPostSnom() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderAddMessage.bind(main);
  
  Phoenix.FireChat.postsnom = false;
  
  main.renderAddMessage = function(old, e) {
    old(e);
    
    if (e.get("userName") != Phoenix.FireChat.Core.User.get("username")) {
      if (e.get("text").includes(":snom")) {
        var replyMessage = e.get("id");
        var replyText = e.get("text");
        var replyUsers = [{
          id: e.get("uid"),
          username: e.get("userName")
        }];
        
        console.log("saw snom: " + replyMessage + ", " + replyText + ", " + replyUsers);
        
        if (Phoenix.FireChat.postsnom) {
          if (Phoenix.FireChat.Core.Chat.get("cooldown") <= 1000) {
            //Phoenix.FireChat.Core.Rooms.Main.Messages.newMessage(":snom", replyMessage, replyText, replyUsers, false);
            Phoenix.FireChat.Core.Rooms.Main.Messages.newMessage(":snom", null, null, [], false);
          }
        }
      }
    }
  }.bind(main, oldRender);
}

function initIgnoreUsers() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var oldRender = main.renderAddMessage.bind(main);
  main.ignoreUsers = {};

  main.renderAddMessage = function(old, e) {
    var doesMatch = false;
    var name = e.get("name").toLowerCase();
    var reply = e.get("reply");
    var replyMessageText = e.get("replyMessageText");
    var iu = this.ignoreUsers;

    if (name in main.ignoreUsers) {
      if (main.ignoreUsers[name]) {
        doesMatch = true;
      } else {
        e.set("text", "[𝑏𝑙𝑜𝑐𝑘𝑒𝑑]")
      }
    }
    if (!doesMatch) {
      old(e);
    }
  }.bind(main, oldRender);

  getOption("ignoreUsers", function(resp) {
    // console.log("got ignoreUsers data");
    // console.log(resp);
    if (resp.data) {
      Phoenix.FireChat.Core.Rooms.Main.ignoreUsers = resp.data;
    }
  });
}

function ignoreUserMessages(user, silence) {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  
  user = user.toLowerCase();
  
  if (!main.ignoreUsers) {
    initIgnoreUsers();
  }

  main.ignoreUsers[user] = silence;
  saveOption("ignoreUsers", main.ignoreUsers, function(resp){})
}

function unignoreUserMessages(user) {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  user = user.toLowerCase();
  
  if (main.ignoreUsers) {
    if (user in main.ignoreUsers) {
      delete iu[user];
      saveOption("ignoreUsers", main.ignoreUsers, function(resp){})
    }
  }
}

function listIgnoredUsers() {
  var main = Phoenix.FireChat.Core.Rooms.Main;

  if (main.ignoreUsers && Object.keys(main.ignoreUsers).length > 0) {
    for (key in main.ignoreUsers) {
      console.log(key + " " + (main.ignoreUsers[key] ? "(silenced)" : ""))
    }
  } else {
    console.log("No ignored users")
  }
}

function unrenderEmoticons(text, emote) {
  var emotes = Phoenix.FireChat.Emotes;
  
  var matches = text.match(/<img\ssrc=[\"\'][^\"\']*[\"\'][^>]*>/g)
  if (matches) {
    for (i = 0; i < matches.length; i++) {
      var imgHtml = matches[i];
      var q = '"';
      var start = imgHtml.indexOf(q);
      
      if (start < 0) {
        q = "'";
        start = imgHtml.indexOf(q);
      }
      
      if (start > 0) {
        var stop = imgHtml.indexOf(q, start + 1);
        
        if (stop > 0) {
          var src = imgHtml.substr(start + 1, stop - start - 1);
          
          for (name in emotes) {
            if (emotes[name] == src /*&& (!emote || name == emote)*/) {
              text = text.replace(imgHtml, ":" + name);
              break;
            }
          }
        }
      }
    }
  }
  
  return text;
}

function renderEmoticons(e) {
  var emotes = Phoenix.FireChat.Emotes;
  var t = /:\b[a-z0-9]+/g;
  var n = e.match(t);
  var i = 0;
  var a = [];
  
  if (n === null || n.length < 1) {
    return e;
  }
  
  $.each(n, function(t, n) {
    if (i >= 5) {
      return;
    }
    var s = n.substring(1);
    var u = emotes[s];
    if (u) {
      e = e.replace(n, '<img src="' + u + '" alt="&#58;' + s + '" title="&#58;' + s + '">');
      i += 1;
      a.push(s)
    }
  });
  
  return e;
}

function emotesToText() {
  var fc = Phoenix.FireChat;
  var emotes = fc.Emotes;
  
  var messages = document.querySelectorAll(".js-msg.chat-history__message");
  
  for (i = 0; i < messages.length; i++) {
    var msg = messages[i];
    
    msg.innerHTML = unrenderEmoticons(msg.innerHTML);
  }
}

function textToEmotes() {
  var emotes = Phoenix.FireChat.Emotes;
  var messages = document.querySelectorAll(".js-msg.chat-history__message");
  
  for (i = 0; i < messages.length; i++) {
    var msg = messages[i];
    
    msg.innerHTML = Phoenix.FireChat.Utils.renderEmoticons(msg.innerHTML);
  }
}

function simpleModeOn() {
  Phoenix.FireChat.Utils.origRenderEmoticons = Phoenix.FireChat.Utils.renderEmoticons;
  Phoenix.FireChat.Utils.renderEmoticons = function(e){ return e;}
  
  emotesToText();
  
  //document.querySelector("#js-chat-container").classList.add("grayscale");
  //document.querySelector("#js-chat-prefs > div > img").style.display = "None";
}

function simpleModeOff() {
  Phoenix.FireChat.Utils.renderEmoticons = Phoenix.FireChat.Utils.origRenderEmoticons;
  delete Phoenix.FireChat.Utils.origRenderEmoticons;
  
  textToEmotes();
  
  //document.querySelector("#js-chat-container").classList.remove("grayscale");
  //document.querySelector("#js-chat-prefs > div > img").style.display = "";
}

function simpleMode() {
  if (Phoenix.FireChat.Utils.origRenderEmoticons) {
    simpleModeOff();
  } else {
    simpleModeOn();
  }
}

function setBanner(name, text) {
  var a = Phoenix.FireChat.Core.Chat;
  var n = "banner-" + name;
  var o = a.get(n);
  var prev = o ? o.text : "";
  var i = {
      text: text,
      prevText: prev
  };
  
  a.set(n, i);
  
  //Phoenix.FireChat.Core.ModTools.renderBanners();
}

function newEmoteAlert(m) {
  var emoteCode = ":" + m.key;
  var text =  "added " + emoteCode;
  
  //console.log(text);
  if (Phoenix.FireChat.setupComplete) {
    // Phoenix.FireChat.Core.Chat.attributes["banner-top"].text = text;
    // Phoenix.FireChat.Core.ModTools.renderBanners();

    setBanner("top", text);
  }
  
  if (Phoenix.FireChat.AutopostNewEmotes) {
    var msg = "";
    for (var i = 0; i < 6; i += 1) {
      msg = msg + emoteCode + " ";
    }
    Phoenix.FireChat.Core.Rooms.Main.Messages.newMessage(msg, null, null, [], false);
  }
}

function deletedEmoteAlert(m) {
  var text = "removed :" + m.key
  
  //console.log(text);
  // Phoenix.FireChat.Core.Chat.attributes["banner-top"].text = text;
  // Phoenix.FireChat.Core.ModTools.renderBanners();

  setBanner("top", text);
}

function setupEmoteAlert() {
  // var origBanner = Phoenix.FireChat.Core.Chat.attributes["banner-top"].text;
  var er = Phoenix.FireChat.Core.Chat.SiteSettingsRef.child("emotes");
  var isBighChat = window.location.pathname.startsWith("/chat")
  
  Phoenix.FireChat.AutopostNewEmotes = false;//isBighChat;
  
  er.on("child_added", newEmoteAlert);
  er.on("child_changed", newEmoteAlert);
  er.on("child_removed", deletedEmoteAlert);
  
  // Phoenix.FireChat.Core.Chat.attributes["banner-top"].text = origBanner;
  // Phoenix.FireChat.Core.ModTools.renderBanners()
}

function padTime(t) {
  var out;
  
  if (t < 10) {
    out = "0" + t;
  } else {
    out = "" + t;
  }
  
  return out;
}

function timeToText(time) {
  var seconds = time % 60;
  var minutes = Math.floor(time / 60) % 60;
  var hours = Math.floor(time / 60 / 60);
  
  var txt = "";
  if (hours > 0) {
    txt += padTime(hours) + ":";
  }
  txt += padTime(minutes) + ":" + padTime(seconds);

  return txt;
}

function setBasicMysteryInfo(info, pollElement) {
  var lengthTxt = "(" + timeToText(info.duration) + ")";
  
  var oldText = "Mystery Box!" + " " + lengthTxt;
  
  var newHtml = '<a href="http://giantbomb.com/videos/embed/' + info.id + '" target="_blank">' + oldText + '</a>';
  pollElement.innerHTML = newHtml;
}

function setAdvancedMysteryInfo(api_key, info, pollElement) {
  var location = "https://www.giantbomb.com/api/video/" + info.id + "/?api_key=" + api_key + "&format=json&field_list=guid,name,length_seconds,publish_date,site_detail_url,premium";
  var client = new XMLHttpRequest();
  client.open('GET', location);
  client.onreadystatechange = function() {
    var resp = JSON.parse(client.responseText);
    
    if (resp.error === "OK") {
      var results = resp.results;
      var year = results.publish_date.split('-')[0];
      var length = timeToText(results.length_seconds);
      
      var extraInfo = "(" + length + " - " + year + ")";
      
      if (results.premium) {
        extraInfo += " *"
      }
      
      var newHtml = 'Mystery Box Contents: <a href="' + results.site_detail_url + '" target="_blank">' + results.name + '</a> ' + extraInfo;
      var newText =' Mystery Box Contents: ' + results.name + ' ' + extraInfo;
      
      //pollElement.innerHTML = newHtml;
      pollElement.textContent = newText;
    } else {
      console.log("oops, error looking up video info: " + resp);
      setBasicMysteryInfo(info, pollElement);
    }
  };
  
  client.send();
}

function boxInfo(api_key) {
  var polls = Phoenix.FireChat.Core.Chat.getRoomPolls('main').models;
  var curPoll = polls[polls.length - 1];
  var answers = curPoll.attributes.answers;
  var answerDetails = curPoll.attributes.answerDetails;
  
  var date = new Date();
  var out = "#" + date.toLocaleString("en-US", {timeZoneName: "short"}) + "\n";
  
  for (var i = 0; i < answers.length; i += 1) {
    out += answerDetails[i].id + ": " + answers[i] + "\n";
  }
  console.log(out);
  return;
  
  if (curPoll.attributes.answerDetails.length != 6)
    return;
  
  var info = curPoll.attributes.answerDetails[5];
  var id = curPoll.id;
  var pollElements = document.getElementById(id);
  var pollElement = pollElements.getElementsByClassName("poll-choices__label")[5];
  
  if (!info.id) {
    return;
  }
  
  if (api_key !== undefined) {
    setAdvancedMysteryInfo(api_key, info, pollElement);
  } else {
    setBasicMysteryInfo(info, pollElement);
  }
}

function renderPollWithMysteryInfo(old, api_key, e) {
  old(e);
  boxInfo(api_key);
}

function autoShowMysteryInfo(api_key) {
  var pollTools = Phoenix.FireChat.Core.PollTools;
  var oldRender = pollTools.renderPoll.bind(pollTools);
  
  pollTools.renderPoll = renderPollWithMysteryInfo.bind(pollTools, oldRender, api_key);
}

function sendMessage() {
  var GBITweaksId = "hknjjnpifdohieihjgdoffbngjenhdjh";
  console.log("sending message");
  chrome.runtime.sendMessage(GBITweaksId, {getApiKey: true}, function(response) {
    console.log("got response: " + response.apiKey);
    api_key = response.apiKey;
    boxInfo(response.apiKey);
    autoShowMysteryInfo(response.apiKey);
  });
}

function mbSetup(count) {
  if (!window.location.pathname.startsWith("/infinite/")) {
    return;
  }
  
  if (!count) {
    count = 0;
  } else if (count > 100) {
    throw "ERROR: mbSetup() can't proceed after 10 seconds, giving up.";
  }
  
  var again = mbSetup.bind(this, count + 1);
  
  try {
    var core = Phoenix.FireChat.Core;
    var polls = core.Chat.getRoomPolls('main').models;
    
    if (polls && polls.length > 0) {
      var api_key = getApiKey();
      
      autoShowMysteryInfo(api_key);
      boxInfo(api_key);
      
      if (polls.length == 1) {
        //Phoenix.FireChat.Core.ModTools.renderBanners = function(){}
      }
    } else {
      setTimeout(again, 100);
    }
  } catch(err) {
    setTimeout(again, 100);
  }
}

function fixPopoutPollTime(count) {
  if (!window.location.pathname.startsWith("/infinite/popout")) {
    return;
  }
  
  var pollTools = Phoenix.FireChat.Core.PollTools;
  pollTools.setupTVPolls();
}

function setupScrollHold() {
  var main = Phoenix.FireChat.Core.Rooms.Main;
  var inputKeypress = main.inputKeypress.bind(main);
  var inputKeyrelease = main.inputCheck.bind(main);
  var mouseOverMessage = main.mouseOverMessage.bind(main);
  var mouseLeaveMessage = main.mouseLeaveMessage.bind(main);
  
  function replacementScrollHold(e) {
    var s = this;
    var t = $(e).outerHeight() + 1;
    var a = s.$els.conversation.parents(".chat-scroll-hold");
    var r = a.scrollTop();
    if (r > 0 || s.noScroll) {
        a.scrollTop(r + t)
    }
  }

  main.shiftDown = false;
  main.noScroll = false;
  
  
  //main.inputCheck = function(e){ main.shiftDown = e.shiftKey; inputKeyrelease(e); }.bind(main);
  //main.inputKeypress = function(e){ main.shiftDown = e.shiftKey; inputKeypress(e); }.bind(main);
  main.mouseOverMessage = function(e){ if (e.shiftKey) {this.noScroll = true; console.log("mo shift");} else { console.log("mo"); } mouseOverMessage(e); }.bind(main);
  main.mouseLeaveMessage = function(e){ this.noScroll = false; mouseLeaveMessage(e) }.bind(main);
}

function sendMessage(message, callback) {
  message_id = Math.floor(Math.random() * 0x100000000);


  if (callback) {
    GBCT.message_callbacks[message_id] = callback;
  }

  message.type = "gbitweaks_request";
  message.message_id = message_id;

  console.log("sending message");
  console.log(message.data);

  window.postMessage(message, "*");
}

function saveOption(name, value, callback) {
  message = {
    request_type: "save_option",
    option_name: name,
    data: value,
  }

  sendMessage(message, callback);
}

function getOption(name, callback) {
  message = {
    request_type: "get_option",
    option_name: name,
  }

  sendMessage(message, callback);
}

function setupMessageReciever() {
  GBCT.message_callbacks = new Map();

  console.log("Inject: Setting up message passing");

  window.addEventListener("message", (event) => {
    // Do we trust the sender of this message?  (might be
    // different from what we originally opened, for example).
    if (event.source != window) {
      return;
    }

    console.log("Inject: got message");
    console.log(event);

    if (event && event.data && event.data.type && (event.data.type == "gbitweaks_response")) {
      if (event.data.message_id && event.data.message_id in GBCT.message_callbacks) {
        callback = GBCT.message_callbacks[event.data.message_id];
        delete GBCT.message_callbacks[event.data.message_id];
        
        callback(event.data);
      }

      // switch (event.data.response_type) {
      //   case "get_option":
          
      //     break;
      //   case "save_option":
      //     break;
      //   default:
      //     break;
      // }
    }
  
    // event.source is popup
    // event.data is "hi there yourself!  the secret response is: rheeeeet!"
  }, false);
}

function chatLoadComplete() {
  setupMessageReciever();
  //console.log("sending message to extension");
  //window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
  // chrome.runtime.sendMessage("hknjjnpifdohieihjgdoffbngjenhdjh", {greeting: "hello"}, function(response) {
  //   console.log(response.farewell);
  // });
  
  
  // replace emote rendering function with one which adds mouseover text of emote code
  Phoenix.FireChat.Utils.renderEmoticons = renderEmoticons;
  
  //mbSetup();
  fixPopoutPollTime();
  setupEmoteAlert();
  //setupScrollHold();
  
  emotesToText();
  delete Phoenix.FireChat.Emotes.cchuck;
  delete Phoenix.FireChat.Emotes.thinkinaboutthos;
  delete Phoenix.FireChat.Emotes.thisistheron;
  
  Phoenix.FireChat.Emotes.cooladult = "https://giantbomb1.cbsistatic.com/uploads/square_mini/29/293532/3127673-goku.jpg";
  Phoenix.FireChat.Emotes.coolcat = "https://giantbomb1.cbsistatic.com/uploads/square_mini/35/359887/3096889-sunglasses.png";
  Phoenix.FireChat.Emotes.coolpan = "https://giantbomb1.cbsistatic.com/uploads/square_mini/1/10726/3235858-download20200801234107.png";
  Phoenix.FireChat.Emotes.peepin2 = "https://giantbomb1.cbsistatic.com/uploads/original/35/359887/3267729-peepin2-smol.png"
  textToEmotes();
  
  ignoreSaltybet();
  
  seeSnomPostSnom();

  initIgnoreUsers();

  //ignoreUserMessages("UserName", true);
  
  Phoenix.FireChat.setupComplete = true;
  
  console.log("chat_tools startup complete")
}

function waitForChatLoaded(count) {
  //if (!window.location.pathname.startsWith("/infinite/popout")) {
  //  return;
  //}
  
  if (!count) {
    count = 0;
  } else if (count > 100) {
    throw "ERROR: waitForChatLoaded() can't proceed after 10 seconds, giving up.";
  }
  
  var again = waitForChatLoaded.bind(this, count + 1);
  
  try {
    var core = Phoenix.FireChat.Core;
    var ok = false;
    
    if (core) {
      var loaded = core.ChatLoaded;
      var pollTools = core.PollTools;
      var chat = core.Chat;
    
      if (loaded && pollTools && chat) {
        var emotes = Phoenix.FireChat.Emotes;
        
        if (emotes && Object.getOwnPropertyNames(emotes).length > 0) {
          chatLoadComplete();
          ok = true;
        }
      } 
    }
    
    if (!ok) {
      setTimeout(again, 100);
    }
  } catch(err) {
    console.log(err);
    setTimeout(again, 100);
  }
}

console.log("chat_tools starting up")
GBCT = new Object();
waitForChatLoaded();
