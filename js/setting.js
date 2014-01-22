var gShopId;
$(document).ready(function() {
	init();
	gShopId = request('shopid');
	if (gShopId == null || gShopId.length == 0) {
		alert('该商户不存在!请尝试重新登录');
		window.location = 'index.html';
		return;
	};
	getRoom(gShopId);
});

function init() {
	$("body").append("<div id=\"background\" class=\"background\" style=\"display: none;\"></div> ");
	$("body").append("<div id=\"progressBar\" class=\"progressBar\" style=\"display: none; \">数据加载中，请稍等...</div> ");
};

function save() {
}

function request(paras) { 
    var url = location.href; 
    var paraString = url.substring(url.indexOf("?")+1,url.length).split("&"); 
    var paraObj = {} 
    for (i = 0; j = paraString[i]; i++){ 
    	paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length); 
    } 
    var returnValue = paraObj[paras.toLowerCase()]; 
    if(typeof(returnValue) == "undefined"){ 
    	return ""; 
    } else { 
    	return returnValue; 
    } 
};

// 获取房间列表
function getRoom(shopId) {
	$.ajax({
		url: "http://127.0.0.1:8888/getroom?shopid=" + shopId,
		dataType: 'json',
		beforeSend: function() {
			showLoading();
		}
	}).done(function(json) {
		if (json['success']) {
			var roomListJson = json['roomlist'];	
			for (var i = 0; i < roomListJson.length; i++) {
				var roomJson = roomListJson[i];
				var roomId = roomJson['id'];
				var roomName = roomJson['name'];
				buildQRCode(roomId,roomName);
			};
		} else {
			alert('获取房间列表失败，请稍候重试!');	
		}
		hideLoading();
	}).fail(function(err) {
		alert('服务异常');
		hideLoading();
	});
}

function buildQRCode(roomId, roomName) {
	var room = "<div class='room' id='mainboard"+roomId+"'/>"
	var roomHeader = "<div class='titleHeader'>"+roomName+"</div>";
	var roomFooter = "<div class='roomFooter' id='roomFooter"+roomId+"'/>";
	var roomContent = "<div class='roomContent' id='"+roomId+"'/>";
	$("#mainboard").append(room);
	$("#mainboard"+roomId).append(roomHeader);
	$("#mainboard"+roomId).append(roomContent);

	var roomContentDocId = "#"+roomId+".roomContent";
	$(roomContentDocId).qrcode({width:140,height:140,text: gShopId+","+roomId});
}

function showLoading() {
	var loading = $("#background,#progressBar");
	if (loading.length == 0) {
		$("body").append("<div id=\"background\" class=\"background\" style=\"display: none;\"></div> ");
		$("body").append("<div id=\"progressBar\" class=\"progressBar\" style=\"display: none; \">数据加载中，请稍等...</div> ");
	};
	loading.show(); 	
}

function hideLoading() {
	var loading = $("#background,#progressBar");
	loading.hide();
}