var ext_name = "Block Unicode domains:";
var ext_state = true;
var ext_badge = "";
var ext_delay = 1;

chrome.webRequest.onBeforeRequest.addListener(function(r) {
    try{
      ext_url = r.url
      if (!ext_url.match(/xn\-\-/)) return;
      import('./punycode_mod.js')
        .then(module => {
          const ret = module.default.puni2uni(ext_url);
          if (ext_state){
            ext_badge = "BLK!";
            chrome.alarms.create("BLOCK", {delayInMinutes: 0.05});
            mr = ret.match(/^[\w]+:\/\/[^\/]+/);
            chrome.notifications.create(ext_name,{
              "type": "basic",
              "title": `${ext_name} Block!`,
              "message": (mr) ? mr[0] : ret
            });
            console.log(`${ext_name} Blocked ${ret}`);
          } else {
            console.log(`${ext_name} Warn! ${ret}`);
          }
          setOnOff();
        })
        .catch(err => {
          console.log(`${ext_name} ${err}`);
        })
      if (ext_state){
        return { cancel: true };
      }
    } catch (err) {
      console.log(`${ext_name} ${err}`);
    }
    return { cancel: false };
  },
  {urls:["<all_urls>"]},
  ["blocking"]
);

chrome.alarms.onAlarm.addListener((alarm) => {
  try{
    switch(alarm.name){
      case "BLOCK":
        chrome.alarms.clear("BLOCK");
        ext_badge = "";
        setOnOff();
        break;
      case "OFF":
        chrome.alarms.clear("OFF");
        if (!ext_state){
          ext_state = true;
          setOnOff();
        }
        console.log(`${ext_name} Resume blocking`);
        break;
      default:
        chrome.alarms.clearAll();
    }
  } catch (err) {
    console.log(`${ext_name} ${err}`);
  }
});

function setOnOff() {
  try{
    chrome.browserAction.setIcon({
      path: ext_state ? "icons/icon_on.svg" : "icons/icon_off.svg"
    });
    chrome.browserAction.setBadgeText({
      text: (ext_badge.length > 0) ? ext_badge : ext_state ? '' : 'Off'
    });
    chrome.browserAction.setTitle({
      // Screen readers can see the title
      title: ext_state ? `${ext_name} *On*` : `${ext_name} Off`
    }); 
  } catch (err) {
    console.log(`${ext_name} ${err}`);
  }
}

function toggleOnOff() {
  try{
    ext_state = ext_state ? false : true;
    if (!ext_state){
      chrome.alarms.create("OFF", {delayInMinutes: ext_delay});
    }
    console.log(`${ext_name} Toggle block status: ${ext_state}`);
    setOnOff();
  } catch (err) {
    console.log(`${ext_name} ${err}`);
  }
}

chrome.browserAction.onClicked.addListener(() => {
  toggleOnOff();
});

chrome.tabs.onUpdated.addListener(() => {
  try{
    setOnOff();
  } catch (err) {
    console.log(`${ext_name} ${err}`);
  }
});
