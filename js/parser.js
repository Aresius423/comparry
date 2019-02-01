var Parser = function(path = "data/Hungarian_Sabre_sources_and_techiques.csv") {
	//parse file here
	
	var txt = '';
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
		var csvlines = xmlhttp.responseText.split('\n');
		csvlines.forEach(function(line){
			console.log(line);
		});
	  }
	};
	xmlhttp.open("GET",path,true);
	xmlhttp.send();

	
	function divify(itemtext) {
		if(itemtext != "" && itemtext != "-")
			document.write("<div class = \"item\">" + itemtext + "</div>");
	}
	
	function test() {
	   document.write("<div id=\"i0\"  class=\"item\">Root!</div>     ");
       document.write("<div id=\"i1\" class=\"item\">Child 1</div>    ");
       document.write("<div id=\"i11\" class=\"item\">Child 1.1</div> ");
       document.write("<div id=\"i12\" class=\"item\">Child 1.2</div> ");
       document.write("<div id=\"i2\" class=\"item\">Child 2</div>    ");
       document.write("<div id=\"i21\" class=\"item\">Child 2.1</div> ");
       document.write("<div id=\"i3\" class=\"item\">Child 3</div>    ");
	   
	   csv.parse("Distances,Complete distance,-,Complete distance,,\"Távol\",\Nagy távolság\",,,").forEach(divify);
	}
	
	return {
		test: test
	}
};

//var Item = function(category, elem, 

var csv = function() {
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

function getText(path){
    // read text from URL location
    var request = new XMLHttpRequest();
    request.open('GET', 'https://pastebin.com/raw/2juPRm32', true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var type = request.getResponseHeader('Content-Type');
            if (type.indexOf("text") !== 1) {
                return request.responseText;
            }
        }
    }
}