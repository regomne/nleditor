var fs=require('fs');
var querystring=require('querystring');
var path=require('path');
var iconv=require('iconv-lite');
//var comm=require('./communication');
//var configs=require('./configs')
var gLog=function(){console.log.apply(console,arguments)}

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
		openProject:ProjectManager.openProject,
		createProject:ProjectManager.createProject,
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
			console.log('err occured: ',e);
		}
	}
	else
	{
		console.log('err cmd: ',cmd['cmd']);
	}
	return ret;
}

/*
config:
{
	colors:
	{
		
	}
	defalutCodec
}
*/

/*
project:
{
	fileNames:['','']
	lineGroups:[[...],[...]]
	editableGroups:{}
	linesMark:{}
	codecs:['xxx']
	
	lastLine

}
*/

var ProjectManager=(function(){

	function createProject(cmd,data)
	{
		var oriFileName=cmd.name;
		if(oriFileName===undefined)
			throw "must have oriFileName";
		if(typeof(oriFileName)!='string')
			throw "oriFileName must be unique";
		
		var projName=genProjName(cmd.name);
		if(existsProject(projName.toString()))
		{
			if(cmd.options=='overwrite')
				;
			else if(cmd.options=='open')
				return openProject(cmd);
			else
				throw "proj already existing.";
		}
	
		var codec=cmd.codec;
		if(codec && !iconv.encodingExists(codec))
			throw "unknown codec";

		fs.readFile(oriFileName,readFileProc);
		return;
		
		var proj;
		function readFileProc(err,data)
		{
			if(err) throw err;
			
			var readLs=splitTxtFile(data,codec);
			proj={
				fileNames:[projName],
				lineGroups:[readLs.lines],
				codecs:[readLs.codec],
			};
			
			var bin=iconv.encode(JSON.stringify(proj),'utf16le');
			fs.writeFile(projName.toString(),bin,writeFileProc);
		}
		
		function writeFileProc(err,data)
		{
			if(err) throw err;
			gLog(projName+" created");
			comm.emit('setProject',proj);
		}
	}

	function openProject(cmd)
	{
		var fname=cmd.name;
		if(fname===undefined)
			throw "no proj name in openProject";
		if(typeof(fname)!='string')
			throw "proj name must be unique";
		var projName=genProjName(fname);
		if(!existsProject(projName))
			throw "proj not exists";
		fs.readFile(projName.toString(),function(err,data){
			if(err) throw err;
			var proj=JSON.parse(data.toString('utf16le'));
			comm.emit('setProject',proj);
		});
		return 'reading';
	}

	function saveProject(cmd,proj)
	{
		var projName=genProjName(cmd.name);
		var bin=iconv.encode(JSON.stringify(proj),'utf16le');
		fs.writeFile(projName.toString(),bin,function(err,data)
		{
			if(err) throw err;
			gLog("saved.");
		});
	}

	//private:
	function splitTxtFile(data,codec)
	{
		if(codec===undefined)
		{
			if(data[0]=='\xfe' && data[1]=='\xff')
				codec='utf16le';
			else if(data[0]=='\xff' && data[1]=='\xfe')
				codec='utf16be';
			else if(data[0]=='\xef' && data[1]=='\xbb' && data[2]=='\xbf')
				codec='utf8';
			else
				codec=configs.defaultCodec;
		}

		var str=iconv.decode(data,codec);
		var lines=str.split('\r\n');
		return {
			lines:lines,
			codec:codec,
		};
	}

	function genProjName(fname)
	{
		var baseName=path.basename(fname,'.txt')+'.proj';
		var dirName=path.dirname(fname);
		return {
			projname:baseName,
			dirname:dirName,
			toString:function(){return path.join(this.dirname,this.projname)},
		};
	}

	function existsProject(projName)
	{
		return fs.existsSync(projName.toString());
	}
/*
	function genLineGroupsFromProject(proj)
	{
		var lg=[];
		lg[0]=proj.lines0;
		for(var i=0;i<10;i++)
		{
			var mod=proj['linesMod'+i];
			if(mod!==undefined)
			{
				var ls=proj.lines0.slice(0);
				for(var j in mod)
				{
					ls[j]=mod[j];
				}
				lg[i]=ls;
			}
			else
				break;
		}
		return lg;
	}

	function genModFromTwoGroups(ori,new)
	{

	}
*/

	return {
		createProject:createProject,
		openProject:openProject,
		saveProject:saveProject,
	};

})();