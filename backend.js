var fs=require('fs');
var querystring=require('querystring');
var iconv=require('iconv-lite');
//var uiproc=require('./uiproc');
//var configs=require('./configs')

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

/*
config:
{
	colors:
	{
		
	}
}
*/

/*
 *project:
 *{
 *	linesOri:[...]
 *	linesMod:{1:XX,3:XX}
 *	linesMark:{}
 *	codecOfOri:'xxx'
 *	codecOfNew:'xxx'
 *	
 *}
 */

function createProject(cmd,data)
{
	var oriFileName=cmd.oriFileName;
	if(oriFileName===undefined)
		throw "must have oriFileName";
	if(typeof(oriFileName)!='string')
		throw "oriFileName must be unique";

	var codec=cmd.codec;
	if(codec && !iconv.encodingExists(codec))
		throw "unknown codec";

	fs.readFile(oriFileName,function(err,data)
	{
		if(err) throw err;
		
		var proj=readLinesOfFile;
		
		var ff=iconv.encode(JSON.stringify(proj),'utf16le');
		
	});
}

function openProject(cmd)
{
	var fname=cmd.name;
	if(fname===undefined)
		throw "no proj name in openProject";
	if(typeof(fname)!='string')
		throw "proj name must be unique";
	fs.readFile(fname+'.proj',function(err,data){
		if(err) throw err;
		var proj=JSON.parse(data.toString('utf16le'));
		uiproc.addingProject(proj);
	});
	return 'reading';
}

function readLinesOfFile(data,codec)
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
		linesOri:lines,
		codecOri:codec,
	};
}