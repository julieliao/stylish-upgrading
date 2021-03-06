// initialize app structure
let app={
	fb:{},stylish:{},
	state:{
		cart:null, auth:null, provider:null
	}, evts:{}, cart:{},
	cst:{
		API_HOST:"https://www.wuhsun.com/api/1.0"
	}
};
// core operations
app.get=function(selector){
	return document.querySelector(selector);
};
app.getAll=function(selector){
	return document.querySelectorAll(selector);
};
app.createElement=function(tagName,settings,parentElement){
	let obj=document.createElement(tagName);
	if(settings.atrs){app.setAttributes(obj,settings.atrs);}
	if(settings.stys){app.setStyles(obj,settings.stys);}
	if(settings.evts){app.setEventHandlers(obj,settings.evts);}
	if(parentElement instanceof Element){parentElement.appendChild(obj);}
	return obj;
};
app.modifyElement=function(obj,settings,parentElement){
	if(settings.atrs){
		app.setAttributes(obj,settings.atrs);
	}
	if(settings.stys){
		app.setStyles(obj,settings.stys);
	}
	if(settings.evts){
		app.setEventHandlers(obj,settings.evts);
	}
	if(parentElement instanceof Element&&parentElement!==obj.parentNode){
		parentElement.appendChild(obj);
	}
	return obj;
};
app.setStyles=function(obj,styles){
	for(let name in styles){
		obj.style[name]=styles[name];
	}
	return obj;
};
app.setAttributes=function(obj,attributes){
	for(let name in attributes){
		obj[name]=attributes[name];
	}
	return obj;
};
app.setEventHandlers=function(obj,eventHandlers,useCapture){
	for(let name in eventHandlers){
		if(eventHandlers[name] instanceof Array){
			for(let i=0;i<eventHandlers[name].length;i++){
				obj.addEventListener(name,eventHandlers[name][i],useCapture);
			}
		}else{
			obj.addEventListener(name,eventHandlers[name],useCapture);
		}
	}
	return obj;
};
app.ajax=function(method, src, args, headers, callback){
	let req=new XMLHttpRequest();
	if(method.toLowerCase()==="post"){ // post through json args
		req.open(method, src);
		req.setRequestHeader("Content-Type", "application/json");
		app.setRequestHeaders(req, headers);
		req.onload=function(){
			callback(this);
		};
		req.send(JSON.stringify(args));
	}else{ // get through http args
		req.open(method, src+"?"+args);
		app.setRequestHeaders(req, headers);
		req.onload=function(){
			callback(this);
		};
		req.send();
	}
};
	app.setRequestHeaders=function(req, headers){
		for(let key in headers){
			req.setRequestHeader(key, headers[key]);
		}
	};
