  //nodejs in native:

var gLog=function(){console.log.apply(console,arguments)}

var comm=(function(){
  var events=require('events');
  var iconv=require('iconv-lite');
  var fs=require('fs');

  function s_parseText(err,ls,cb)
  {
    cb(err,ls.lines,ls.codec);
  }

  function s_saveText(err,cb)
  {
    cb(err);
  }

  function s_parseProj(err,proj,cb)
  {
    cb(err,proj);
  }

  function s_saveProj(err,cb)
  {
    cb(err);
  }

  function s_loadConfig(err,conf,cb)
  {
    cb(err,conf);
  }

  function s_saveConfig(err,cb)
  {
    cb(err);
  }

  function s_error(e)
  {
    gLog("error occured",e);
  }

  function c_sendCmd(cmd,data,cb)
  {
    Backend.recvCmd(cmd,data,cb)
  }

  var ev=new events.EventEmitter();
  ev.on('s_parseText',s_parseText);
  ev.on('s_saveText',s_saveText);
  ev.on('s_parseProj',s_parseProj);
  ev.on('s_saveProj',s_saveProj);
  ev.on('s_error',s_error);
  ev.on('c_sendCmd',c_sendCmd);

  return ev;
})();

//nodejs in backend
