  //nodejs in native:

var gLog=function(){console.log.apply(console,arguments)}

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

  function s_parseText(ls,cb)
  {
    cb(ls.lines,ls.codec);
  }

  function s_saveText(cb)
  {
    cb();
  }

  function s_parseProj(proj,cb)
  {
    cb(proj);
  }

  function s_saveProj(cb)
  {
    cb();
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
