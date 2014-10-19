
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

Project.prototype.saveProject=function(cb)
{
  var fname=this.fileNames[0];
  if(!fname)
    return;
  comm.emit('c_sendCmd','cmd=saveProj&name='+encodeURI(fname),this,cb);
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
  //var curHighlightBox;
  var undoList;

  function init()
  {
    var doc=$(document);
    doc.on('click','.line1',lineClickProc);
    doc.on('blur','.editText',editBlurProc);
    doc.on('keypress','.editText',editKeyPressProc);
    //doc.on('click','.para',paraClickProc);

    clearAll();
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

  function getQuotedText(str)
  {
    var start=0;
    var end=str.length;
    for(var i=0;i<configs.selectPattern.length;i++)
    {
      var rslt=configs.selectPattern[i].exec(str);
      if(rslt)
      {
        start=rslt.index+1;
        end=start+rslt[1].length;
        break;
      }

    }
    return {start:start,end:end};
  }

  function lineClickProc() //"this" is not Editor
  {
    var pos=getPosFromId(this.id);
    if(!project.groupAttrs[pos.group].editable)
      return;
    if(!this.myIsEditing)
    {
      var selection=getQuotedText(this.textContent);
      this.innerHTML='<textarea class="editText">'+this.innerHTML+'</textarea>';

      $('.editText').flexText();
      var te=$('.editText')[0];
      te.myPos=pos;
      te.focus();
      te.selectionStart=selection.start;
      te.selectionEnd=selection.end;
      this.myIsEditing=true;
    }
  }

  function editBlurProc() //"this" is not Editor
  {
    var pos=this.myPos;
    modifyLine(pos.group,pos.index,this.value);
  }
  function editKeyPressProc(e)
  {
    if(e.which==13)
    {
      //console.dir(this);
      var pos=this.myPos;
      editBlurProc.apply(this);
      if(pos.index<project.lineGroups[pos.group].length-1)
      {
        var nextLine=$('#'+getIdFromPos(pos.group,pos.index+1));
        if(nextLine)
        {
          //console.dir(nextLine);
          var ls=$('.lines');
          var destTop=nextLine[0].offsetTop-window.innerHeight/2+nextLine.height();
          if(ls.scrollTop()<destTop)
          {
            ls.animate({scrollTop:destTop},300);
          }
          nextLine.click();
        }
      }
      return false;
    }
  }

  function paraClickProc()
  {
    var rect=$('#hlRect');
    if(rect.length==0)
    {
      console.log('creating');
      rect=$('<div id="hlRect"></div>');
      $('.lines')[0].appendChild(rect[0]);
    }
    th=$(this);
    rect.css({
      height:th.height(),
      width:th.width()-2,
      display:"block",
      left:th[0].offsetLeft,
      top:th[0].offsetTop-2,
    });
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
        frame.appendChild($('<p class="para" id="para'+i+'"></p>')[0]);
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

  function getLineInHtml(group,idx)
  {
    var l=document.getElementById(getIdFromPos(group,idx));
    if(l==undefined)
      return null;
    // if(l.children.length!=0) //assume the children is textarea
    //   return l.children[0].value;
    return l.textContent;
  }

  function setLineInHtml(group,idx,str,isMod)
  {
    var l=$('#'+getIdFromPos(group,idx));
    if(l.length==0)
      return false;
    l[0].textContent=str;
    l[0].myIsEditing=false;
    if(isMod)
      l.addClass('modifiedLine');
    return true;
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

  function modifyLine(group,idx,str)
  {
    var oldStr=project.lineGroups[group][idx];
    if(oldStr==str)
    {
      setLineInHtml(group,idx,str,false);
      return;
    }
    project.lineGroups[group][idx]=str;
    setLineInHtml(group,idx,str,true);
  }

  function clearAll()
  {
    $('.lines')[0].textContent='';
    project=new Project();
    //curHighlightBox=-1;
    undoList=[];
    undoList.savedIdx=0;
    undoList.curIdx=0;

  }

  function linkProject(proj)
  {
    project=new Project(proj);
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

  function isModified()
  {
    return true;
    return !(undoList.savedIdx==undoList.length);
  }

  function setUndoSaved()
  {
    undoList.savedIdx=undoList.length;
  }

  init();

  return {
    setLines:setLines,
    getLines:getLines,
    setGroupAttr:setGroupAttr,
    getGroupAttr:getGroupAttr,
    modifyLine:modifyLine,

    linkProject:linkProject,

    updateLines:updateLines,
    isModified:isModified,

    setUndoSaved:setUndoSaved,

    clearAll:clearAll,
  };
})();

var App=(function(){

    var windowTitle="Node-Line Editor";

    function init()
    {
      $('#btn_open').on('click',buttonOpen);
      $('#btn_save').on('click',buttonSave);
      $('#btn_close').on('click',buttonClose);
    }

    function showModalDialog(text,type,callback)
    {
      var cnt=1;
      var btntext=[CurLang.confirmOk];
      if(type=='yesno')
      {
        cnt=2;
        btntext=[CurLang.confirmYes,CurLang.confirmNo];
      }
      else if(type=='okcancel')
      {
        cnt=2;
        btntext=[CurLang.confirmOk,CurLang.confirmCancel];
      }
      else if(type=='yesnocancel')
      {
        cnt=3;
        btntext=[CurLang.confirmYes,CurLang.confirmNo,CurLang.confirmCancel];
      }
      //else use ok

      var eles='';
      for(var i=0;i<cnt;i++)
      {
        eles+=Misc.format('<div class="confirmButton animButton" id="confirmButton{0}">{1}</div>',i,btntext[i]);
      }
      eles+='<br/>';
      var group=$('#confirmButtonGroup');
      group[0].textContent='';
      eles=$(eles);
      eles.css('width',100/cnt+'%');
      group.append(eles);
      $('#confirmTextBox')[0].textContent=text;

      var userSelect=-1;
      $('.confirmButton').on('click',function(evt){
        userSelect=this.id.slice(-1);
        $.magnificPopup.close();
      });

      $.magnificPopup.open({
        items: {
          src: '#confirmBox'
        },
        type: 'inline',
        removalDelay: 300,
        mainClass: 'mfp-fade',
        showCloseBtn:false,
        callbacks:{close: function(arg){
          callback(userSelect);
        }},
      }, 0);
    }

    function showHint(text,color)
    {
      var hintbox=$('#hintBox');
      hintbox[0].innerText=text;
      color=color||'red';
      hintbox.css('color',color);

      hintbox.css('opacity',1);
      setTimeout(function(){
        if($('#hintBox')[0].innerText==text)
          hintbox.css('opacity',0);
      },4000);
    }

    function testSave(cb)
    {
      if(Editor.isModified())
      {
        showModalDialog(CurLang.confirmSaveFile,'yesnocancel',function(sel){
          if(sel==2 || sel==-1)
            return;
          else if(sel==0)
          {
            buttonSave(cb);
          }
          else
          
            cb();
        });
      }
      else
        cb();
    }

    function buttonOpen()
    {
      testSave(choose);

      function choose()
      {
        Misc.chooseFile('#openFile',function (evt)
        {
          //删除本次事件监听器
          setTimeout(function(){
            var chooser = document.querySelector('#openFile');
            chooser.removeEventListener('change',chooser.changeEve,false);
          },1500);
          var fname=this.value;
          if(fname.slice(-4)=='.txt')
          {
          comm.emit('c_sendCmd','cmd=parseText',fname,
          function(err,ls,codec)
          {
            if(err)
            {
              showHint(err);
              return;
            }
            Editor.clearAll();
            var proj=CurrentProject=new Project();
            Editor.linkProject(proj);
            proj.addGroup(fname,ls,codec,{});

            if(configs.useNewsc=='ifexists' ||
                configs.useNewsc=='always')
            {
              var newScName=Misc.genNewScPath(fname);
              if(Misc.existsFile(newScName))
              {
                comm.emit('c_sendCmd','cmd=parseText',newScName,
                function(err,ls,codec)
                {
                  if(err)
                  {
                    showHint(err);
                    return;
                  }
                  CurrentProject.addGroup(newScName,ls,codec,{editable:true});
                  Editor.updateLines(1);
                });
              }
              else if(configs.useNewsc=='always')
              {
                proj.addGroup(newScName,ls.slice(0),codec,{editable:true});
              }
            }

            Editor.updateLines();
            setWindowTitle(false);
          });
          }
          else
          {
          comm.emit('c_sendCmd','cmd=parseProj',fname,function(err,proj){
            if(err)
            {
              showHint(err);
              return;
            }
            proj=CurrentProject=new Project(proj);
            Editor.clearAll();
            Editor.linkProject(proj);
            Editor.updateLines();
            setWindowTitle(false);
          });
          }
        });
      }
    }

    function buttonSave(cb)
    {
      if(Editor.isModified())
      {
        var proj=CurrentProject;
        proj.saveProject(function(err){
          if(err)
          {
            showHint(err);
            return;
          }
          showHint(Misc.format(CurLang.fileSaved,Misc.genProjName(proj.fileNames[0])));
          Editor.setUndoSaved();
          setWindowTitle(false);
          if(proj.fileNames[1].indexOf('NewSc')!=-1 ||
            (configs.useNewsc=='always' && proj.fileNames[0].slice(-5)!='.proj'))
          {
            comm.emit('c_sendCmd','cmd=saveText&name='+encodeURI(proj.fileNames[1])+'&codec='+proj.codecs[1],proj.lineGroups[1],function(err){
              if(err)
              {
                setTimeout(function(){
                  showHint(err);
                },1000);
                return;
              }
              if(typeof(cb)=='function')
              {
                cb();
              }
            });
          }
          else
          {
            if(typeof(cb)=='function')
            {
              cb();
            }
          }
        });



      }
    }

    function buttonClose()
    {
      testSave(close);

      function close()
      {
        Editor.clearAll();
        CurrentProject=new Project();
        setWindowTitle(false);
      }
    }

    function setWindowTitle(modified)
    {
      if(!CurrentProject || !CurrentProject.fileNames[0])
        document.title=windowTitle;
      else
      {
        if(!modified)
          document.title=CurrentProject.fileNames[0]+' - '+windowTitle;
        else
          document.title=CurrentProject.fileNames[0]+' * - '+windowTitle;
      }
    }

    init();

    return {
      showModalDialog:showModalDialog,
      showHint:showHint,
      windowTitle:windowTitle,
      setWindowTitle:setWindowTitle,
      testSave:testSave,
    };
})();

var Window = require('nw.gui').Window.get();
function Init()
{
  //设置主div高度
  $('.lines').css('height',window.innerHeight-20);
  $(window).on('resize',function(){
    $('.lines').css('height',window.innerHeight-20);
  });

  //动画按钮效果
  var doc=$(document);
  doc.on('mousedown','.animButton',function(){
    $(this).css('background','rgba(0,64,255,0.8)');
  });
  doc.on('mouseup','.animButton',function(){
    $(this).css('background','rgba(0,64,255,0.5)');
  });

  //全局按键绑定
  doc.on('keydown','body',function(e){
    if(e.keyCode==123)
    {
      Window.showDevTools();
    }
    else if(e.keyCode==116)
      window.location.reload();
  });

  //全局事件绑定
  Window.on('close',function(){
    App.testSave(function(){Window.close(true)})
  });

  App.setWindowTitle();
  CurrentProject=new Project();
}

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
