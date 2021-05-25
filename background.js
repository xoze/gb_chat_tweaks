console.log("background.js start")

// (function(t) {
//   gbpt = {
//     apiKey: "",
//     ignoreUsers: {},
//     watchUsers: {},
//     vipUsers: {},
    
//     onError: function(error) {
//       console.log(`Error: ${error}`);
//     },
    
//     onConnect: function(port) {
//         port.onMessage.addListener(recvievedExtMsg.bind(this));
//     },
    
//     handleOptions: function(options) {
//       if (options.apiKey !== undefined && options.apiKey.length === 40) {
//         apiKey = options.api_key;
//       }
//       if (options.ignoreUsers) {
//         ignoreUsers = options.ignoreUsers;
//       }
//       if (options.watchUsers) {
//         watchUsers = options.watchUsers;
//       }
//       if (options.vipUsers) {
//         vipUsers = options.vipUsers;
//       }
//     },
  
  
//     getOptions: function(sendResponse) {
//       options = ["apiKey", "ignoreUsers", "watchUsers", "vipUsers"];
      
//       if (navigator.userAgent.indexOf("Chrome") != -1) {
//         chrome.storage.sync.get(["api_key"], this.handleOptions.bind(this));
//       } else {
//         getting = browser.storage.sync.get(["api_key"]);
//         getting.then(handleOptions.bind(this), onError);
//       }
//     },
    
//     recvievedExtMsg: function(request, sender, sendResponse) {
//       console.log(sender.tab ?
//         "ext from a content script:" + sender.tab.url :
//         "ext from the extension");
//         if (request.greeting == "hello") {
//           sendResponse({farewell: "goodbye ext"});
//         }
//     },

//     recvievedMsg: function(request, sender, sendResponse) {
//       console.log(sender.tab ?
//         "from a content script:" + sender.tab.url :
//         "from the extension");
//         if (request.greeting == "hello") {
//           sendResponse({farewell: "goodbye"});
//         }
//     },

//     init: function(reason) {
//       console.log("background init")
//       chrome.runtime.onMessage.addListener(this.recvievedMsg.bind(this));
//       chrome.runtime.onConnectExternal.addListener(this.onConnect.bind(this));
      
//       this.getOptions();
//     },
    
//   };
// })(this);

// gbpt.init();

function getOption(optionName, then) {
  next = function(options) {
    then(options[optionName]);
  };

  if (navigator.userAgent.indexOf("Chrome") != -1) {
    chrome.storage.sync.get([optionName], next);
  } else {
    getting = browser.storage.sync.get([optionName]);
    getting.then(next, onError);
  }
}

console.log("Background: Setting up message passing");
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Background: got request");
  // console.log(request)
  if (request.type && (request.type == "gbitweaks_request")) {
    switch (request.request_type) {
      case "get_option":
        getOption(request.option_name, function(option_data){
          // console.log("sending option data for " + request.option_name);
          // console.log(option_data);
          message = {
            type: "gbitweaks_response",
            response_type: "get_option",
            option_name: request.option_name,
            data: option_data,
            message_id: request.message_id
          }
          console.log("Background: sending response");
          console.log(message);
          sendResponse(message);
        });
        break;
      case "save_option":
        options = {};
        options[request.option_name] = request.data;

        then = function(){
          if (chrome.runtime.lastError) {
            console.log(runtime.lastError);
          } else {
            // console.log("save complete")
          }
          message = {
            type: "gbitweaks_response",
            response_type: "save_option",
            option_name: request.option_name,
            message_id: request.message_id,
            response: "ok"
          }
          console.log("Background: sending response");
          console.log(message);
          sendResponse(message);
        }

        // console.log("saving options");
        // console.log(options);
        if (navigator.userAgent.indexOf("Chrome") != -1) {
          chrome.storage.sync.set(options, then);
        } else {
          setting = browser.storage.sync.set(options);
          setting.then(then, onError)
        }
        break;
    }
  }

  return true;
});

console.log("background.js finish")
