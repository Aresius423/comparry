//assumptions
//
// csv layout:
//     -     ,   -    ,author1,author2,...
// category 1,element1, a1c1e1, a2c1e1,...
// category 1,element2, a1c1e2, a2c1e2,...
// category 2,element1, a1c2e1, a2c2e1,...
//
// - 
// - categories are unique
// - elements are unique
// - csv file is utf-8 encoded
// - rows are separated by \r\n, in-cell linebreaks are marked with \n
// - if author n doesn't define element m, the cell contains a hyphen, or whitespaces only
// - the author cell's first word can be used to identify the book

var Parser = function(path = "data/Hungarian_Sabre_sources_and_techiques.csv") {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		var textlines = xmlhttp.responseText.split('\r\n').filter(l => l.trim());
		var csvlines = textlines.map(x => Csv.parse(x));
		process(csvlines);
		}
	};
	xmlhttp.open("GET",path,true);
	xmlhttp.overrideMimeType('text/xml; charset=utf-8');
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
	
	function toUniqueItem(src, dest, rank){
		src.forEach(function(name){
			dest.push(new Item(name, [""], rank));
		});
	}
	
	function process(csvlines){
		authors = csvlines[0].slice(2);
		toUniqueItem(new Set(csvlines.slice(1).map(x => x[0])), categories, 1);
		
		categories.forEach(function(cat){
			var categoryLines = csvlines.slice(1).filter(line => line[0] == cat.itemtext)
			var subelems = [];
			toUniqueItem(new Set(categoryLines.map(x => x[1])), subelems, 2);
			elems = elems.concat(subelems);
			
			categoryLines.forEach(function(linedata){
				//process data lines for a single category
				
				links.add({from: cat.id, to: get_uuid(subelems, linedata[1])});
				var lineitems = MultiItem(linedata.slice(2)).separate();
				items = items.concat(lineitems);
				lineitems.forEach(it => links.add({from: get_uuid(subelems, linedata[1]), to: it.id}));
			});
		});	
		
		categories.forEach(function(it, index){
			var links_array = Array.from(links);
			
			var rank2 = links_array.filter(ln => it.id == ln.from)[0]
			if(!rank2)
				return;
			
			var rank3 = links_array.filter(ln => rank2.to == ln.from)[0]
			if(!rank3)
			{
				if(categories[index+1])
					links.add({from: rank2.to, to: categories[index+1].id, invisible: true});
				return;
			}
			
			if(categories[index+1])
				links.add({from: rank3.to, to: categories[index+1].id, invisible: true});
		});
		
		document.getElementById("author-box").innerHTML = 
			authors.map(function(authorName, authorIndex){
				return "<li>"+DotPainter(authorIndex, authorName)+authorName+"</li>";
			}).join("\n");
		
		document.getElementById("loaded-diagram").innerHTML =
			categories.map(x=>x.toDiv()).join("") +
			elems.map(x=>x.toDiv()).join("") +
			items.map(x=>x.toDiv(authors)).join("");
	}
	
	return {
		links: links
	}
};

var DotPainter = function(index, alttext=""){
	return "<span class=\"dot dotc" + index + "\" title=\""+alttext+"\"></span>";
};

var Item = function(itemtext, authors=[""], rank=3) {
	var id = uuidv4(Math.random());
	
	function authorText(authorNames=[""]){
		return authors ? authors.map(x => DotPainter(x, authorNames[x])).join("") : "";
	}
	
	function toDiv(authorNames=[""]){
		return "<div id=\"" + id + "\" class=\"item rank" + rank + "\">" + itemtext + "\n" + authorText(authorNames) + "</div>";
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