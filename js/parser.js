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

var authors = [];
var categories = [];
var elems = [];
var items = [];
var links = new Set();

Set.prototype.filter = function filter(f) {
  var newSet = new Set();
  for (var v of this) if(f(v)) newSet.add(v);
  return newSet;
};

function resetData() {
	authors = [];
	categories = [];
	elems = [];
	items = [];
	links.clear();
}

var Parser = function(path = "data/Hungarian_Sabre_sources_and_techiques.csv") {
	var csvlines = [];
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		var textlines = xmlhttp.responseText.split('\r\n').filter(l => l.trim());
		csvlines = textlines.map(x => Csv.parse(x));
		process();
		}
	};
	xmlhttp.open("GET",path,true);
	xmlhttp.overrideMimeType('text/xml; charset=utf-8');
	xmlhttp.send();
	
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
	
	function toAuthorRow(authorName, authorIndex){
		var cbrow = "<input type='checkbox' id='authorcb${authorIndex} ' class='authorcb' checked>"
	return `<li>${cbrow}${DotPainter(authorIndex, authorName)}${authorName}</li>`;
	}
	
	function toTableItem(type, string){
		return `<${type} class=\"tg-0lax\">${string}</${type}>`;
	}
	
	function process(filterAuthors = []){	
		resetData();
		authors = csvlines[0].slice(2);
		toUniqueItem(new Set(csvlines.slice(1).map(x => x[0])), categories, 1);
		
		var filteredLines = csvlines.slice(1);
		if(filterAuthors.length)
		{
			filteredLines = csvlines.slice(1).map(x => x.map(function(data, index){
				return filterAuthors.includes(index-2) ? "" : data;
			}));
		}
		
		var tableHeader = [csvlines[0].map(e => toTableItem("th", e)).join("\n")];
		var tableLines = filteredLines.map(
				row => "<tr>\n\t" + row.map(e => toTableItem("td", e)).join("\n") + "\n</tr>"
			);
		var tableText = tableHeader.concat(tableLines).join("\n");
		
		categories.forEach(function(cat){
			var categoryLines = filteredLines.filter(line => line[0] == cat.itemtext)
			
			categoryLines.forEach(function(linedata){
				//process data lines for a single category
				
				
				var lineitems = MultiItem(linedata.slice(2)).separate();
				if(lineitems.length){
					var subelem = new Item(linedata[1], [], 2);
					elems.push(subelem);
					links.add({from: cat.id, to: subelem.id}); //cat -> elem
					items = items.concat(lineitems);
					lineitems.forEach(it => links.add({from: subelem.id, to: it.id}));
				}				
			});
		});

		var nonEmptyCategories = categories.filter(categoryItem => {
			var z = links.filter(ln => ln.from == categoryItem.id);
			return(z.size);
		});
		
		nonEmptyCategories.forEach(function(it, index){
			//add invisible edges to the graph for a vertical layout
			
			var links_array = Array.from(links);
			
			var rank2 = links_array.filter(ln => it.id == ln.from)[0]
			if(!rank2)
				return;
			
			var rank3 = links_array.filter(ln => rank2.to == ln.from)[0]
			
			var lastChildNodeID = rank3 ? rank3.to : rank2.to;
			
			if(nonEmptyCategories[index+1])
				links.add({from: lastChildNodeID, to: nonEmptyCategories[index+1].id, invisible: true});
		});
		
		document.getElementById("loaded-data").innerHTML = tableText;
		
		var authorRows = authors.map(toAuthorRow)
		var checkAdjustedAuthorRows = authorRows.map(function(row, index){
			return filterAuthors.includes(index) ? row.replace("checked", "") : row;
		})
		document.getElementById("author-box").innerHTML = 
			checkAdjustedAuthorRows.join("\n");
			
		filterAuthors.forEach(id => {
			var colID = id+3;
			$(`td:nth-child(${colID}),th:nth-child(${colID})`).hide()
		});
		
		document.getElementById("loaded-diagram").innerHTML =
			nonEmptyCategories.map(x=>x.toDiv()).join("") +
			elems.map(x=>x.toDiv()).join("") +
			items.map(x=>x.toDiv(authors)).join("");
	}
	
	return {
		links: links,
		process: process
	}
};

var DotPainter = function(index, alttext=""){
	return `<span class=\"dot dotc${index}\" title=\"${alttext}\"></span>`;
};

var Item = function(itemtext, authors=[""], rank=3) {
	var id = uuidv4(Math.random());
	
	function authorText(authorNames=[""]){
		return authors ? authors.map(x => DotPainter(x, authorNames[x])).join("") : "";
	}
	
	function toDiv(authorNames=[""]){
		// if every author belonging to this item is filtered out, it shouldn't be printed
		return authorNames.length ?
			`<div id=\"${id}\" class=\"item rank${rank}\">${itemtext}\n${authorText(authorNames)}</div>`
			: ``;
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