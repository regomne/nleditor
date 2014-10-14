	//nodejs in native:
var CurrentProject;

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
		CurrentProject=proj;
	}

	function exportText(ls,codec,fileName)
	{
		var bin=iconv.encode(ls.join('\r\n'),codec);
		fs.writeFile(fileName,bin,function(err)
		{
			if(err) throw err;
		});
	}

	function addGroupToCurrent(fname,ls,codec)
	{
		var proj=CurrentProject;
		var curi=proj.lineGroups.length;
		proj.fileNames.push(fname);
		proj.lineGroups.push(ls);
		proj.codecs.push(codec);

		Editor.setLines(curi,proj.lineGroups[curi]);
		Editor.updateLines(curi);
	}

	function duplicateGroup(group)
	{
		var proj=CurrentProject;
		var curi=proj.lineGroups.length;
		proj.fileNames.push('');
		proj.lineGroups.push(proj.lineGroups[curi-1].slice(0));
		proj.codecs.push(proj.codecs[curi-1]);

		Editor.setLines(curi,proj.lineGroups[curi]);
		Editor.setGroupAttr(curi,{editable:true})
		Editor.updateLines(curi);
	}

	var ev=new events.EventEmitter();
	ev.on('setProject',setProject);
	ev.on('exportText',exportText);
	ev.on('addGroupToCurrent',addGroupToCurrent);
	ev.on('duplicateGroup',duplicateGroup);

	return ev;
})();

//nodejs in backend
