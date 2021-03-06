app.init=function(){
	app.cart.init();
	app.get('#profileInfo').click();
	app.initProfile(app.state.auth);
	let inTitle = app.get("#inTitle");
	let upTitle = app.get("#upTitle");
	inTitle.addEventListener('click', app.evts.mobileSignInStyle);
	upTitle.addEventListener('click', app.evts.mobileSignUpStyle);
	let logoutBtn = app.get('#logoutBtn');
	logoutBtn.addEventListener('click', app.evts.logout);
	let signUpBtn = app.get('#signUpBtn');
	signUpBtn.addEventListener('click', app.evts.signUp);
	let signInBtn = app.get('#signInBtn');
	signInBtn.addEventListener('click', app.evts.signIn);
	let fbLoginBtn= app.get('#fbLoginBtn');
	fbLoginBtn.addEventListener('click', app.fb.checkLoginState);
	let allOrderBtn = app.get('#orderAll');
	allOrderBtn.addEventListener('click', app.evts.getAllOrder);
	let settingsBtn = app.get('#settings');
	settingsBtn.addEventListener('click', app.evts.getCurrProfile);
	let updateBtn = app.get('#updateBtn');
	updateBtn.addEventListener('click', app.evts.updateProfile);
	let csurl = app.get('#csurl');
	csurl.addEventListener('click', app.evts.jumpToCsUrl);
};
app.initProfile=function(data){
	// 如果沒登入 → 登入註冊畫面
	if(app.state.provider===null){
		app.get("#signWrap").style.display = "flex";
		app.get("#view").style.display = "none";
		// app.get("#view").style.display = "flex";
	} else {
		// 有登入 → 個人資訊畫面
		app.get("#signWrap").style.display = "none";
		app.get("#view").style.display = "flex";
		app.showProfile(data.user);
	}
};
app.evts.jumpToCsUrl=function(e){
	e.preventDefault();
	window.open(`https://www.wuhsun.com/rooms/${app.state.auth.access_token}`, '_blank');
}
app.evts.updateProfile=function(e){
	e.preventDefault();
	let updateForm = new FormData(app.get('#updateForm'));
	let updateName = updateForm.get('updateName');
	let updateOldPw = updateForm.get('updateOldPw');
	let updatePw = updateForm.get('updatePw');
	let confirmUpdatePw= updateForm.get('confirmUpdatePw');
	let data={};
	if(updateName==="") {data.name = app.state.auth.user.name}else{
		data.name = updateName;
	}
	if(updatePw==="") {data.password = app.stylish.password}
	if (updatePw !=="" && updatePw === confirmUpdatePw) {
		data.password = updatePw;
	}
	if(updatePw !=="" && updatePw !== confirmUpdatePw) {
		alert('兩次輸入的新密碼不同');
		data.password = undefined;
		return
	}
	if (updateOldPw ==="" || updateOldPw !== app.stylish.password) {
		alert('目前密碼輸入錯誤');
		data.password = undefined;
		return
	}
	let headers={};
	if(app.state.auth!==null){
		headers["Authorization"]="Bearer "+app.state.auth.access_token;
	}
	if(data.password !== undefined){
		app.ajax("post", app.cst.API_HOST+"/user/update", data, headers, function(req){
			let result = JSON.parse(req.responseText);
			app.stylish.password = null;
			if (result.status === 'success') {
				alert('資料修改成功，請重新登入');
				app.get('#logoutBtn').click();
			} else {
				alert('資料修改 failed，發生了某些錯誤');
				window.location = './';
			}
		});
	}
}
app.evts.getCurrProfile=function(e){
	e.preventDefault();
	console.log('修改個人資料使用者狀態', app.state.auth);
	let headers={};
	if(app.state.auth!==null){
		headers["Authorization"]="Bearer "+app.state.auth.access_token;
	}
	app.ajax("get", app.cst.API_HOST+"/user/update", "", headers, function(req){
		let result = JSON.parse(req.responseText);
		app.stylish.password = result.data.password;
		let currIcon = app.get('#currIcon');
		let updateName = app.get('#updateName');
		let updatePw = app.get('#updatePw');
		let confirmUpdatePw= app.get('#confirmUpdatePw');
		if (result.data.picture === null) {
			currIcon.src = './imgs/default_icon.png';
		} else {
			currIcon.src = `${result.data.picture}`;
		}
		updateName.placeholder = result.data.name;
		updateName.addEventListener('focus', (e)=> e.target.placeholder='');
		updateName.addEventListener('blur', (e)=> e.target.placeholder= result.data.name);
		updatePw.placeholder = 'e.g.,******';
		updatePw.addEventListener('focus', (e)=> e.target.placeholder='');
		updatePw.addEventListener('blur', (e)=> e.target.placeholder='e.g.,******');
		confirmUpdatePw.placeholder = 'e.g.,******';
		confirmUpdatePw.addEventListener('focus', (e)=> e.target.placeholder='');
		confirmUpdatePw.addEventListener('blur', (e)=> e.target.placeholder='e.g.,******');
	});
}
app.evts.logout=function(e){
	e.preventDefault();
	if(app.state.provider === 'facebook'){
		FB.api('/me/permissions', 'delete', function(response) {
			localStorage.removeItem('stylish_login');
			localStorage.removeItem('justOnce');
			alert('您已登出 Stylish'); // true for successful logout.
			window.location = "./";
		});
	}else if(app.state.provider === 'native') {
		localStorage.removeItem('stylish_login');
		alert('您已登出 Stylish');
		window.location = "./";
	}
}
app.evts.signIn=function(e){
	e.preventDefault();
	let inFormData = new FormData(app.get('#inForm'));
	let data={
		provider:'native',
		email: inFormData.get('signInEmail'),
		password: inFormData.get('signInPw')
	}
	app.ajax("post", app.cst.API_HOST+"/user/signin", data, {}, function(req){
		let result=JSON.parse(req.responseText);
		if(result.error){
			console.log("Stylish 登入 failed", result.error);
			alert('電子信箱或密碼不正確');
		}else{
			console.log("Stlish 登入成功", result);
			localStorage.setItem('stylish_login', JSON.stringify(result));
			window.location = './profile.html';
		}
	});
}
app.evts.signUp=function(e){
	e.preventDefault();
	let upFormData = new FormData(app.get('#upForm'));
	let data={};
	if(upFormData.get('signUpName')!=="") {
		data.name = upFormData.get('signUpName');
	} else{
		alert('必須輸入姓名');
		return
	}
	data.email = upFormData.get('signUpEmail');
	// 為了測試先關掉 email 檢查
	// if(upFormData.get('signUpEmail').match(/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/)) {
	// 	data.email = upFormData.get('signUpEmail');
	// } else {
	// 	alert('Email 格式不正確');
	// 	return
	// }
	if (upFormData.get('signUpPw') === upFormData.get('confirmSignUpPw')) {
		data.password = upFormData.get('signUpPw');
	} else {
		alert('兩次輸入的密碼不同');
		return
	}
	if (data.name!==undefined && data.email!==undefined && data.password!==undefined) {
		app.ajax("post", app.cst.API_HOST+"/user/signup", data, {}, function(req){
			let result=JSON.parse(req.responseText);
			if(result.error){
				console.log("註冊 failed", result.error);
				alert('所有欄位都必填');
			}else{
				console.log("註冊成功", result);
				alert('請到email收取認證信，認證過後才算註冊成功喔！');
				window.location = './';
			}
		});
	}
}
app.evts.mobileSignInStyle=function(){
	let inForm=app.get('#inForm');
		if(inForm.className === "signForm signFormGrow") {
			inForm.classList.remove('signFormGrow');
		} else {
			inForm.classList.add('signFormGrow');
		}
}
app.evts.mobileSignUpStyle=function(){
	let upForm=app.get('#upForm');
		if(upForm.className === "signForm signFormGrow") {
			upForm.classList.remove('signFormGrow');
		} else {
			upForm.classList.add('signFormGrow');
		}
}
app.evts.getAllOrder=function(){
	console.log('抓訂單資料使用者狀態', app.state.auth);
	let headers={};
	if(app.state.auth!==null){
		headers["Authorization"]="Bearer "+app.state.auth.access_token;
	}
	app.ajax("get", app.cst.API_HOST+"/order/search", "", headers, function(req){
		let result =JSON.parse(req.responseText);
		console.log(result);
		let dlWrap = app.get('#dlWrap');
		while(dlWrap.firstChild){
			dlWrap.removeChild(dlWrap.firstChild);
		}
		app.showAllOrder(result);
	});
};
app.showAllOrder=function(allOrder){
	let dlWrap = app.get('#dlWrap');
	if(allOrder.data.length <= 0 || allOrder.data === undefined){
		app.createElement('div', {atrs:{
			textContent:'您最近沒有下過訂單耶',
			// className:''
		}}, dlWrap);
	}
	allOrder.data.forEach(function(order){
		app.createElement('div', {atrs:{
			textContent:'　',
			className:'separate-line'
		}}, dlWrap);
		let dl = app.createElement('dl', {}, dlWrap);
		app.createElement('dt', {atrs:{textContent:'訂購時間'}}, dl);
		app.createElement('dd', {atrs:{textContent:order.time}, stys:{color:'#8b572a'}}, dl);
		app.createElement('dt', {atrs:{textContent:'訂單編號'}}, dl);
		app.createElement('dd', {atrs:{textContent:order.number}, stys:{color:'rgb(173, 24, 24)'}}, dl);
		app.createElement('dt', {atrs:{textContent:'應付金額'}}, dl);
		app.createElement('dd', {atrs:{textContent:'NT$ '+order.details.total}}, dl);
		app.createElement('dt', {atrs:{textContent:'收件資訊'}}, dl);
		if(order.details.payment==='credit_card') { order.details.payment='信用卡付款' }
		if(order.details.shipping==='delivery') { order.details.shipping='宅配' }
		app.createElement('dd', {atrs:{
			innerText:'收件人：'+order.details.recipient.name+'\r\n'+
			'配送地址：'+order.details.recipient.address+'\r\n'+
			'取付方式：'+order.details.payment+'／'+order.details.shipping
		}}, dl);
		app.createElement('dt', {atrs:{textContent:'訂單狀態'}}, dl);
		// 訂單狀態還是假的
		app.createElement('dd', {atrs:{textContent:'訂單確認中'}}, dl);
		app.createElement('dt', {atrs:{textContent:'訂單內容'}}, dl);
		app.createElement('dd', {atrs:{
			innerText: order.details.list.map(odl => {
				return odl.id + ' ' + odl.title + ' ' + odl.color.name + ' ' + odl.size + ' × ' + odl.qty
			}).join('\r\n')
		}}, dl);
	});
}
showPanel=function(panelIndex, colorCode) {
	let tabBtns=app.getAll('.settingsBtns button');
	let panels=app.getAll('.panel');
	tabBtns.forEach(tb => {
		tb.style.border='';
		tb.style.color='';
	});
	tabBtns[panelIndex].style.border='1px solid #3f3a3a';
	tabBtns[panelIndex].style.color="#8b572a";
	panels.forEach(pn => {
		pn.style.display = "none";
	});
	panels[panelIndex].style.display='block';
	panels[panelIndex].style.backgroundColor=colorCode;
}
app.showProfile=function(data){
	if (data.picture===null || data.picture===undefined) {
		app.get("#profile-picture").src="./imgs/default_icon.png";
	} else {
		app.get("#profile-picture").src=`${data.picture}`;
	}
	let details=app.get("#profile-details");
	app.createElement("p", {atrs:{
		textContent:data.name
	}}, details);
	app.createElement("p", {atrs:{
		textContent:data.email
	}}, details);
	app.createElement("p", {atrs:{
		textContent:'會員 ID：'+data.id
	}}, details);
};
window.addEventListener("DOMContentLoaded", app.init);