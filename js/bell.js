var gShopId;
$(document).ready(function() {
	init();

	var userId = $.cookie('userid');
	if (typeof(userId) === 'undefined' || userId == null) {
		alert('请先登录！');
		window.location = 'index.html';
		return;
	};
	gShopId = request('shopid');
	if (gShopId == null || gShopId.length == 0) {
		alert('该商户不存在!请尝试重新登录');
		window.location = 'index.html';
		return;
	};
	getRoom(userId, gShopId);

	clearTimeout();
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

function logout() {
	$.cookie('userid', null);
	window.location = 'index.html';
}

function setting() {
	window.open('setting.html?shopid='+gShopId);	
}

var gRoomList = new Array();
var gBellQueue = new BellQueue();

function Room(roomId, roomName, roomStatus, userStatusList) {
	this.roomId = roomId;
	this.roomName = roomName;
	this.roomStatus = roomStatus;
	if (roomStatus == null) {
		this.roomStatus = 0;
	};
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
	responseBell: function(userId) {
		$.ajax({
			url: "http://127.0.0.1:8888/responsebell?shopid=" + gShopId + "&roomid=" + this.roomId + (userId!=null&&userId.length>0?"&userid="+userId:""),
			dataType: 'json',
			beforeSend: function() {
				showLoading();
			}
		}).done(function(json) {
			if (json['success']) {
				var roomId = json['roomid'];
				var room = getRoomForId(roomId);

				$("#resBellButton"+roomId).attr("class", "buttonDisabled");
				var msg = new Message(null, room);
				gBellQueue.deleteMessage(msg);
				getRoomStatus(gShopId);
			} else {
				alert('操作失败，请稍候重试!');	
			}
			hideLoading();
		}).fail(function(err) {
			alert('服务异常，请稍候重试!');
			hideLoading();
		});
	},
	clearRoom: function() {
		$.ajax({
			url: "http://127.0.0.1:8888/clearroom?shopid=" + gShopId + "&roomid=" + this.roomId,
			dataType: 'json',
			beforeSend: function() {
				showLoading();
			}
		}).done(function(json) {
			if (json['success']) {
				var roomId = json['roomid'];
				var room = getRoomForId(roomId);

				$("#closeRoomButton"+roomId).attr("class", "buttonDisabled");
				var msg = new Message(null, room);
				gBellQueue.deleteMessage(msg);
				room.updateRoomStatus(null);
				getRoomStatus(gShopId);
			} else {
				alert('操作失败，请稍候重试!');	
			}
			hideLoading();
		}).fail(function(err) {
			alert('服务异常，请稍候重试!');
			hideLoading();
		});
	},
	//增加一个房间
	appendRoom: function() {
		var roomId = this.roomId;
		var roomName = this.roomName;
		var roomStatus = this.roomStatus;
		var room = "<div class='room' id='mainboard"+roomId+"'/>"
		var roomHeader = "<div class='titleHeader'>"+roomName+"</div>";
		var roomFooter = "<div class='roomFooter' id='roomFooter"+roomId+"'/>";
		var roomContent = "<div class='roomContent' id='"+roomId+"'/>";
		$("#mainboard").append(room);
		$("#mainboard"+roomId).append(roomHeader);
		$("#mainboard"+roomId).append(roomContent);
		$("#mainboard"+roomId).append(roomFooter);

		var roomContentDocId = "#"+roomId+".roomContent";
		if (roomStatus == 1) {  //预定
			$(roomContentDocId).css('background', 'rgb(233, 216, 162)');
			$(roomContentDocId).append("<img src='images/roomstatus/status_book.gif'/>");
		} else if (roomStatus == 2) { //暂停
			$(roomContentDocId).css('background', 'rgb(182, 179, 176)');
			$(roomContentDocId).append("<img src='images/roomstatus/status_pause.gif'/>");
		} else { //无人
			$(roomContentDocId).css('background', 'rgb(219, 228, 215)');
		}

		//footer
		$("#roomFooter"+roomId).append("<div class='roomFooterLabel' id='roomFooterLabel"+roomId+"'>当前在线：0人</div>");
		$("#roomFooter"+roomId).append("<div class='roomFooterButton'><div class='buttonDisabled' id='closeRoomButton"+roomId+"'><span>清空</span></div></div>");
		$("#roomFooter"+roomId).append("<div class='roomFooterButton'><div class='buttonDisabled' id='resBellButton"+roomId+"'><span>全部响应</span></div></div>");

		$("#resBellButton"+roomId).click(function() {
			if ($(this).attr('class') == 'buttonDisabled') {
				return;
			}
			var roomId = this.id.replace('resBellButton', '');
			var room = getRoomForId(roomId);
			if (room) {
				room.responseBell();
			}
		});

		$("#closeRoomButton"+roomId).click(function() {
			if ($(this).attr('class') == 'buttonDisabled') {
				return;
			}
			var roomId = this.id.replace('closeRoomButton', '');
			var room = getRoomForId(roomId);
			if (room) {
				room.clearRoom();
			}
		});


	},
	findUser: function(userStatusList, user) {
		if (userStatusList == null) {
			return false;
		};
		for (var i = 0; i < userStatusList.length; i++) {
			var userStatus = userStatusList[i];
			if (userStatus.user.userId == user.userId) {
				return true;
			};
		}
		return false;
	},
	findUserStatus: function(userId) {
		if (this.userStatusList == null) {
			return null;
		};
		for (var i = 0; i < this.userStatusList.length; i++) {
			var userStatus = this.userStatusList[i];
			if (userStatus.user.userId == userId) {
				return userStatus;
			};
		}
		return null;
	},
	//更新房间状态
	updateRoomStatus: function(roomStatus) {
		if (this.roomStatus == 1 || this.roomStatus == 2) {
			this.userStatusList.splice(0, this.userStatusList.length);
			return;
		};
		var roomContentDocId = "#"+this.roomId+".roomContent";
		if (roomStatus == null) { //已清空房间
			this.userStatusList.splice(0, this.userStatusList.length);
			$(roomContentDocId).empty();
		};
		var shouldUpdateServiceBell = false;
		if (roomStatus != null && roomStatus.userStatusList != null) {
			//清除已经退出房间的客人
			for (var i = 0; i < this.userStatusList.length; i++) {
				var userStatus = this.userStatusList[i];
				var user = userStatus.user;
				var roomId = this.roomId;
				if (!this.findUser(roomStatus.userStatusList, user)) {
					this.userStatusList.splice(i, 1);
					var userItemId = "#userItem"+user.userId+""+roomId;
					$(userItemId).remove();
				};
			}

			for (var i = 0; i < roomStatus.userStatusList.length; i++) {
				var userStatus = roomStatus.userStatusList[i];
				var user = userStatus.user;
				var status = userStatus.status;	
				var roomId = this.roomId;

				if (!this.findUser(this.userStatusList, user)) { //新用户
					this.userStatusList.push(userStatus);

					userStatus.userItemDivId = "userItem-u"+user.userId + "-r"+roomId;

					var userItem = "<div class='userItem"+(i%2)+"' id='"+userStatus.userItemDivId+"'/>";
					var avatarDiv = "<img id='userItemAvatar-u"+user.userId+"-r"+roomId+"'" + "/>";
					var userNameDiv = "<div id='userItemName-u"+user.userId+"-r"+roomId+"'></div>";
					
					$(roomContentDocId).append(userItem);

					$("#"+userStatus.userItemDivId).append(avatarDiv);
					$("#"+userStatus.userItemDivId).append(userNameDiv);

					$("#"+userStatus.userItemDivId).mouseenter(function() {
						var arr = this.id.match(/\d+/g);
						if (arr == null || arr.length !=2 ) {
							return;
						};
						var userId = arr[0];
						var roomId = arr[1];
						var room = getRoomForId(roomId);
						var userStatus = room.findUserStatus(userId);
						if (userStatus.status != null && userStatus.status != '无') {
							$(this).append("<a style='position:absolute; right:20px; height:100%;margin-top: 3px;' class='button' id='resBellButton-u"+userId+"-r"+roomId+"'><span>响应</span></a>");

							$("#resBellButton-u"+userId+"-r"+roomId).click(function() {
								var arr = this.id.match(/\d+/g);
								if (arr == null || arr.length !=2 ) {
									return;
								};
								var userId = arr[0];
								var roomId = arr[1];
								var room = getRoomForId(roomId);
								if (room) {
									$(this).remove();
									room.responseBell(userId);
								}
							});
						};
						$(this).css('background', 'rgba(240, 240, 240, 0.4)');
					});
					$("#"+userStatus.userItemDivId).mouseleave(function() {
						var arr = this.id.match(/\d+/g);
						if (arr == null || arr.length !=2 ) {
							return;
						};
						var userId = arr[0];
						var roomId = arr[1];
						$("#resBellButton-u"+userId+"-r"+roomId).remove();
						$(this).css('background', 'transparent');
					});
				} else {
					var curUserStatus = this.findUserStatus(user.userId);
					if (curUserStatus.status != status) {
						curUserStatus.status = status;
						if (status != null && status.length > 0 && status != '无') {
							notifyWav();
							for (var i = 0; i < 2; i++) {
								$("#"+curUserStatus.userItemDivId).animate({backgroundColor:'rgb(233, 100, 100)'}, "normal");	
								$("#"+curUserStatus.userItemDivId).animate({backgroundColor:'transparent'}, "fast");		
							};
						}
					}
				}
				var avatarDivId = "#userItemAvatar-u"+user.userId+"-r"+roomId;
				$(avatarDivId).attr('src', user.avatar);
				var userNameDivId = "#userItemName-u"+user.userId+"-r"+roomId;
				if (status == null || status.length == 0 ||status == '无') {
					$(userNameDivId).text(user.nick);	
				} else {
					$(userNameDivId).text(user.nick + "["+status+"]");	
				}
				
				if (status != null && status.length > 0 && status != '无') {
					shouldUpdateServiceBell = true;
				}
			};
		};

		if (this.userStatusList.length > 0) {
			$(roomContentDocId).css('background', 'rgb(240, 177, 171)');
		} else {
			$(roomContentDocId).css('background', 'rgb(219, 228, 215)');
		}

		$("#roomFooterLabel"+this.roomId).text("当前在线："+this.userStatusList.length+"人");
		
		if (this.userStatusList.length > 0) {
			$("#closeRoomButton"+this.roomId).attr('class','button');
		} else {
			$("#closeRoomButton"+this.roomId).attr('class','buttonDisabled');
		}

		if (shouldUpdateServiceBell) {
			var msg = new Message('客人按了服务铃', this);
			gBellQueue.addMessage(msg);
			$("#resBellButton"+this.roomId).attr('class','button');
		} else {
			$("#resBellButton"+this.roomId).attr('class','buttonDisabled');
		}
	},
	//删除用户
	deleteUser: function(user) {

	}
};

function notifyWav() {
	$('embed').remove(); 
	$('body').append('<embed src="audio/notify.wav" autostart="true" hidden="true" loop="false">');
	// setTimeout('hideNotifyWav()', 1);
}

function hideNotifyWav() {
	$('embed').remove(); 
}

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

function BellQueue() {
	this.msgList = new Array();
}

function Message(content, room) {
	this.content = content;
	this.room = room;
}

//添加一个消息
BellQueue.prototype.addMessage = function(msg) {
	var index = this.findMessage(msg);
	if (index == -1) {
		this.msgList.push(msg);
		this.refreshUI();
	};
};
//删除一个消息
BellQueue.prototype.deleteMessage = function(msg) {
	var index = this.findMessage(msg);
	if (index == -1) {
		return;
	};
	this.msgList.splice(index, 1);
	this.refreshUI();
};
//查找某个消息，同一个房间的消息合并为一条
BellQueue.prototype.findMessage = function(msg) {
	for (var i = 0; i < this.msgList.length; i++) {
		var temp = this.msgList[i];
		if (temp.room.roomId == msg.room.roomId) {
			return i;
		};
	};
	return -1;
};
//渲染界面
BellQueue.prototype.refreshUI = function() {
	$("#queueContent").empty();
	for (var i = 0; i < this.msgList.length; i++) {
		var msg = this.msgList[i];
		var content = msg.content;
		var roomId = msg.room.roomId;
		var roomName = msg.room.roomName;
		$("#queueContent").append($("<div id='queueContent"+roomId+"'>"+roomName+"房间"+content+"</div>"));	
		if (i % 2 == 0) {
			$("#queueContent"+roomId).addClass('queueitem0');
		} else {
			$("#queueContent"+roomId).addClass('queueitem1');
		}

		$("#queueContent"+roomId).click(function() {
			var roomId = this.id.replace('queueContent', '');
			var room = getRoomForId(roomId);
			if (room) {
				var mainboardRoomId = "#mainboard"+roomId;
				var roomContentDocId = "#"+roomId+".roomContent";
				var oriBorderColor = $(mainboardRoomId).css('border-color');
				var oriBackgroundColor = $(roomContentDocId).css('background-color');
				var newColor = 'rgba(240, 0, 240, 0.4)';
				$(mainboardRoomId).stop();
				$(roomContentDocId).stop();
				$(mainboardRoomId).animate({borderColor: newColor},"normal");
				$(roomContentDocId).animate({backgroundColor: newColor}, "normal");
				$(mainboardRoomId).animate({borderColor: oriBorderColor},"slow");
				$(roomContentDocId).animate({backgroundColor: oriBackgroundColor}, "slow");
			};
		});
	};
	
	
};

function getRoomForId(roomId) {
	var room = null;
	for (var i = gRoomList.length - 1; i >= 0; i--) {
		if (gRoomList[i].roomId == roomId) {
			room = gRoomList[i];
			break;
		}
	};
	return room;
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
				gRoomList[i] = new Room(roomJson['id'], roomJson['name'], roomJson['status']);
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
			if (roomStatusList == null || roomStatusList.length == 0) {
				for (var i = 0; i < gRoomList.length; i++) {
					var room = gRoomList[i];
					room.updateRoomStatus(null);
				};
			} else {
				// 处理没有状态的房间
				for (var i = 0; i < gRoomList.length; i++) { 
					var room = gRoomList[i];
					var isExists = false;
					for (var j = 0; j < roomStatusList.length; j++) {
						if (roomStatusList[j].roomId == room.roomId) {
							isExists = true;
							break;
						}
					};
					if (!isExists) {
						room.updateRoomStatus(null);	
					};
				};
				for (var i = 0; i < roomStatusList.length; i++) {
					var roomId = roomStatusList[i].roomId;
					var room = roomForId(roomId);
					room.updateRoomStatus(roomStatusList[i]);
				};	
			}
		}
		setTimeout("refreshRoomStatus()", 1000);
	}).fail(function(err) {
		setTimeout("refreshRoomStatus()", 3000);
	});
}

function refreshRoomStatus()
{
	getRoomStatus(gShopId);
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