function countMediaRules(styleSheet) {
  var ruleList = styleSheet.cssRules;
  var i = 0;
  var j = 0;
  
  while (i < ruleList.length) {
    if (ruleList[i].type === CSSRule.MEDIA_RULE) {
      j += 1;
    }
    i += 1;
  }
  
  return j;
}

function deleteMediaRules(styleSheet) {
  var ruleList = styleSheet.cssRules;
  var i = 0;
  var j = 0;
  var initialSize = ruleList.length;
  var rules = [];
  
  while (i < ruleList.length) {
    if (ruleList[i].type === CSSRule.MEDIA_RULE) {
      if (ruleList[i].conditionText.search("min-width") !== -1) {
        if (ruleList[i].cssRules[0].selectorText.search(".dropnav-menu") !== -1) {
          rules.push(ruleList[i].cssRules[0].cssText);
        }
      }
      styleSheet.deleteRule(i);
      j += 1;
    } else {
      i += 1;
    }
  }
  
  return rules;
}

function addCssNode(csstext) {
  let mycss = document.createElement('style');
  let cssTextNode = document.createTextNode(csstext);
  
  mycss.type = 'text/css';
  mycss.appendChild(cssTextNode);
  
  let newStyleSheetElement = document.getElementsByTagName("head")[0].appendChild(mycss);
  let newSheet = newStyleSheetElement.sheet;
  
  return newSheet;
}

function replaceCssNode(client, oldSheet) {
  if (client.readyState != XMLHttpRequest.DONE) {
    return;
  }
  
  let noMediaSheet = addCssNode(client.responseText);
  
  let rulesToAdd = deleteMediaRules(noMediaSheet);
  
  //oldSheet.disabled=true;
  oldSheet.ownerNode.parentElement.removeChild(oldSheet.ownerNode);
  
  //let mycss = document.createElement('style');
  //let csstext = document.createTextNode(client.responseText);
  
  //mycss.type = 'text/css';
  //mycss.appendChild(csstext);
  
  //let newStyleSheetElement = document.getElementsByTagName("head")[0].appendChild(mycss);
  //let newSheet = newStyleSheetElement.sheet;
  
  let newSheet = addCssNode("");
  
  var logoRule = "@media (max-width: 759px) { .spartan-logo { display: none; } }";
  var statRule = "@media (max-width: 759px) { .spartan-stats { display: none; } }";
  
  //deleteMediaRules(newSheet);
  
  newSheet.insertRule(logoRule);
  newSheet.insertRule(statRule);
  newSheet.insertRule(".grayscale { filter: grayscale(100%);}");
  
  for (let i = 0; i < rulesToAdd.length; i++) {
    newSheet.insertRule(rulesToAdd[i]);
  }
}

function replaceCSSWithEditable(styleSheet) {
  var client = new XMLHttpRequest();
  client.open('GET', styleSheet.href);
  client.onreadystatechange = replaceCssNode.bind(this, client, styleSheet);
  client.send();
} 

function replaceAllCSSWithEditable() {
  var infinitePopout = window.location.pathname.startsWith("/infinite/popout");
  var chatPopout = window.location.pathname.startsWith("/chat/popout");
  if (!infinitePopout && !chatPopout) {
    return;
  }
  
  var sheets = [];

  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href != null) {
      sheets.push(document.styleSheets[i]);
    }
  }
  
  for (var i = 0; i < sheets.length; i++) {
    replaceCSSWithEditable(sheets[i]);
  }
}

function addScript(client) {
  if (client.readyState != XMLHttpRequest.DONE) {
    return;
  }
  
  let script = document.createElement('script');
  let text = document.createTextNode(client.responseText);
  
  script.type = 'text/javascript';
  script.appendChild(text);
  
  let newStyleSheetElement = document.getElementsByTagName("head")[0].appendChild(script);
  
  // Call on initial load and then set on a five minute schedule
//  if (window.location.pathname.startsWith("/infinite/")) {
//    getOptions();
//  }
}

function loadScript(url) {
  var client = new XMLHttpRequest();
  client.open('GET', url);
  client.onreadystatechange = addScript.bind(this, client);
  client.send();
}

/**
* Check for Live Show when user has provided API key and has option turned on.
*/
function handleOptions(options) {
  let script = document.createElement('script');
  script.type = 'text/javascript';
  var api_key;
  
  if (options.api_key !== undefined && options.api_key.length === 40) {
    api_key = "'" + options.api_key + "'";
  } else {
    api_key = "null";
  }
  
  var text = "function getApiKey() {\n";
  text += "return " + api_key + ";\n";
  text += "}\n";
  
  let textNode = document.createTextNode(text);
  script.appendChild(textNode);
  
  let newStyleSheetElement = document.getElementsByTagName("head")[0].appendChild(script);
  
  loadScript(chrome.runtime.getURL("chat_tools.js"));
}

function handleOptionsAndReply(options, sendResponse) {
  let script = document.createElement('script');
  script.type = 'text/javascript';
  var text = "";
  
  if (options.api_key !== undefined && options.api_key.length === 40) {
    sendResponse({apiKey: options.api_key});
  } else {
    sendResponse({apiKey: null});
  }
}

/**
* Retrieve user options. Chrome and Firefox handle this differently.
*/
function getOptions() {
  if (navigator.userAgent.indexOf("Chrome") != -1) {
    chrome.storage.sync.get(["api_key"], handleOptions);
  } else {
    getting = browser.storage.sync.get(["api_key"]);
    getting.then(handleOptions, onError);
  }
}

function onError(error) {
  console.log(`Error: ${error}`);
}

// delete the CSS rules which prevent popout-chat from rendering correctly when narrow
replaceAllCSSWithEditable();
//loadScript(chrome.runtime.getURL("chat_tools.js"));
getOptions();

