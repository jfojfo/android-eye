//////////////////////////////////////////////
// Global variable define
//////////////////////////////////////////////
var planeWidth = 0;
var planeHeight = 0;
var basicURL = "";
var inStreaming = false;
var picCount = 0;

var audioAPI;
var audioCount = 0;
var audioPlayer;

function CameraSize () {
    this.width = 0;
    this.height = 0;
}
var supportedSize = new Array();
var currentSize = new CameraSize();

var imageDelay = 30;
var timer = null;
var TIMEOUT = 5000;

//////////////////////////////////////////////
// Global function define
//////////////////////////////////////////////
var onImageLoadResult = function(loaded, total, success) {
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }
    console.log("result for ", this.src);
    var num = picCount.toString();
    if (this.src.match(num+"$")!=num) {
        console.log("=====>already timeout: " + this.src);
        return;
    }
    if (success) {
        onImageLoadOK();
    } else {
        onImageLoadError();
    }
};
var onImageLoadOK = function() {
    console.log("img load ok");
    var wid = 0;
    var hei = 0;
    if ( planeHeight * currentSize.width / currentSize.height > planeWidth) {
        wid = planeWidth;
        hei = math.round(planeWidth * currentSize.height / currentSize.width); 
    } else {
        hei = planeHeight;
        wid = planeHeight * currentSize.width / currentSize.height;  
    }
    $("#live_image").width(wid);
    $("#live_image").height(hei);

    var newDelay = imageDelay / 2;
    if (newDelay >= 30)
        imageDelay = newDelay;
    if ( inStreaming == true)
        setTimeout(refreshLive, imageDelay);  
};

var onImageLoadError = function() {
    console.log("img load error");
    var newDelay = imageDelay * 2;
    if (newDelay > 1000)
        return;
    imageDelay = newDelay;
};

var onQueryDone = function (ret) {
    $("#btn_play").button('enable');
    
    $("#resolution-choice").empty();
    var resList = ret.split("|");
    currentSize.width = resList[0].split("x")[0];
    currentSize.height = resList[0].split("x")[1];
    var currentSelect = -1;
    for(var i = 1; i < resList.length; i++) {
        var res = resList[i].split("x");
        var newRes = new CameraSize();
        newRes.width = res[0];
        newRes.height = res[1];    
        supportedSize.push(newRes);
        if ( newRes.width == currentSize.width  && newRes.height == currentSize.height) {
            currentSelect = i;
            var newOption = "<option value='" + (i-1) + "'>" + resList[i] + "</option>";
            $("#resolution-choice").append(newOption);
        }
    }
    for(var i = 1; i < resList.length; i++) {
        if ( currentSelect != i) {
            var newOption = "<option value='" + (i-1) + "'>" + resList[i] + "</option>";
            $("#resolution-choice").append(newOption);
        }
    }
    $("#resolution-choice").selectmenu('refresh');
    $("#resolution-choice").bind("change", doChangeRes);  

    $("#debug_msg").html("Connected");

    changeImageWH(currentSize.width, currentSize.height);
};

var onHttpError = function () {
    $("#debug_msg").html("Can't connected with phone, please refresh web page!");   
    $("#btn_play").button('disable'); 
};

function getFunc(f, arg) {
    return function() {
        return f(arg);
    }
}
var refreshLive = function() {
    picCount = picCount + 1;
    $("#live_image").attr("src", basicURL + "stream/live.jpg?id=" + picCount);
    $("#video_plane").waitForImages(null, onImageLoadResult );
    timer = setTimeout(getFunc(function(picId){
        console.log("====>timeout: " + picId);
        if ( inStreaming == true)
            refreshLive();  
    }, picCount), TIMEOUT);
    console.log("picCount:" + picCount + ", delay:" + imageDelay);
};

var playClick = function () {
    if  ( inStreaming == false) {
        inStreaming = true;
        $("#btn_play").val("Stop").button("refresh");
        $("#resolution-choice").selectmenu("disable");
        $("#checkbox-audio").checkboxradio('disable');
        
        refreshLive();

        if ( $("#checkbox-audio").is(":checked") ) {
            var newClip = {'url':'stream/live.mp3?id='+audioCount,'autoplay':true};
            audioCount ++;
            audioPlayer.play(newClip);
        }
    } else {
        inStreaming = false;
        $("#btn_play").val("Play").button("refresh");
        $("#resolution-choice").selectmenu("enable");
        $("#checkbox-audio").checkboxradio('enable');
        audioPlayer.stop();
        audioPlayer.close();
    }
};

var onSetupOK = function() {
    var targetIndex = $("#resolution-choice").val();
    currentSize = supportedSize[targetIndex]; 
};

function changeImageWH(width, height) {
    planeHeight = height;
    planeWidth = width;
    $("#video_plane").width(planeWidth);
    $("#video_plane").height(planeHeight);
    $("#live_image").width(planeWidth);
    $("#live_image").height(planeHeight);
    $("#player").width(planeWidth);
    //$("#player").height(hei);
}
var doChangeRes = function () {
    var targetIndex = $("#resolution-choice").val();
    var wid = supportedSize[targetIndex].width;
    var hei = supportedSize[targetIndex].height; 
    changeImageWH(wid, hei);
    $.ajax({
        type: "GET",
        url: basicURL + "cgi/setup",
        cache: false,
        data: "wid=" + wid + "&hei=" + hei,
        success: onSetupOK
    });
};

var initAudioPlayer = function () {
    // install flowplayer into container
    // http://flash.flowplayer.org/

    $f("player", "flowplayer-3.2.15.swf", {
        plugins: {
            controls: {
                fullscreen: false,
                height: 30,
                autoHide: false,
                play: false,
            }
        },
        clip: {
            autoPlay: false,
            url: "stream/live.mp3",
        }
    });

    audioPlayer = $f();
};

$("#page_main").live("pageinit", function() {
    basicURL = $(location).attr('href');
        
    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    planeHeight = Math.round( screenHeight * 0.5);
    planeWidth = Math.round( screenWidth * 0.80);

    $("#video_plane").height(planeHeight);
    $("#video_plane").width(planeWidth);

    $("#btn_play").button('disable');
    $("#btn_play").bind("click", playClick);
    
    initAudioPlayer();

    $.ajax({
        type: "GET",
        url: basicURL + "cgi/query",
        cache: false,
        error: onHttpError,
        success: onQueryDone
    });
});

//////////////////////////////////////////////
// Top level code define
//////////////////////////////////////////////
$(document).ready(function(){

});

