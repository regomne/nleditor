	//nodejs in native:
var comm=(function(){
	var events=require('events');
	var iconv=require('iconv-lite');
	var fs=require('fs');

	function setProject(proj)
	{
		Editor.clearAll();
		for(var i=0;i<proj.lineGroups.length;i++)
		{
			Editor.setLines(i,proj.lineGroups[i]);
		}
		Editor.updateLines();
	}

	function exportText(ls,codec,fileName)
	{
		var bin=iconv.encode(ls.join('\r\n'),codec);
		fs.writeFile(fileName,bin,function(err)
		{
			if(err) throw err;
		});
	}

	var ev=new events.EventEmitter();
	ev.on('setProject',setProject);

	return ev;
})();

//nodejs in backend
