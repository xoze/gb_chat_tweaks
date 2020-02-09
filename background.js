(function() {
  gbpt = {
    apiKey: "",
    ignoreUsers: {},
    watchUsers: {},
    vipUsers: {},
    
    onError: function(error) {
      console.log(`Error: ${error}`);
    },
    
    init: function(reason) {
      chrome.runtime.onMessage.addListener(recvievedMsg.bind(this));
      chrome.runtime.onConnectExternal.addListener(onConnect);
      
      getOptions();
    },
    
    onConnect: function(port) {
        port.onMessage.addListener(recvievedExtMsg.bind(this));
    },
    
    handleOptions: function(options) {
      if (options.apiKey !== undefined && options.apiKey.length === 40) {
        apiKey = options.api_key;
      }
      if (options.ignoreUsers) {
        ignoreUsers = options.ignoreUsers;
      }
      if (options.watchUsers) {
        watchUsers = options.watchUsers;
      }
      if (options.vipUsers) {
        vipUsers = options.vipUsers;
      }
    },
  
  
    getOptions: function(sendResponse) {
      options = ["apiKey", "ignoreUsers", "watchUsers", "vipUsers"];
      
      if (navigator.userAgent.indexOf("Chrome") != -1) {
        chrome.storage.sync.get(["api_key"], handleOptions.bind(this));
      } else {
        getting = browser.storage.sync.get(["api_key"]);
        getting.then(handleOptions.bind(this), onError);
      }
    },
    
    recvievedExtMsg: function(request, sender, sendResponse) {
    },

    recvievedMsg: function(request, sender, sendResponse) {
    },
  };
});

//gbpt_setup();