app.getParameter=function(name){
    let result=null, tmp=[];
    window.location.search.substring(1).split("&").forEach(function(item){
		tmp=item.split("=");
		if(tmp[0]===name){
			result=decodeURIComponent(tmp[1]);
		}
	});
    return result;
};
// menu items
app.updateMenuItems=function(tag){
	let desktopItems=app.getAll("header>nav>.item");
	let mobileItems=app.getAll("nav.mobile>.item");
	if(tag==="women"){
		desktopItems[0].classList.add("current");
		mobileItems[0].classList.add("current");
	}else if(tag==="men"){
		desktopItems[1].classList.add("current");
		mobileItems[1].classList.add("current");
	}else if(tag==="accessories"){
		desktopItems[2].classList.add("current");
		mobileItems[2].classList.add("current");
	}
};
// loading
app.showLoading=function(){
	app.get("#loading").style.display="flex";
};
app.closeLoading=function(){
	app.get("#loading").style.display="none";
};
// facebook login
app.fb.load=function(){
	// Load the SDK asynchronously
	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s); js.id = id;
		js.src = "https://connect.facebook.net/zh_TW/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, "script", "facebook-jssdk"));
};
app.fb.init=function(){
	FB.init({
		appId      : '541771016312048',
		cookie     : true,
		xfbml      : true,
		version    : 'v3.2'
	  });

	  FB.getLoginStatus(function(response) {
		app.fb.statusChangeCallback(response);
	  });
};
app.fb.checkLoginState=function(e){
	e.preventDefault();
	FB.login(function(response){
		app.fb.statusChangeCallback(response);
	}, {scope:"public_profile,email"});
};
app.fb.statusChangeCallback=function(response){
	if(response.status==="connected"){
		app.fb.testAPI();
		app.fb.updateLoginToServer(response);
	}else{
		// 沒登入，或情況不明
		console.log('fb未登入');
	}
};
app.fb.updateLoginToServer=function(response){
	let data={
		provider:"facebook",
		access_token:response.authResponse.accessToken
	}
	app.ajax("post", app.cst.API_HOST+"/user/signin", data, {}, function(req){
		let result=JSON.parse(req.responseText);
		if(result.error){
			console.log("fb 登入 failed", result.error);
		}else{
			console.log("fb 登入成功", result);
			localStorage.setItem("stylish_login", JSON.stringify(result));
			if (! localStorage.justOnce) {
				localStorage.setItem("justOnce", "true");
				document.location.reload();
				window.scrollTo(0,0);
			}
		}
	});
};
app.showMemberIcon=function(data) {
	let memberIcons = app.getAll('.member');
	memberIcons.forEach(mi => {
		if (data.user.picture===null || data.user.picture===undefined) {
			data.user.picture="./imgs/default_icon.png";
		}
		mi.style.backgroundImage = "url('" + data.user.picture + "')";
	});
}
app.fb.testAPI=function() {
	console.log('Welcome!  Fetching your information.... ');
    FB.api('/me?fields=id, name, email', function(response) {
		console.log('Successful login for: ' + response.name);
	});
}
window.fbAsyncInit=app.fb.init;
window.addEventListener("DOMContentLoaded", app.fb.load);
// stylish login
app.stylish.init=function(){
	let stylish_login = JSON.parse(localStorage.getItem('stylish_login'));
	if (stylish_login!==null) {
		console.log("stylish_login", stylish_login);
		app.state.provider = stylish_login.data.user.provider;
		app.state.auth = stylish_login.data;
		app.showMemberIcon(app.state.auth);
	}
}
window.addEventListener("DOMContentLoaded", app.stylish.init);

// shopping cart
app.cart.init=function(){
	let storage=window.localStorage;
	let cart=storage.getItem("cart");
	if(cart===null){
		cart={
			shipping:"delivery", payment:"credit_card",
			recipient:{
				name:"", phone:"", email:"", address:"", time:"anytime"
			},
			list:[],
			subtotal:0,
			freight:60,
			total:0
		};
	}else{
		try{
			cart=JSON.parse(cart);
		}catch(e){
			storage.removeItem("cart");
			app.cart.init();
			return;
		}
	}
	app.state.cart=cart;
	// refresh UIs
	app.cart.show();
};
app.cart.update=function(){
	let storage=window.localStorage;
	let cart=app.state.cart;
	let subtotal=0;
	for(let i=0;i<cart.list.length;i++){
		subtotal+=cart.list[i].price*cart.list[i].qty;
	}
	cart.subtotal=subtotal;
	cart.total=cart.subtotal+cart.freight;
	// save to storage
	storage.setItem("cart", JSON.stringify(cart));
	// refresh UIs
	app.cart.show();
};
app.cart.show=function(){
	let cart=app.state.cart;
	app.get("#cart-qty-mobile").textContent=app.get("#cart-qty").textContent=cart.list.length;
};
app.cart.add=function(product, variant, qty){
	let list=app.state.cart.list;
	let color=product.colors.find((item)=>{
		return item.code===variant.color_code;
	});
	let item=list.find((item)=>{
		return item.id===product.id&&item.size===variant.size&&item.color.code===color.code;
	});
	if(item){
		item.qty=qty;
	}else{
		list.push({
			id:product.id,
			title:product.title,
			price:product.price,
			main_image:product.main_image,
			size:variant.size,
			color:color,
			qty:qty, stock:variant.stock
		});
	}
	app.cart.update();
	alert("已加入購物車");
};
app.cart.remove=function(index){
	let list=app.state.cart.list;
	list.splice(index, 1);
	app.cart.update();
	alert("已從購物車中移除");
};
app.cart.change=function(index, qty){
	let list=app.state.cart.list;
	list[index].qty=qty;
	app.cart.update();
};
app.cart.clear=function(){
	let storage=window.localStorage;
	storage.removeItem("cart");
};