//assumptions
//
// csv layout:
//     -     ,   -    ,author1,author2,...
// category 1,element1, a1c1e1, a2c1e1,...
// category 1,element2, a1c1e2, a2c1e2,...
// category 2,element1, a1c2e1, a2c2e1,...
//
// - categories are unique
// - elements are unique
// - if author n doesn't define element m, the cell is either empty or contains a hyphen only
// - the author cell's first word can be used to identify the book

var Parser = function(path = "data/Hungarian_Sabre_sources_and_techiques.csv") {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		var textlines = xmlhttp.responseText.split('\n');
		var csvlines = textlines.map(x => Csv.parse(x));
		console.log(csvlines);
		process(csvlines);
		}
	};
	xmlhttp.open("GET",path,true);
	xmlhttp.overrideMimeType('text/xml; charset=iso-8859-1');
	xmlhttp.send();

	var authors = [];
	var categories = [];
	var elems = [];
	var items = [];
	var links = new Set();
	
	//helper functions
	
	function get_uuid(array, name){
		var found = array.find(elem => elem.itemtext == name);
		return found ? found.id : undefined;
	}
	
	function toUniqueItem(src, dest){
		src.forEach(function(name){
			dest.push(new Item(name));
		});
	}
	
	function process(csvlines){
		authors = csvlines[0].slice(2);
		toUniqueItem(new Set(csvlines.slice(1).map(x => x[0])), categories);
		toUniqueItem(new Set(csvlines.slice(1).map(x => x[1])), elems);
			
		csvlines.slice(1).forEach(function(linedata){
			//process data lines
			
			links.add({from: get_uuid(categories, linedata[0]), to: get_uuid(elems, linedata[1])});
			var lineitems = MultiItem(linedata.slice(2)).separate();
			items = items.concat(lineitems);
			lineitems.forEach(it => links.add({from: get_uuid(elems, linedata[1]), to: it.id}));
		});
		
		document.getElementById("loaded-diagram").innerHTML =
			categories.map(x=>x.toDiv()).join("") +
			elems.map(x=>x.toDiv()).join("") +
			items.map(x=>x.toDiv()).join("");
	}
	
	return {
		links: links
	}
};

var Item = function(itemtext, authors=[""]) {
	var id = uuidv4(Math.random());
	
	function authorText(){
		return authors ? authors.join(",") : "";
	}
	
	function toDiv(){
		return "<div id=\"" + id + "\" class=\"item\">" + itemtext + "\n" + authorText() + "</div>";
	}
	
	return {
		toDiv: toDiv,
		id: id,
		itemtext: itemtext,
		authors: authors
	}
}

var MultiItem = function(itemarr){
	function separate(){
		var uniqueNames = [];
		
		itemarr.forEach(function(currentName, authorID){
			if(!currentName.trim() || currentName == "-")
				return;
			
			var exItem = uniqueNames.find(it => it.itemtext == currentName);
			if(exItem)
				exItem.authors.push(authorID);
			else
				uniqueNames.push(new Item(currentName, [authorID]));
		})
		
		return uniqueNames;
	}
	
	return {
		separate: separate
	}
};

var Csv = function() {
	function parse(row){
	  var insideQuote = false,                                             
		  entries = [],                                                    
		  entry = [];
	  row.split('').forEach(function (character) {                         
		if(character === '"') {
		  insideQuote = !insideQuote;                                      
		} else {
		  if(character == "," && !insideQuote) {                           
			entries.push(entry.join(''));                                  
			entry = [];                                                    
		  } else {
			entry.push(character);                                         
		  }                                                                
		}                                                                  
	  });
	  entries.push(entry.join(''));                                        
	  return entries;                                                      
	}
	
	return{
		parse: parse
	}
}();