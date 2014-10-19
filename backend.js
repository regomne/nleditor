var Backend=(function(){
  var fs=require('fs');
  var querystring=require('querystring');
  var path=require('path');
  var iconv=require('iconv-lite');
  //var comm=require('./communication');

  //private:
  function splitTxtFile(data,codec)
  {
    if(codec===undefined)
    {
      if(data[0]==0xfe && data[1]==0xff)
      codec='utf16be';
      else if(data[0]==0xff && data[1]==0xfe)
      codec='utf16le';
      else if(data[0]==0xef && data[1]==0xbb && data[2]==0xbf)
      codec='utf8';
      else
      codec='ascii';
    }

    var str=iconv.decode(data,codec);
    var lines=str.split('\r\n');
    return {
      lines:lines,
      codec:codec,
    };
  }

  function genTextName(fname)
  {
    return fname;
  }
  function genProjName(fname)
  {
    if(fname.slice(-4)=='.txt')
      return fname.slice(0,-4)+'.proj';
    if(fname.slice(-5)=='.proj')
      return fname;
    return fname+'.proj';
  }
  function mkdirs(dirpath)
  {
    var exists=path.existsSync(dirpath);
    if(!exists)
    {
      mkdirs(path.dirname(dirpath));
      fs.mkdirSync(dirname);
    }
  };

  function throwError(evt,err)
  {
    comm.emit.apply(this,arguments);
  }

  function parseText(cmd,data,callback)
  {
    var fname=genTextName(data);
    var codec=cmd.codec;
    if(codec && !iconv.encodingExists(codec))
    {
      throwError('s_parseText','unknown codec',{},callback);
      return;
    }

    fs.readFile(fname,function(err,data)
    {
      if(err)
      {
        throwError('s_parseText',err.message,{},callback);
        return;
      }
      var readLs=splitTxtFile(data,codec);
      comm.emit('s_parseText',null,readLs,callback);
      gLog('text:',fname,'parsed');
    });
  }

  function saveText(cmd,data,callback)
  {
    var ls=data;
    var fname=cmd.name;
    if(fname===undefined)
    {
      throwError('s_saveText',"no file name",callback);
      return;
    }
    if(typeof(fname)!='string')
    {
      throwError('s_saveText',"file name must be unique",callback);
      return;
    }
    fname=genTextName(fname);

    var codec=cmd.codec;
    if(codec && !iconv.encodingExists(codec))
    {
      throwError('s_saveText','unknown codec',callback);
      return;
    }
    if(!codec)
      codec='utf8';

    var bin=iconv.encode(ls.join('\r\n'),codec);
    mkdirs(path.dirname(fname));
    fs.writeFile(fname,bin,function(err)
    {
      if(err)
      {
        throwError('s_saveText',err.message,callback);
        return;
      }
      comm.emit('s_saveText',null,callback);
      gLog('text:',fname,'saved');
    });
  }

  function parseProj(cmd,data,callback)
  {
    var fname=genProjName(data);
    fs.readFile(fname,function(err,data)
    {
      if(err)
      {
        throwError('s_parseProj',err.message,null,callback);
        return;
      }
      var proj=JSON.parse(iconv.decode(data,'utf16le'));
      comm.emit('s_parseProj',null,proj,callback);
      gLog('proj:',fname,'parsed');
    });
  }

  function saveProj(cmd,data,callback)
  {
    var proj=data;
    var fname=cmd.name;
    if(fname===undefined)
    {
      throwError('s_saveProj',"no file name",callback);
      return;
    }
    if(typeof(fname)!='string')
    {
      throwError('s_saveProj',"file name must be unique",callback);
      return;
    }
    fname=genProjName(fname);
    mkdirs(path.dirname(fname));

    var bin=iconv.encode(JSON.stringify(proj),'utf16le');
    fs.writeFile(fname,bin,function(err)
    {
      if(err)
      {
        throwError('s_saveProj',err.message,callback);
        return;
      }
      comm.emit('s_saveProj',null,callback);
      gLog('proj:',fname,'saved');
    });
  }

  function recvCmd(qs,data,callback)
  {
    gLog(qs,'recved');
    var cmd=querystring.parse(qs);
    if(cmd['cmd']===undefined)
    {
      gLog('no cmd.');
      comm.emit('s_error','no cmd');
    }

    var dispTable={
      parseText:parseText,
      parseProj:parseProj,
      saveText:saveText,
      saveProj:saveProj,
    };

    if(dispTable[cmd['cmd']]!=undefined)
    {
      try
      {
      dispTable[cmd['cmd']](cmd,data,callback);
      }
      catch(e)
      {
      gLog('processing',cmd['cmd'],'err occured: ',e);
      comm.emit('s_error',e);
      }
    }
    else
    {
      gLog('err cmd: ',cmd['cmd']);
      comm.emit('s_error','err cmd: '+cmd['cmd']);
    }
  }

  return {
    recvCmd:recvCmd,
  };

})();