
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
  groupAttrs:[{},{}]
  linesMark:{}
  codecs:['xxx']
  
  lastLine

}
*/

var CurrentProject;
var Project=function(proj)
{
  if(proj instanceof Object)
  {
    this.fileNames=proj.fileNames;
    this.lineGroups=proj.lineGroups;
    this.codecs=proj.codecs;
    this.groupAttrs=proj.groupAttrs;
    this.linesMark=proj.linesMark;

    this.lastLine=proj.lastLine;
  }
  else
  {
    this.fileNames=[];
    this.lineGroups=[];
    this.codecs=[];
    this.groupAttrs=[];
    this.linesMark={};
    this.lastLine=-1;
  }
}


Project.prototype.addGroup=function(fname,lines,codec,attr)
{
  this.fileNames.push(fname);
  this.lineGroups.push(lines);
  this.codecs.push(codec);
  this.groupAttrs.push(attr);
}

Project.prototype.setGroup=function(group,fname,lines,codec,attr)
{
  this.fileNames[group]=fname;
  this.lineGroups[group]=lines;
  this.codecs[group]=codec;
  this.groupAttrs[group]=attr;
}


var getInter=(function(){
  var time=0;

  return function()
  {
    var dt=new Date();
    var time1=dt.getTime();
    var s=(time1-time);
    time=time1;
    return s;
  };
})();
var Editor=(function(){

  //private:
  var project;
  var curHighlightBox;
  var boxStatus;

  function init()
  {
    var doc=$(document);
    doc.on('click','.line1',lineClickProc);
    //doc.on('blur','#editText',editBlurProc);

    project=new Project();
    curHighlightBox={};
    boxStatus={};
  }

  function getPosFromId(id)
  {
    return {
      group:parseInt(id.slice(4,5)), //lineX_XX
      index:parseInt(id.slice(6)),
    };
  }

  function getIdFromPos(group,linesNum)
  {
    return 'line'+group+'_'+linesNum;
  }

  function lineClickProc() //"this" is not Editor
  {
    var pos=getPosFromId(this.id);
    if(!project.groupAttrs[pos.group].editable)
      return;
    var status=boxStatus[pos.index];
    if(!status)
    {
      this.innerHTML='<textarea class="editText">'+this.innerHTML+'</textarea>';
      $('.editText').flexText();
      $('.editText')[0].focus();
      boxStatus[pos.index]='editing';
    }
  }

  function editBlurProc() //"this" is not Editor
  {
    var par=this.parentElement;
    var pos=getPosFromId(par.id);
    project.lineGroups[pos.group][pos.index]=this.value;
    boxStatus[getPosFromId(par.id).index]='';
    this.outerText=this.value;
  }

  function setHtmlLineCount(cnt)
  {
    var frame=$('.lines')[0];
    var childCnt=frame.children.length;
    if(childCnt>cnt)
    {
      for(var i=childCnt-1;i>=cnt;i--)
      {
        frame.removeChild(frame.children[i]);
      }
    }
    else if(childCnt<cnt)
    {
      //var fr=document.createDocumentFragment();
      for(var i=childCnt;i<cnt;i++)
      {
        frame.appendChild($('<p class="para" id="para"'+childCnt+'></p>')[0]);
      }
      //frame.appendChild(fr);
    }
  }

  function getHtmlLineCount()
  {
    return $('.lines')[0].children.length;
  }

  function setParaLine(para,group,idx,str)
  {
    var before=null;
    for(var i=0;i<para.children.length;i++)
    {
      var tg=getPosFromId(para.children[i].id).group;
      if(group==tg)
      {
        before=i;
        break;
      }
      else if(group<tg)
      {
        before=para.children[i];
        break;
      }
    }
    if(typeof(before)=='number')
    {
      para.children[i].textContent=str;
      return;
    }
    var ele=$('<div class="line'+group+'" id="'+getIdFromPos(group,idx)+'">'+Misc.encodeHtml(str)+'</div>')[0];
    para.insertBefore(ele,before);
  }

  //public:
  function setLines(group,ls,attr)
  {
    project.lineGroups[group]=ls;
    project.groupAttrs[group]={};
    project.setGroup(group,'',ls,'utf16le',attr);
  }

  function setGroupAttr(group,attr)
  {
    project.groupAttrs[group]=attr;
  }

  function getLines(group,ls)
  {
    if(group>=project.lineGroups.length)
      throw "group not exists";
    return project.lineGroups[group];
  }

  function getGroupAttr(group)
  {
    return project.groupAttrs[group];
  }

  function clearAll()
  {
    $('.lines')[0].textContent='';
    project=new Project();
    curHighlightBox=null;
    boxStatus={};
  }

  function linkProject(proj)
  {
    project=new Project(proj);
  }

  function getLineInHtml(group,idx)
  {
    var l=document.getElementById(getIdFromPos(group,idx));
    if(l==undefined)
      return null;
    if(l.children.length!=0) //assume the children is textarea
      return l.children[0].value;
    return l.textContent;
  }

  function setLineInHtml(group,idx,str)
  {
    var l=document.getElementById(getIdFromPos(group,idx));
    if(l==undefined)
      return false;
    l.textContent=str;
    return true;
  }

  function updateLines(group)
  {
    if(group===undefined)
    {
      var maxLineCnt=Math.max.apply(null,project.lineGroups.map(function(ls){return ls.length}));
      setHtmlLineCount(maxLineCnt); 
      for(var i=0;i<project.lineGroups.length;i++)
        updateLines(i);
      return;
    }

    if(group>=project.lineGroups.length)
      return;

    var ls=project.lineGroups[group];
    if(!ls)
      return;
    getInter();
    if(ls.length>getHtmlLineCount())
      setHtmlLineCount(ls.length);
    console.log('1',getInter());
    var paras=$('.para');
    for(var i=0;i<ls.length;i++)
    {
      setParaLine(paras[i],group,i,ls[i]);
    }
    console.log('1',getInter());
  }

  init();

  return {
    setLines:setLines,
    getLines:getLines,
    setGroupAttr:setGroupAttr,
    getGroupAttr:getGroupAttr,

    linkProject:linkProject,

    setLineInHtml:setLineInHtml,
    getLineInHtml:getLineInHtml,

    updateLines:updateLines,

    clearAll:clearAll,
  };
})();

