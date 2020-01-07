const { desktopCapturer, ipcRenderer } = require("electron");

const constraints = {
  audio: true,
  video: {
    width: 1920,
    height: 1080
  }
};

const recordingOptions = {
  mimetype: "video/mp4",
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 250000
};

const startButton = document.querySelector("button#start");
const endButton = document.querySelector("button#stop");
const video = document.getElementById("localVideo");
const recordedVideoWindow = document.querySelector("video#recordedVideo");
const audioDeviceOption = document.querySelector("select#audioDeviceOption");
const videoDeviceOption = document.querySelector("select#videoDeviceOption");
let mediaRecorder;
let recorderedVideo = [];

const gotDevices = devices => {
  if (devices) {
    for (let i = 0; i < devices.length; i++) {
      var deviceInfo = devices[i];
      const deviceOption = document.createElement("option");
      deviceOption.innerHTML = deviceInfo.label;
      deviceOption.title = deviceInfo.label;
      deviceOption.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "audioinput") {
        audioDeviceOption.appendChild(deviceOption);
      }
      if (deviceInfo.kind === "videoinput") {
        videoDeviceOption.appendChild(deviceOption);
      }

      console.log("deviceinfo", deviceInfo);
    }
  }
};

navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch(err => console.log(err));

const handleSuccess = stream => {
  window.stream = stream;
  video.srcObject = stream;
  toggleCamera.style.display = "none";
};

const startRecordingVideo = () => {
  try {
    mediaRecorder = new MediaRecorder(window.stream, recordingOptions);
  } catch (err) {
    console.error(err);
  }
  mediaRecorder.onstop = event => {
    console.log("Recorder Stop: ", event);
  };
  mediaRecorder.ondataavailable = ({ data }) => {
    if (data.size > 0) {
      recorderedVideo.push(data);
      //console.log(recorderedVideo);
    }
  };
  mediaRecorder.start(10);
  console.log("Started Recording video", mediaRecorder);
};

const stopRecordingVideo = () => {
  mediaRecorder.stop();
  var videoBlob = new Blob(recorderedVideo, { type: "video/mp4;" });
  alert("Stopped Recording Video");
  recordedVideoWindow.src = window.URL.createObjectURL(videoBlob);
  //   recordedVideoWindow.style.display = "block";
};

startButton.addEventListener("click", () => {
  if (startButton.textContent === "Start") {
    startRecordingVideo();
    startButton.disabled = true;
    startButton.textContent = "Recording....";
  }
});

endButton.addEventListener("click", () => {
  if (endButton.textContent === "End") {
    stopRecordingVideo();
    startButton.disabled = false;
    startButton.textContent = "Start";
  }
});

//init

const toggleCamera = document.querySelector("button#toggleCamera");

//onchange constraints setting up for selected audio/video device

var mediaConstraints = {};

audioDeviceOption.addEventListener("change", event => {
  //alert(`You have Selected audio Device : ${event.target.innerText}`);
  //console.log(event);
  mediaConstraints = { ...mediaConstraints, audio: { deviceId: event.target.value ? { exact: event.target.value } : undefined } };
});

videoDeviceOption.addEventListener("change", event => {
  //alert(`You have Selected video Device : ${event.target.innerText}`);
  mediaConstraints = { ...mediaConstraints, video: { deviceId: event.target.value ? { exact: event.target.value } : undefined } };
});

const init = () => {
  navigator.mediaDevices
    .getUserMedia(toggleCamera.textContent === "Open Camera" ? constraints : mediaConstraints)
    .then(
      toggleCamera.textContent === "Open Camera"
        ? handleSuccess
        : stream => {
            stream.getTracks().forEach(function(track) {
              track.stop();
            });
            video.srcObject = null;
          }
    )
    .then(gotDevices)
    .catch(err => {
      console.log(`navigator getUserMedia Error `, err);
    });
};

toggleCamera.addEventListener("click", init);

//screen sharing

const screenShareButton = document.querySelector("button#screenCapture");
let sourceIDScreen = null;
let screenStream;
let screenMediaRecord;

ipcRenderer.on("source-id-selected", (event, sourceId) => {
  // Users have cancel the picker dialog.
  if (!sourceId) return;
  console.log(sourceId);
  sourceIDScreen = sourceId;
  startRecordingScreen(sourceIDScreen);
});

const recordWindow = () => {
  ipcRenderer.send("show-picker", { types: ["screen"] });
};

const successRecordStream = stream => {
  screenStream = stream;
  screenMediaRecord = new MediaRecorder(screenStream, { mimetype: "video/webm" });
  screenStream.addEventListener("inactive", () => {
    stopRecordingScreen();
    screenMediaRecord.stop();
    alert("Screen capturing Stopped");
  });

  screenMediaRecord.ondataavailable = ({ data }) => {
    if (data.size > 0) {
      recorderedVideo.push(data);
      console.log(data);
    }
  };
  screenMediaRecord.start(10);
};

const startCapturingScreen = async sourceID => {
  desktopCapturer.getSources({ types: ["window", "screen"] }, (_ignore, sources) => {
    for (const source of sources) {
      console.log(source);
      if (source.name === "Entire screen") {
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
          })
          .then(stream => successRecordStream(stream))
          .catch(e => {
            console.log(e);
          });
      }
    }
  });
};

const startRecordingScreen = sourceID => {
  startCapturingScreen(sourceID);
};

const stopRecordingScreen = () => {
  screenStream.getVideoTracks()[0].stop();
  screenStream = null;
  screenMediaRecord.stop();
  var screenRecorderedBlob = new Blob(recorderedVideo, { type: "video/webm" });
  recordedVideoWindow.src = window.URL.createObjectURL(screenRecorderedBlob);
};

screenShareButton.addEventListener("click", recordWindow);
