	//nodejs in native:
var comm=(function(){
	var events=require('events');

	function addingProj(proj)
	{
		var ls1=proj.linesOri;
		var ls2=proj.linesOri.slice(0);
		for(var i in proj.linesMod)
		{
			ls2[i]=proj.linesMod[i];
		}
		Editor.setLines(ls1,ls2);
	}

	var ev=new events.EventEmitter();
	ev.on('addingProj',addingProj);

	return ev;
})();

//nodejs in backend
if(module!==undefined) module.exports=comm;