function Init()
{
  $('.lines').css('height',window.innerHeight-20);
  $(window).on('resize',function(){
    $('.lines').css('height',window.innerHeight-20);
  });
    /*var ls1=['abc','呵呵','wocao','测试测试'];
      var ls2=['abc</div><div>he','呵呵2','wocal','擦你妹'];
      for(var i=0;i<100;i++)
      {
        ls1.push(ls1[((i*9)%7)&3]);
        ls2.push(ls2[((i*13)%9)&3]);
      }
        var proj=CurrentProject=new Project();
        Editor.linkProject(proj);
        proj.addGroup('',ls1,1,{});
        proj.addGroup('',ls2,1,{editable:true});
        Editor.updateLines();*/


  $('#btn_open').on('click',function()
  {
    Misc.chooseFile('#openFile',function(evt)
    {
      var fname=this.value;
      comm.emit('c_sendCmd','cmd=parseText',fname,
      function(ls,codec)
      {
        var proj=CurrentProject=new Project();
        Editor.linkProject(proj);
        proj.addGroup(fname,ls,codec,{});

        var newScName=Misc.genNewScPath(fname);
        if(Misc.existsFile(newScName))
        {
          comm.emit('c_sendCmd','cmd=parseText',newScName,
          function(ls,codec)
          {
            CurrentProject.addGroup(newScName,ls,codec,{editable:true});
            Editor.updateLines(1);
          });
        }

        Editor.updateLines(0);
      });
    });
  });
}

