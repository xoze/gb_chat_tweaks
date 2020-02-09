// Populate the options page with stored settings after page has loaded
$(document).ready(restoreOptions);

if (navigator.userAgent.indexOf("Chrome") != -1) {
  browser = chrome;
}

var apiKey              = document.querySelector("#text_api_key");;

// Invoke saveOptions whenever an option is changed
$(apiKey).on("input", saveOptions);

// Handle mouseover of all infobuttons
$(".option-infobutton-container").on("mouseover", function() {
  $(this).find(".option-infobutton-text").css("display", "block");
});

// Handle mouseout of all infobuttons
$(".option-infobutton-container").on("mouseout", function() {
  $(this).find(".option-infobutton-text").css("display", "none");
});

/**
* Save the user options to synced storage.
*/
function saveOptions(e) {
  e.preventDefault();

  let options = {
    api_key: apiKey.value.trim()
  };

  browser.storage.sync.set(options);
}

/**
* Ensures that the user has entered a key 40 characters in length.
*/
function hasValidKey() {
  if (apiKey.value.trim().length === 40) return true;
  return false;
}

/**
* Populate the options page with the user's saved options
*/
function restoreOptions() {

  // Set the API Key according to user option, default to empty if null
  function setApiKey(result) {
    if (result.api_key) {
      apiKey.value = result.api_key;
    }
  }

   // Firefox and Chrome handle storage get and set differently
  if (navigator.userAgent.indexOf("Chrome") != -1) {
    chrome.storage.sync.get("api_key", setApiKey);
  } else {
    browser.storage.sync.get("api_key").then(setApiKey, onError);
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }
}
