onmessage = function (evt) {
    console.log(evt);
    setTimeout(function(){
        postMessage('now');
        }, evt.data)
};