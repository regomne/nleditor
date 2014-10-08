var fs=require('fs');
var querystring=require('querystring');
//var uiproc=require('./uiproc');

function recvCmd(qs,data)
{
	console.log(qs,'recved');
	var cmd=querystring.parse(qs);
	if(cmd['cmd']===undefined)
	{
		console.log('no cmd.');
		return undefined;
	}

	var dispTable={
		openProject:openProject,
		createProject:createProject,
	};

	var ret=undefined;
	if(dispTable[cmd['cmd']]!=undefined)
	{
		try
		{
			ret=dispTable[cmd['cmd']](cmd,data);
		}
		catch(e)
		{
			console.log('err occured',e);
		}
	}
	else
	{
		console.log('err cmd: ',cmd['cmd']);
	}
	return ret;
}

function openProject(cmd)
{
	var fname=cmd['name'];
	if(fname===undefined)
		throw "no proj name in openProject";
	if(typeof(fname)!='string')
		throw "proj name must be unique";
	fs.readFile(fname+'.proj',function(err,data){
		if(err) throw err;
		var proj=JSON.parse(data);
	});
	return 'reading';
}