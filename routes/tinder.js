var express = require('express');
var router = express.Router();
var path = require('path');

var notifier = require('node-notifier');
router.use(express.static(path.join(__dirname, 'public')));
var innerHtml= '';
var startHtml='<!doctype html><html><head><style type="text/css"> @import url("main.css");</style>'+logo()+'<hr></head><body>';
var endHtml = '</div></div></body></html>';
var idList = []; 
var matches = 0;
var likes = 0;
	
var FACEBOOK_ID =  "*****YOUR FACEBOOK ID********";
var FACEBOOK_TOKEN = "****YOUR FACEBOOK TOKEN******";
var TinderPro = require('tinder_pro')
var tinder = new TinderPro()

router.get('/', function (req, response, next) { 

  console.log("***Logando GETTinder!****") 
  tinder.sign_in(FACEBOOK_ID, FACEBOOK_TOKEN, function(err, res, body){	     
		if (err){			
			console.log("Erro sign_in  ---  "+err);
			response.send("Falha no login --- erro conexao!")
		}else { 
			console.log("***Entrou!!!**** ");
            tinder.fetch_updates(function(err, res, body){
            	console.log(body);
        }); 
			next();
	   }
  }); 
 
}, function (req, response) {
  
  console.log(req.method);  
  tinder.get_nearby_users(function(err, res, body){ 
            innerHtml = '';        
						
		if (typeof(body) != "undefined"){
			var data = body.results;
  	        innerHtml += '<div id="container"><div id="content">'+menu()+'</div><div id="sidebar">';
					
			data.forEach(function (result) {
				//console.log(result);
				console.log(req.method+' '+result._id+'  '+result.name);
				if(result.name === 'Tinder Team'){
					innerHtml += '<hr><h1>'+result.bio+'</h1><br>';
				}else{
					idList.push(result._id);
					var photos = result.photos;
				  	if ( photos[1] && typeof(photos[1]) != "undefined"){
						var perfil = photos[1].url;
						var url_perfil ='none';
						if(perfil){	url_perfil = perfil};
				 	} 
				 	var profileCard = createHtmlTemplate(result._id,result.name,result.bio,result.distance_mi,url_perfil,true);   
					
					innerHtml +=  profileCard;
				}
			});			
			response.send(startHtml+innerHtml+endHtml);
		}else{
			console.log('Erro get get_nearby_users --- '+err); 
			response.send('Nao retornou nenhum resultado!');
		}
	});  
  
});


router.get('/profile/:id', function(req, response) {
    var profile = '';
	tinder.get_user_info(req.params.id, function(err, res, user){
		    if(!err){
				console.log(req.method+" "+user.results._id+" "+user.results.name);
				profile += '<div id="container"><div id="content">';
				profile += createHtmlTemplate(user.results._id,user.results.name,user.results.bio,user.results.distance_mi,user.results.photos[1].url,false) +'<p>';
                profile += '</div><div id="sidebar">';

				var photos = user.results.photos;
				photos.forEach(function (photo){					
						profile += createPhotoTemplate(photo.url);
				});

				response.send(startHtml+profile+endHtml); 
		   }else{
		   	    response.send('ERRO PERFIL USUARIO --- ERRO CONEXAO!')
		   	    console.log('Erro  get_user_info---- '+err)
		   } 								
	});      
});

router.get('/profile/like/:id', function(req, response) {	 
    tinder.like(req.params.id, function(err, res,body){
		 
			if (!err){
				console.log(req.method+' '+req.params.id + body);
				notifier.notify({
					title: 'GetTinder',
					message: 'You Liked Her!',
					icon: path.join(__dirname, 'Tinder-Like.png'), 
					sound: true, // Only Notification Center or Windows Toasters 
					wait: true // wait with callback until user action is taken on notification 
				}, function (err, res) {
					// response is response from notification
					innerHtml = '';
					response.redirect('/profile/'+req.params.id); 
		   		
				});	
		  	}else{
		  	    	console.log('Erro get like '+err);
		            response.send('LIKE ---------- ERRO CONEXAO');
			}		
	});
});

router.get('/likeall', function(req, response, next) {
		
	idList.forEach(function(user_id) {    	
		tinder.like(user_id, function(err, res, body){
			if (!err){
				console.log(req.method+' '+user_id);
				console.log(body);
				likes++;
				if(body.match === true) matches++;
			}else{
				console.log('ERRO LIKE ALL --- '+err);
				response.send('ERROR LIKE ALL --- CONECTION ERROR')
			}	
		});
	});

	if (likes > 0) next();

	console.log('****Nao retornou nenhum like!');
	
}, function (req, response) {

	notifier.notify({
  			title: 'GetTinder - Like All',
  			message:  likes+' Like(s) and '+matches+" Match(es)",
  			icon: path.join(__dirname, 'Tinder-Like.png'), 
  			sound: true, // Only Notification Center or Windows Toasters 
  			wait: true // wait with callback until user action is taken on notification 
		}, function (err, res) {
		  // response is response from notification
		  innerHtml = '';
		  response.redirect('/');
		});
	matches = 0;
	likes = 0;
});


function createHtmlTemplate(id,name,bio,distance,photo_url,tag){

	var profileCardHmtl = '';

	var link = '<a href="like/'+id+'"><img src="Tinder-Like.png" align="middle" >LIKE </a>';
	var photo = '<a href="'+photo_url+'"><img src="'+photo_url+'"></a>';	
	var res = '<div class="action"><a href="'+photo_url+'">'+name+'</a></div><div class="content"><p>'+
				bio+'</p></div>'+'<div class="action">'+link+'</div>';
				
	if(tag){ 
		desc = distance+' Km';
		link = '<a href="profile/'+id+'">'+name+'</a>';
		photo =  '<a href="profile/'+id+'"><img src="'+photo_url+'"></a>';
		res = '<div class="action">'+link+'</div>';

	}	 

	profileCardHmtl += '<div class="card">' +
						  '<div class="image">'+
						      photo+
						      ' <span class="title">'+distance+' km</span>'+
						  '</div>'+res+						   	  
						   '</div>';

	return profileCardHmtl;

}

function createPhotoTemplate(photo_url){

	var profileCardHmtl = '';

	profileCardHmtl += '<div class="card">' +
						  '<div class="image">'+
						      '<a href="'+photo_url+'"><img src="'+photo_url+'"></a>'+
						  '</div>'+						  
						  '</div>';
	return profileCardHmtl;

}

function logo(){

	return  '<div class="card">' +
						   	  '<div class="image">'+
				   				'<a href="/"><img src="gettinderlogo.png"></a>'+
			    			   '</div>'+
						   '</div>';
	
}

function menu(){
	return '<div class="card">' +
  			     '<div class="action">'+
    						   '<a href="likeall"><p>Like Them All!</a>'+    						  
  							   '</div>'+
  				  '<div class="action">'+
    						   '<a href="/"><p>Get more people nearby!</a>'+    						
  							   '</div>'+			   
			'</div>';
}


module.exports = router;