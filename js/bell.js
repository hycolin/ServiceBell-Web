$(document).ready(function() {
	init();

	var userId = $.cookie('userid');
	if (typeof(userId) === 'undefined' || userId == null) {
		alert('请先登录！');
		window.location('index.html');
		return;
	};
	var shopId = request('shopid');
	getRoom(userId, shopId);
});

function init() {
	$("body").append("<div id=\"background\" class=\"background\" style=\"display: none;\"></div> ");
	$("body").append("<div id=\"progressBar\" class=\"progressBar\" style=\"display: none; \">数据加载中，请稍等...</div> ");
};

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
var gRoomList = new Array();

function Room(roomId, roomName, userStatusList) {
	this.roomId = roomId;
	this.roomName = roomName;

	if (typeof(this.userStatusList) === 'undefined') {
		this.userStatusList = new Array();	
	} else {
		this.userStatusList = userStatusList;	
	}
};

function roomForId(roomId) {
	for (var i = 0; i < gRoomList.length; i++) {
		if (gRoomList[i].roomId == roomId) {
			return gRoomList[i];
		}
	};
	return null;
}

Room.prototype = {
	//响应服务铃
	responseBell: function() {
		for (var i = 0; i < this.userList.length; i++) {
			deleteUser(this.userList[i]);
		};
	},
	//增加一个房间
	appendRoom: function() {
		var roomId = this.roomId;
		var roomName = this.roomName;
		var room = "<div class='room' id='mainboard"+roomId+"'/>"
		var roomHeader = "<div class='titleHeader'>"+roomName+"</div>";
		var roomFooter = "<div class='roomFooter' id='roomFooter"+roomId+"'/>";
		var roomContent = "<div class='roomContent' id='"+roomId+"'/>";
		$("#mainboard").append(room);
		$("#mainboard"+roomId).append(roomHeader);
		$("#mainboard"+roomId).append(roomContent);
		$("#mainboard"+roomId).append(roomFooter);

		//footer
		$("#roomFooter"+roomId).append("<div class='roomFooterLabel' id='roomFooterLabel"+roomId+"'>当前在线：0人</div>");
		$("#roomFooter"+roomId).append("<div class='roomFooterButton'><div class='buttonDisabled' id='resBellButton"+roomId+"'><span>响应服务铃</span></div></div>");

		$("#resBellButton"+roomId).click(function() {
			// showLoading();
			// setTimeout("hideLoading()", 2000);
			// $(this).attr("class", "buttonDisabled");
		});

		if (roomId % 2 == 0) {
			$("#queuepanel").append($("<div class='queueitem0' id='queuepanel"+roomId+"'>"+roomName+"房间有人加水</div>"));	
		} else {
			$("#queuepanel").append($("<div class='queueitem1' id='queuepanel"+roomId+"'>"+roomName+"房间有人点单</div>"));	
		}
	},
	//更新房间状态
	updateRoomStatus: function(roomStatus) {
		this.userStatusList = roomStatus.userStatusList;

		for (var i = 0; i < this.userStatusList.length; i++) {
			var userStatus = this.userStatusList[i];
			var user = userStatus.user;
			var roomId = this.roomId;

			var userItem = "<div class='userItem"+(i%2)+"' id='userItem"+user.userId+""+roomId+"'/>";
			var avatar = "<img src='"+user.avatar+"'/>";
			var userName = "<div>"+user.nick+"</div>";
			var roomContentDocId = "#"+roomId+".roomContent";
			$(roomContentDocId).append(userItem);
			$("#userItem"+user.userId+""+roomId).append(avatar);
			$("#userItem"+user.userId+""+roomId).append(userName);
		};
		$("#roomFooterLabel"+roomId).text("当前在线："+this.userStatusList.length+"人");
	},
	//删除用户
	deleteUser: function(user) {

	}
};

function RoomStatus(roomId) {
  this.roomId = roomId;
  this.userStatusList = new Array();
};

function UserStatus(user, status) {
  this.user = user;
  this.status = status;
}

function User(userId, nick, avatar) {
  this.userId = userId;
  this.nick = nick;
  this.avatar = avatar;
}

// 获取房间列表
function getRoom(userId, shopId) {
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
				gRoomList[i] = new Room(roomJson['id'], roomJson['name']);
				gRoomList[i].appendRoom();
			};
			getRoomStatus(shopId);
		} else {
			alert('获取房间列表失败，请稍候重试!');	
		}
		hideLoading();
	}).fail(function(err) {
		alert('服务异常');
		hideLoading();
	});
}

function getRoomStatus(shopId) {
	$.ajax({
		url: "http://127.0.0.1:8888/getroomstatus?shopid=" + shopId,
		dataType: 'json'
	}).done(function(json) {
		if (json['success']) {
			var roomStatusList = json['roomstatuslist'];
			for (var i = 0; i < roomStatusList.length; i++) {
				var roomId = roomStatusList[i].roomId;
				var room = roomForId(roomId);
				room.updateRoomStatus(roomStatusList[i]);
			};
		} else {

		}
		// setTimeout(getRoomStatus(shopId), 2000);
	}).fail(function(err) {
		// setTimeout(getRoomStatus(shopId), 2000);
	});
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

function addOneUser(roomContentDocId, user, index) {
	var userItem = "<div class='userItem"+(index%2)+"' id='userItem"+user.userId+"'/>";
	var avatar = "<img src='"+user.avatar+"'/>";
	var userName = "<div>"+user.userName+"</div>"
	$(roomContentDocId).append(userItem);
	$("#userItem"+user.userId).append(avatar);
	$("#userItem"+user.userId).append(userName);
}

function test() {
	for (var i = 0; i < roomList.length - 1; i++) {
		var roomId = roomList[i].roomId.toString();
		var roomName = roomList[i].roomName + "房间";

		appendRoom(roomId, roomName);

		if (i % 2 == 0) {
			$("#queuepanel").append($("<div class='queueitem0' id='queuepanel"+roomId+"'>"+roomName+"</div>"));	
		} else {
			$("#queuepanel").append($("<div class='queueitem1' id='queuepanel"+roomId+"'>"+roomName+"</div>"));	
		}

		$("#queuepanel"+roomId).click(function() {
			var roomId = this.id.replace('queuepanel', '');
			var room;
			for (var i = roomList.length - 1; i >= 0; i--) {
				if (roomList[i].roomId == roomId) {
					room = roomList[i];
					break;
				}
			};
			if (room) {
				if (typeof room.checked === 'undefined') {
					room.checked = true;	
				} else {
					room.checked = !room.checked;
				}
				var mainboardRoomId = "#mainboard"+roomId;
				if (room.checked) {
					// $(mainboardRoomId).css("background", "red");	
					$(mainboardRoomId).animate({opacity:'0.2'},"normal");
    				$(mainboardRoomId).animate({opacity:'1.0'},"normal");
    				$(mainboardRoomId).animate({opacity:'0.2'},"normal");
    				$(mainboardRoomId).animate({opacity:'1.0'},"normal");
				} else {
					// $(mainboardRoomId).css("background", "#f1f2f3");
					$(mainboardRoomId).stop();	
				}
			};
		});
	}
	for (var j = 0; j < 3; j++) {
		addOneUser("#"+3+".roomContent", userList[j], j);	
	};

	for (var j = 0; j < 2; j++) {
		addOneUser("#"+1+".roomContent", userList[j], j);	
	};
}