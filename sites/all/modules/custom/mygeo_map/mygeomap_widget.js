(function ($) {
	$(document).ready( function(){
		initialize();
		//dom elements
		countrySelect=$('#edit-field-country-und');
		getLocationSubmit=$("div[id='mygeomap-address-getlocation'] input");
		divisions=[];
		divisionsValue=[];
		units=[];
		//district ajax gif loader
		
		var loadergifdiv="<div id='ajax-gif-loader'></div>";
		$('#mygeomap-address-division1 div').append(loadergifdiv);
		$('#ajax-gif-loader').hide();

		initialize_divisions();

		//hide division at start
		for(var i=1; i<=4; i++)
		{
			show_hide_division('division'+i,'hide');
		}
		//when country is changed
		countrySelect.change(function(){
			var country = $(this).val();
			units=[];
			if(country!='_none' && country!='')
			{
				var countryname=$('#edit-field-country-und option:selected').text();
				reset_childs_options(2);
				get_country_units(country,'');
				get_latlang_from_address(countryname,country);
			}
			else
			{
				reset_childs_options(1);
			}
		})
		//when division is changed
		var divisionSelect=$("div[class='mygeomap-address-division'] div select");
		divisionSelect.change(function(){
			thisName=$(this).val();
			thisId=$(this).attr('id');
			thisDivisionLevel=parseInt(thisId.charAt(thisId.length-1));
			thisDivisionName=units[thisDivisionLevel];
			get_select_options(thisName,thisDivisionLevel,thisDivisionName);
			geo_code_address(thisDivisionLevel,'');
		});
		//additional address submitted
		getLocationSubmit.click(function(event){
			event.preventDefault();
			get_location_after_submit();
			
		});
	});
	//initialize the divisions and replace text with select
	function initialize_divisions()
	{
		for(var i=1 ;i<=4;i++)
		{
			var thisinput=$("div[id='mygeomap-address-division"+i+"'] div input");
			var id=thisinput.attr('id');
			var value=thisinput.val();
			divisionsValue[i]=value;
			var name=thisinput.attr('name');
			var thisselect="<select id='"+id+"' name='"+name+"' class='form-select'><option value='' selected='selected'>None</option></select>";
			thisinput.replaceWith(thisselect);
		}
		var country=countrySelect.val();
		
		if(country!='_none' && country!='')
		{
			get_country_units(country,load_select_options);
		}
	}
	//loads select options to divisions at start
	function load_select_options()
	{
		for(var i=1 ;i<=4;i++)
		{
			if(divisionsValue[i])
			{
				get_select_options(divisionsValue[i],i,units[i]);
				try{
					$("div[id='mygeomap-address-division"+i+"'] div select").val(divisionsValue[i]);
				}
				catch(ex){
					setTimeout(function(){
						$("div[id='mygeomap-address-division"+i+"'] div select").val(divisionsValue[i]);	
					},1);
				}
				
				show_hide_division('division'+i,'show');
			}
			else
			{
				break;
			}
		}
	}
	//rearranges unit 
	function add_form_elements(unit)
	{
		$.each(unit, function(key, val){
			var divlevel=val.ad_administrative_level;
			var div="division"+divlevel;
			var divname=val.ad_administrative_level_name;
			units[parseInt(divlevel)]=divname;
		});
	}
	//gets country unit from geotag
	function get_country_units(country,callback)
	{
		if(country == 'np')
		{
			var fromDivision=3;
		}
		else
		{
			var fromDivision=1;
		}
		$.ajax({
			url: "http://www.developmentcheck.org/geotag/"+country+"/units/"+fromDivision,
			dataType:'jsonp',
			jsonp:false,
			jsonpCallback:'countryunits',
			cache:true,
			success: function(result) {
				var unit=result;
				add_form_elements(unit);
				get_country_divisions(country,callback);
				}
				});
	}
	//gets country divisions from geotag
	function get_country_divisions(country,callback)
	{
		//resetting division1
		var targetLabel=$("div[id='mygeomap-address-division1'] div label");
		targetLabel.html(units[1]);
		show_hide_division('division1','show');
		$("div[id='mygeomap-address-division1'] div select").html("<option value='' selected='selected'> Select a "+units[1]+"</option>");
		//ajax request
		$('#ajax-gif-loader').show();
		if(country == 'np')
		{
			var fromDivision=3;
		}
		else
		{
			var fromDivision=1;
		}
		$.ajax({
				url: "http://www.developmentcheck.org/geotag/"+country+"/divisions/"+fromDivision,
				//url: "http://www.developmentcheck.org/geotag/data/"+country+"/divisions",
				dataType:'jsonp',
				jsonp:false,
				jsonpCallback:'countrydivisions',
				cache:true,
				success: function(result) {
					divisions[0]=result;
					if(divisions[0]){
						get_select_options('country',0,'');
						$('#ajax-gif-loader').hide();
						if(typeof callback=='function')
						{
					 		callback();
						}
					}
				}
		});					
	}
	//loads the select option to respective select box
	function get_select_options(parentName,divLevel,divName)
	{
		//loading select option to respective division select box 
		var targetDivLevel=divLevel+1;
		if(!units[targetDivLevel]) return;
		if(parentName=='')
		{
			reset_childs_options(targetDivLevel);
			divisions[divLevel]=null;
			return;
		}
		else
		{
			reset_childs_options(targetDivLevel);
		}
		show_hide_division('division'+targetDivLevel,'show');
		var target=$("div[id='mygeomap-address-division"+targetDivLevel+"'] div select");
		var targetDivName=units[targetDivLevel];
		var targetLabel=$("div[id='mygeomap-address-division"+targetDivLevel+"'] div label");
		targetLabel.html(targetDivName);
		if(divName)
		{
			$.each(divisions[divLevel-1],function(key,val){
				if(val.name==parentName && val.divisions.type==divName)
				{
					divisions[divLevel]=val.divisions.data;
				}
			});
			
		}
		var options='<option value="" selected="selected">Select a '+targetDivName+'</option>';
		if(divisions[divLevel])
		{
			$.each(divisions[divLevel],function(key,val){
				thisName=val.name;
				options+='<option value="'+thisName+'">'+thisName+'</option>';
			});			
		}
		target.html(options);
	}
	//resets the child options
	function reset_childs_options(divLevel)
	{
		for(var i=divLevel;i<=4;i++)
		{
			var target=$("div[id='mygeomap-address-division"+i+"'] div select");
			target.html("<option value='' selected='selected'>None</option>");
			show_hide_division('division'+i,'hide');
		}
	}
	//show or hide division select
	function show_hide_division(divname,action)
	{
		var targetdiv=$("div[id='mygeomap-address-"+divname+"']");
		if(action=='hide')
		{
			targetdiv.hide();
		}
		else if(action='show')
		{
			targetdiv.show();
		}
	}
	//gets location from additional address 
	function get_location_after_submit()
	{
		var additionalInput=$("div[id='mygeomap-address-additional'] div input");
		var address='';
		if(additionalInput.val())
		{
			address+=additionalInput.val();
		}
		if(address)
		{
			if(units.length!==0)
			{
				geo_code_address(units.length-1,address);
			}
			else
			{
				var country=countrySelect.val();
				if(country!='_none' && country!='')
				{
					get_latlang_from_address(address,country);	
				}
				else
				{
					alert('Please Select a country.');
				}	
			}
		}
	}
	//computes address from the division select box
	function geo_code_address(level,address)
	{
		for(var i=level;i>0;i--)
		{
			var divisionSelect=$("div[id='mygeomap-address-division"+i+"'] div select option:selected");
			var selected=divisionSelect.val();
			if(selected)
			{
				if(address) address+=', ';
				address+=selected;
			}
		}
		var country=countrySelect.val();
		if(country!='_none' && country!='')
		{
			get_latlang_from_address(address,country);	
		}
		else
		{
			alert('Please Select a country.');
		}	

	}

	function initialize() 
	{
	    //initialize variables
	    markers=null;
	    latField=$("div[id='mygeomap-location-lat'] input");
	    lngField=$("div[id='mygeomap-location-lng'] input");
	    var zoom=1;

	    var placeInitialMarker=false;
	    //initial location
	    if(latField.val() && lngField.val())
	    {
	      curLocation=new google.maps.LatLng(latField.val(), lngField.val());
	      var placeInitialMarker=true;
	      zoom=14;
	    }
	    else
	    {
	      curLocation=new google.maps.LatLng(28.304380682962783, 4.21875);
	    }
	    //mapOptions
	    var mapOptions = {
	      center: curLocation,
	      zoom: zoom,
	      mapTypeId: google.maps.MapTypeId.ROADMAP
	    };
	    map = new google.maps.Map(document.getElementById("google-map"), mapOptions);
	    geocoder=new google.maps.Geocoder();
	    //initialmarker
	    if(placeInitialMarker)
	    {
	      mapZoom=map.getZoom();
	      placeMarker(curLocation);  
	    }
	    //when clicked on map
	    google.maps.event.addListener(map, 'click', function(event) {
	    mapZoom = map.getZoom();
	        setTimeout(function() { placeMarker(event.latLng);},500);
	    });
	    //when latlng value is changed
	    latField.keypress(function(event){
	        if(event.which==13)
	        {
	          var location=new google.maps.LatLng(latField.val(), lngField.val());
	          placeMarker(location);
	        }
	    });
	    lngField.keypress(function(event){
	      if(event.which==13)
	      {
	        var location=new google.maps.LatLng(latField.val(), lngField.val());
	        placeMarker(location);
	      }
	    });
	}
	function placeMarker(location)
	{
		if(mapZoom == map.getZoom()){
		  if(markers)
		  {
		      markers.setMap(null);
		  }
		  var marker = new google.maps.Marker({
		      position: location,
		      map:map
		  });
		  map.panTo(location);
		  updateLatlng(location);
		markers=marker;
		}
	};
	function updateLatlng(location)
	{
	    latField.val(location.lat());
	    lngField.val(location.lng());
	}
	function get_latlang_from_address(address,country)
	{
		$.ajax({
			url: "http://www.developmentcheck.org/geotag/"+country+"/latlong/"+address,
			dataType:'jsonp',
			jsonp:false,
			jsonpCallback:'addresslatlng',
			cache:true,
			success: function(result) {
				if(result.success==1)
				{
					map.setZoom(result.zoomlevel);
					mapZoom=result.zoomlevel;
					placeMarker(new google.maps.LatLng(result.lat, result.lng));
				}
			}
				
		});
	}
	function resetMap()
	{
		defaultLocation=new google.maps.LatLng(28.304380682962783, 4.21875);
		map.setCenter(defaultLocation);
		map.setZoom(1);
		if(markers)
		{
		  markers.setMap(null);
		}
	}
	function get_zoom_level(ne,sw)
	{
		var GLOBE_WIDTH = 256; // a constant in Google's map projection
		var east=ne.lng();
		var west=sw.lng();
		var north=ne.lat();
		var south=sw.lat();
		var angle = east - west;
		if (angle < 0) {
    		angle += 360;
		}
		var angle2 = north - south;
		if (angle2 > angle) angle = angle2;
		var zoomfactor = Math.round(Math.log(960 * 360 / angle / GLOBE_WIDTH) / Math.LN2);
		return zoomfactor;
	}
})(jQuery);