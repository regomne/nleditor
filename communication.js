	//nodejs in native:
var comm=(function(){
	var events=require('events');

	function setProject(proj)
	{
		Editor.clearAll();
		for(var i=0;i<proj.lineGroups.length;i++)
		{
			Editor.setLines(i,proj.lineGroups[i]);
		}
		Editor.updateLines();
	}

	

	var ev=new events.EventEmitter();
	ev.on('setProject',setProject);

	return ev;
})();

//nodejs in backend
if(module!==undefined) module.exports=comm;