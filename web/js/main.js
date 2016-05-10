$(function() {
	$(".menu").hover(function() {
		$(this).find(".menu-bd").show();
		$(this).addClass("menu-hover");
	}, function() {
		$(this).find(".menu-bd").hide();
		$(this).removeClass("menu-hover");
	});
	/*滚动固定*/
	$(window).scroll(function() {
		nowtop = parseInt($(document).scrollTop());
		if (nowtop > 0) {
			$(".container").addClass("ui-fixed");
		} else {
			$(".container").removeClass("ui-fixed");
		}
	});



	$(".toggle-btn").bind("click", function() {
		$(this).parent().toggleClass("filter-sect-expand");
		if ($(this).children(".fa").attr("class") == "fa fa-angle-up")
			$(this).children(".fa").attr("class", "fa fa-angle-down");
		else {
			$(this).children(".fa").attr("class", "fa fa-angle-up");
		}
	});

	$(".J-filter-all-btn").bind("click", function() {

		if ($(this).find(".filter-sect").attr("class") == "filter-sect none")
			$(this).find(".filter-sect").attr("class", "filter-sect");
		else {
			$(this).find(".filter-sect").attr("class", "fa fa-minus-square");
		}
	});
	$(".param-selected").bind("click", function() {
		$(this).hide();
	})

	$("#btn_grid").click(function() {
		$("#btn_list").children().removeClass("active");
		$(this).children().addClass("active");
		$("#m_pro").children().attr("class", "grid");
	});

	$("#btn_list").click(function() {
		$("#btn_grid").children().removeClass("active");
		$(this).children().addClass("active");
		$("#m_pro").children().attr("class", "list");
	});

	$(".J-filter-all-btn").click(function() {
		if ($(this).children().attr("class") == "fa fa-chevron-down") {
			$(".filter-sect").removeClass("none");
			$(this).children().attr("class", "fa fa-chevron-up");
		} else if ($(this).children().attr("class") == "fa fa-chevron-up") {
			$(".filter-sect").not($(".filter-sect").eq(0)).not($(".filter-sect").eq(1)).addClass("none");
			$(this).children().attr("class", "fa fa-chevron-down");
		}

	});
	// $("#online-support").bind("click", function() {
	// 	var str="<div id=\"online-box\"><span id=\"online-close\" onclick='closediv()'><i class=\"fa fa-times-circle\"></i></span><div class=\"online-box-wrap\"><iframe id=\"iframe_kf\" style='width:530px;height:500px;margin-top:-40px'  frameborder=0 src='http://cp4.livechat.35.com/LiveChatWeb/V40/Chat.aspx?companyid=28232&websiteid=17972&browserLang=zh-CN&r=0.7763254640158266#'></iframe></div></div>";
	// 	$("body").append(str);
	//         document.getElementById("iframe_kf").window.location.reload();


	// })
	$("#online-support").hover(function() {
		$(this).find("#support-cont").show();
	}, function() {
		$(this).find("#support-cont").hide();
	});



	$(".pop-close").bind("click", function() {
		$(this).parent().hide()
	});


	$(".tit-r li").hover(function() {
			$(this).addClass("current");
		var thisindex=$(this).index();
        $(".tit-r li").each(function(i,o){
        	if($(o).index()!=thisindex){
              $(o).removeClass("current");

        	}
        });
	}, function() {
		//$(this).removeClass("current");
	});

	$(".tit-r").hover(function() {


	}, function() {
		$(".tit-r li[flag='1']").addClass("current");

	});

})

function closediv() {
	$("#online-box").remove();

}

function popupDiv(div_id) {
	//根据自己需求注意宽度和高度的调整
	var iWidth = document.documentElement.clientWidth;
	var iHeight = document.documentElement.clientHeight;
	//遮罩层
	var bgObj = document.createElement("div");
	bgObj.setAttribute("id", "bgObj"); //设置ID
	bgObj.setAttribute("onclick", "hideDiv('" + div_id + "')");
	bgObj.style.cssText = "position:absolute;left:0px;top:0px;width:" + Math.max(document.body.scrollWidth, iWidth) + "px;height:" + Math.max(document.body.scrollHeight, iHeight) + "px;filter:Alpha(Opacity=30);opacity:0.7;background-color:#000000;z-index:20000;";
	document.body.appendChild(bgObj);

	var div_obj = $("#" + div_id);
	var windowWidth = document.documentElement.clientWidth;
	var windowHeight = document.documentElement.clientHeight;
	var popupHeight = div_obj.height();
	var popupWidth = div_obj.width();
	//添加并显示遮罩层 
	//$("<div id='mask' onclick='hideDiv('popbox_1')'></div>").addClass("overlap") 
	//.width(windowWidth * 0.99) 
	//.height(windowHeight * 0.99) 
	//.click(function() {hideDiv(div_id); }) 
	//.appendTo("body") 
	//.fadeIn(200); 
	div_obj.fadeIn(500);
	div_obj.css({
		"position": "fixed",
		"z-index": "30000",
		"left": windowWidth / 2 - popupWidth / 2,
		"top": windowHeight / 2 - popupHeight / 2
	}).animate({
		opacity: "show"
	}, "slow");
}

function hideDiv(div_id) {
	$("#bgObj").remove();
	//$("#mask").remove(); 
	$("#" + div_id).fadeOut(500);

}