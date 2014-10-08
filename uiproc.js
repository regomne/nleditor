//nodejs in native:
var uiproc=(function(){
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

	return {
		addingProject:addingProj,
	};
})();

//nodejs in backend
if(module!==undefined) module.exports=uiproc;