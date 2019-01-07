$(function() {
	$(".warning").remove();

	let nodes = [];

	function hsvToRgb(h, s, v){
		var r, g, b;

		var i = Math.floor(h * 6);
		var f = h * 6 - i;
		var p = v * (1 - s);
		var q = v * (1 - f * s);
		var t = v * (1 - (1 - f) * s);

		switch(i % 6){
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}

		return [r * 255, g * 255, b * 255];
	}	

	String.prototype.hashCode = function(){
		var hash = 0, i, char;
		if (this.length == 0) return hash;
		for (i = 0, l = this.length; i < l; i++) {
			char  = this.charCodeAt(i);
			hash  = ((hash<<5)-hash)+char;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};	
	
	var OFFSET = new BigInteger("0110000100000000",16);
	var two = new BigInteger("2",10);
	function ProfileURL(steamid) {
		var profileurl = "https://steamcommunity.com/profiles/";
		var data = steamid.split(":");
		var steamid64 = "ERROR";
		
		var sX = 0;
		var sY = new BigInteger(data[1],10);
		var sZ = new BigInteger(data[2],10);

		var result = sZ.multiply(two).add(OFFSET).add(sY);
		
		steamid64 = result.toString();
		return profileurl + steamid64;
	};

	var resultsElement = $('.results')
	var tableElement = $('.table')

	tableElement.fadeOut(0);

	function parseDate(a) {
		let mom = moment.unix(a)
		return `${mom.format("YYYY-MM-DD")} (${mom.fromNow()})`;
	}

	function createSteamNode(ss) {
		if(ss == undefined || !ss.startsWith("STEAM_")) {
			let a = ss || "???"
			return document.createTextNode(a);
		}

		let elem = $('<a/>', { href: ProfileURL(ss) });
		elem.append(document.createTextNode(ss.slice(6)))		

		return elem
	}

	function parseLength(a) {
		let mom = moment.unix(a)
		return mom.fromNow()
	}

	function createResultNode(obj) {
		let classes = "",
		    unbanr = "N/A",
		    unbani = "N/A",
		    unbanw = "N/A";

		if(!obj.b) {
			classes = "unbanned";
			unbanr = obj.unbanreason;
			unbani = obj.unbannersid;
			unbanw = parseDate(obj.whenunbanned);
		}

		var hash = obj.sid.hashCode(),
		    hash2 = obj.bannersid.hashCode();
		var hue = (hash * 0.1) % 360,
		    hue2 = (hash2 * 0.1) % 360;

		let elem = $('<tr/>', { class: classes }).append(
			$('<td/>').append(document.createTextNode(obj.name)),
			$('<td/>').append($(createSteamNode(obj.sid))).css("backgroundColor", `hsl(${hue}, 15%, 10%)`),
			$('<td/>').append($(createSteamNode(obj.bannersid))).css("backgroundColor", `hsl(${hue2}, 15%, 10%)`),
			$('<td/>').append(document.createTextNode(obj.banreason)),
			$('<td/>').append(document.createTextNode(unbanr)),
			$('<td/>').append(document.createTextNode(moment.duration((obj.whenunban)-(obj.whenbanned),'seconds').humanize())),
			$('<td/>').append(document.createTextNode(parseDate(obj.whenbanned))),
			$('<td/>').append(document.createTextNode(parseDate(obj.whenunban))),
			$('<td/>').append(document.createTextNode(unbanw)),
		);

		return elem
	}

	function parse_data(data) {
		$('.info').text(`${data.length} bans total.`)
		$('.lds-css').remove();

		tableElement.fadeIn(1000);

		data.forEach(function(obj) {
			let node = createResultNode(obj);
			nodes.push(node)
			resultsElement.append(node)
		})
	}

	function findChildId(elem) {
		let id;
		let pen = Array.prototype.slice.call(elem.parentNode.children)

		pen.forEach((v,k) => {
			if(v.innerHTML == elem.innerHTML) {
				id = k
			}
		})

		return id
	}

	$('.sortable').click(function() {
		resultsElement.empty()
		let srt = $(this).attr('data-sorting') != "true"
		let x = findChildId(this)

		nodes = nodes.sort(function(a, b){
			let as = a[0].childNodes[x].innerHTML.toLowerCase(), 
				bs = b[0].childNodes[x].innerHTML.toLowerCase()
			if(srt ? as < bs : as > bs) return -1;
			if(srt ? as > bs : as < bs) return 1;

			return 0;
		})

		Array.prototype.slice.call(this.parentNode.children).forEach(function(v) {
			$(v).removeAttr('data-sorting')
		})

		$(this).attr('data-sorting', srt.toString())

		nodes.forEach(a => resultsElement.append(a))
	})

	$('.search').bind('input propertychange', function() {
		if(!this.value.length) {
			nodes.forEach(function(elem) {
				$(elem).fadeIn(500)
			})
			return;
		} else {
			let val = this.value.toLowerCase();

			let nds = nodes.filter(x => x[0].childNodes[0].innerHTML.toLowerCase().search(val) == -1).forEach(function(e) {
				$(e).fadeOut(500);
			})
		}
	});

	$(".navbar-burger").click(function() {
		$(".navbar-burger").toggleClass("is-active");
		$(".navbar-menu").toggleClass("is-active");
	});

	$.ajax({ type: 'GET', url: "https://g1cf.metastruct.net/bans", cache: true, dataType: 'json' }).done(parse_data);
})
