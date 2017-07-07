function isChrome() {
  var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

  if(isIOSChrome){
    return true;
  } else if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
    return true;
  } else {
    return false;
  }
}

function gotoListeningState() {
  const micListening = document.querySelector(".mic .listening");
  const micReady = document.querySelector(".mic .ready");

  micListening.style.display = "block";
  micReady.style.display = "none";
}

function gotoReadyState() {
  const micListening = document.querySelector(".mic .listening");
  const micReady = document.querySelector(".mic .ready");

  micListening.style.display = "none";
  micReady.style.display = "block";
}

function addBotItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-bot"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function addUserItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-user"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function displayCurrentTime() {
  const timeContent = document.querySelector(".time-indicator-content");
  const d = new Date();
  const s = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  timeContent.innerHTML = s;
}

function addError(text) {
  addBotItem(text);
  const footer = document.querySelector(".app-footer");
  footer.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function(event) {

  displayCurrentTime();

  // check for Chrome
  if (!isChrome()) {
    addError("This demo only works in Google Chrome.");
    console.log("not chrome");
    return;
  }

  // api.ai client
  const apiClient = new ApiAi.ApiAiClient({accessToken: '329dcb8e2a8f4876acbf7fb616978686'});

  if ('speechSynthesis' in window) {
    // console.log("can talk");

    // var msg = new SpeechSynthesisUtterance("Hello. Say something.");
    // msg.addEventListener("end", function(ev) {
    //   console.log("speech ended");
    // });
    // window.speechSynthesis.speak(msg);

    // Synthesis support. Make your web apps talk!
  } else {
    addError("Your browser cannot synthesize speech. This demo probably won’t work well.");
    console.log("cannot talk");
  }

  if ('webkitSpeechRecognition' in window) {
    console.log("can listen");
    // Speech recognition support. Talk to your apps!

    // looks like good to go. add the initial feedback message.
    addBotItem("Hi! I’m voicebot. Tap the microphone and start talking to me.");

    var recognition = new webkitSpeechRecognition();
    var recognizedText = null;
    recognition.continuous = false;
    recognition.onstart = function() {
      console.log("recognition start");
      recognizedText = null;
    };
    recognition.onresult = function(ev) {
      recognizedText = ev["results"][0][0]["transcript"];

      // console.log("recognition result", ev);
      console.log("clean result", recognizedText);
      addUserItem(recognizedText);

      let promise = apiClient.textRequest(recognizedText);

      promise
          .then(handleResponse)
          .catch(handleError);

      function handleResponse(serverResponse) {

              // set a timer just in case. so if there was an error speaking or whatever, there will at least be a prompt to continue
              var timer = window.setTimeout(function() { startListening(); }, 5000);

              console.log(serverResponse);
              const speech = serverResponse["result"]["fulfillment"]["speech"];
              console.log("response", speech);
              var msg = new SpeechSynthesisUtterance(speech);
              addBotItem(speech);
              msg.addEventListener("end", function(ev) {
                console.log("speaking the response ended");
                window.clearTimeout(timer);
                startListening();
              });
              msg.addEventListener("error", function(ev) {
                window.clearTimeout(timer);
                startListening();
                console.log("error speaking", ev);
              });

              window.speechSynthesis.speak(msg);
      }
      function handleError(serverError) {
              console.log(serverError);
      }

    };
    recognition.onerror = function(ev) {
      console.log("recognition error", ev);
    };
    recognition.onend = function() {
      gotoReadyState();
      console.log("recognition end");
      if (!recognizedText) {
        console.log("did not receive any text. should let user continue conversation.");
        gotoReadyState();
      }
    };

    function startListening() {
      console.log("starting to listen");
      gotoListeningState();
      recognition.start();
    }

    const startButton = document.querySelector("#start");
    startButton.addEventListener("click", function(ev) {
      console.log("klikk");
      startListening();
      ev.preventDefault();
    });

    // Esc key handler - cancel listening if pressed
    // http://stackoverflow.com/questions/3369593/how-to-detect-escape-key-press-with-javascript-or-jquery
    document.addEventListener("keydown", function(evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ("key" in evt) {
          isEscape = (evt.key == "Escape" || evt.key == "Esc");
      } else {
          isEscape = (evt.keyCode == 27);
      }
      if (isEscape) {
          recognition.abort();
      }
    });


  } else {
    addError("Your browser cannot record voice. This demo won’t work.");
    console.log("cannot listen");
  }

});
