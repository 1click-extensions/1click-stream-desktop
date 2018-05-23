// var connection = new WebSocket('ws://127.0.0.1:5000');

//   connection.onopen = function () {
//     // connection is opened and ready to use
//   };

//   connection.onerror = function (error) {
//     // an error occurred when sending/receiving data
//   };
//   var urlCreator = window.URL || window.webkitURL,
//     imageInner = document.querySelector("#image");
//   connection.onmessage = function (message) {
//     console.log(message.data);
    
//    var imageUrl = urlCreator.createObjectURL(message.data);
//    if(imageUrl!= imageInner.src){

//     imageInner.src = imageUrl;
//    }
//     // handle incoming message
//   };

  // function toDataURL(url, callback) {
  //   var xhr = new XMLHttpRequest();
  //   xhr.onload = function() {
  //     var reader = new FileReader();
  //     reader.onloadend = function() {
  //       callback(reader.result);
  //     }
  //     reader.readAsDataURL(xhr.response);
  //   };
  //   xhr.open('GET', url);
  //   xhr.responseType = 'blob';
  //   xhr.send();
  // }
streamer = {
    private : null,
    public : null,
    isStreaming : false,
    url : 'http://127.0.0.1:2632/live-stream',
    startVideo : function(callback){
        chrome.desktopCapture.chooseDesktopMedia(['screen'],function(streamId, options) {
           navigator.mediaDevices.getUserMedia({
           audio: false,
           video: {
               mandatory: {
               chromeMediaSource: 'desktop',
               chromeMediaSourceId: streamId,
               maxWidth: window.screen.width,
               maxHeight: window.screen.height
               }
           }
           })
           .then(stream => {
               player = document.getElementById('video');
               console.log(player,'player2');
                player.srcObject = stream;
                player.addEventListener("canplaythrough", function() {
                    console.log(player.videoWidth,player.videoHeight,'player.width,player.height')
                    canvas.width = player.videoWidth;
                    canvas.height = player.videoHeight;
                    callback();
                });
           })
       .catch(console.error);
       });
   },
   tryToStartVideo :function(){
       let startStreaming = function(){
        streamer.startVideo(function(){
            streamer.startStreaming();
        }); 
       }
       if(streamer.isCapturing){
        startStreaming();
       }
       else{
        chrome.permissions.contains({
            permissions: ['tabs'],
            origins: ['http://www.google.com/']
          }, function(result) {
            if (result) {
                streamer.isCapturing = true;
                startStreaming();
            } else {
                chrome.permissions.request({
                    permissions: ['desktopCapture']
                  }, function(granted) {
                    // The callback argument will be true if the user granted the permissions.
                    if (granted) {
                        streamer.isCapturing = true;
                        startStreaming();
                    } else {
                        $(showLink).html('<p>' + chrome.i18n.getMessage("we_need_permissions") + '</p>');
                    }
                  });
            }
          });
       }
       
   },
    streamStep : function(){
        console.log('player', player, context)
        context.drawImage(player, 0, 0, canvas.width, canvas.height);

        //streamer.streamStepFire(canvas.toDataURL('image/png'));
        

        streamer.streamStepFire(canvas.toDataURL('image/jpg'));
        // canvas.toBlob(function(blob){
        //         var url = URL.createObjectURL(blob);
        //         console.log('url', blob);

        // },'image/png');
        
    },
    streamStepFire : function(url){
        streamer.lastStreamed = new Date().getTime();
        streamer.callPostAjax({
            action : 'upadte channel',
            private:streamer.private,
            public:streamer.public,
            data :url
        }, streamer.afterStreamStep/*,"application/x-www-form-urlencoded",true*/);
    },
    afterStreamStep : function(data){
        if(data.status && streamer.isStreaming){
            let nextTime = 300 - (new Date().getTime() - streamer.lastStreamed);
            setTimeout(function(){
                streamer.streamStep();
            }, Math.max(nextTime , 0 ));
        }
    },
    callPostAjax : function(data,cb){
        //contentType = contentType ? contentType : 'application/json; charset=utf-8';
        $.ajax({
            url: streamer.url,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            success: cb
        });
    },
    stopStreaming : function(){
        captureButton.innerText = chrome.i18n.getMessage("start_stream");
        streamer.isStreaming = false;
    },
    startStreaming : function(){
        captureButton.innerText = chrome.i18n.getMessage("stop_stream");
        streamer.isStreaming = true;
        streamer.openChannel(function(){
            streamer.streamStep();
        });
        
        
        
    },
    openChannel : function(callback){
        streamer.callPostAjax({action:'start channel'}, function(data){
            if(data.status){
                let link = 'http://127.0.0.1:2632/live-stream-live/' + data.public;
                //console.log('showLink',showLink,link);
                //var aTag = $('<a>').attr('href',link).appendTo(showLink)
                $(showLink).html('<p><div class="label">' + chrome.i18n.getMessage("your_link") + '</div><a href="' +link+ '" target="_blank">' +link + '</a></p>');
                //console.log(divStr);
                //showLink.innerHtml = divStr;  
                streamer.private = data.private;
                streamer.public = data.public;
                callback();
            }
        });
    }
}

  localstream = null;
  isStreaming = false;
  captureButton = document.getElementById('capture');
  showLink = document.getElementById('show-link');
  player = null;
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  h2 = document.getElementById('h2');
  h2.innerText = chrome.i18n.getMessage("h2_title");
  captureButton.innerText = chrome.i18n.getMessage("start_stream");



//   GumHelper.startVideoStreaming(function callback(err, stream, videoElement, width, height) {
//     if(err) {
//       errorDiv = document.getElementById('error');
//       errorDiv.classList.add('visible');
//     } else {
       
//         player = videoElement;
//         videoElement.id = 'vid';
//         document.getElementsByClassName('video-wrp-inner')[0].appendChild(videoElement);
//         canvas.width = width;
//         canvas.height = height;
//         // (or you could just keep a reference and use it later)
//     }
//   }, { timeout: 20000 });

  captureButton.addEventListener('click', () => {
      if(streamer.isStreaming){
        streamer.stopStreaming();
      }
      else{
        streamer.tryToStartVideo();
        
      }

  });
  




// callPostAjax({action:'start channel'}, function(data){
//     console.log(data)
//     var pr = data.private;
// setInterval(()=>{
// var size1 = 100+ Math.floor(Math.random() * 200),
// size3 = 100+Math.floor(Math.random() * 250)
//     toDataURL('https://picsum.photos/' + size1 + '/' + size3, function(dataUrl) {
//         callPostAjax({
//             action : 'upadte channel',
//             private:pr,
//             public:data.public,
//             data :dataUrl
//         })
//     });
// },2000)
// })
  