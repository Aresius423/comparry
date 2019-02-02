var minScale = 0.4;
var maxScale = 200;
var incScale = 0.1;
var plumb = null;
var $parent = $(".parent");
$diagram = $parent.find(".diagram");

(function() {
          var $section = $('#focal');
          var $panzoom = $section.find('.panzoom').panzoom();
          $panzoom.parent().on('mousewheel.focal', function( e ) {
            e.preventDefault();
            var delta = e.delta || e.originalEvent.wheelDelta;
            var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
            $panzoom.panzoom('zoom', zoomOut, {
              animate: false,
              focal: e
            });
          });
        })();

jsPlumb.ready(function() {
  plumb = jsPlumb.getInstance({
    PaintStyle: { strokeWidth: 1 },
    Anchors: [["Left","Right","Bottom"], ["Top","Bottom"]],
    parent: $diagram,
  });
  
  links.forEach(function(link){
	   var connection = plumb.connect({
       source:link.from,
       target:link.to,
       connector: [ "Flowchart",
        {
          cornerRadius: 3,
          stub:16
        }
       ],
       endpoints:["Blank","Blank"],
	   anchors:["Bottom", "Top"],
       overlays:[["Arrow",{location:1,width:10, length:10}]],
     });
	 if(connection && link.invisible)
		 connection.setVisible(false);
  });
  var dg = new dagre.graphlib.Graph();
  dg.setGraph({nodesep:30,ranksep:30,marginx:50,marginy:50,rankdir:"TD",align:"UL"});
  dg.setDefaultEdgeLabel(function() { return {}; });
  $parent.find(".item").each(
    function(idx, node) {
      var $n = $(node);
      var box = {
        width  : Math.round($n.outerWidth()),
        height : Math.round($n.outerHeight())
      };
      dg.setNode($n.attr('id'), box);      
    }
  );
  plumb.getAllConnections()
    .forEach(function(edge) {dg.setEdge(edge.source.id,edge.target.id);});
  dagre.layout(dg);
  var graphInfo = dg.graph();
  dg.nodes().forEach(
    function(n) {
      var node = dg.node(n);
      var top = Math.round(node.y-node.height/2)+'px';
      var left = Math.round(node.x-node.width/2)+'px';
      $('#' + n).css({left:left,top:top});
    });
  
  plumb.repaintEverything();
  document.getElementById("loading-box").style.display="none";
});