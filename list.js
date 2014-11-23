var GuiNode=require('nw.gui');
var OutWindow = GuiNode.Window.get();

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

  }
  else
  {
    this.fileNames=[];
    this.lineGroups=[];
    this.codecs=[];
    this.groupAttrs=[];
    this.linesMark={};
  }
}

Project.prototype.addGroup=function(fname,lines,codec,attr)
{
  this.fileNames.push(fname);
  this.lineGroups.push(lines);
  this.codecs.push(codec);
  this.groupAttrs.push(attr);
  return this.fileNames.length-1;
}

Project.prototype.duplicateGroup=function(group,fname)
{
  var ls=this.lineGroups[group];
  if(ls==undefined)
  {
    throw "group index out of range";
    return;
  }
  return this.addGroup((fname || ''),ls.slice(0),
    this.codecs[group],this.groupAttrs[group]);
}

Project.prototype.setGroup=function(group,fname,lines,codec,attr)
{
  this.fileNames[group]=fname;
  this.lineGroups[group]=lines;
  this.codecs[group]=codec;
  this.groupAttrs[group]=attr;
}

Project.prototype.getGroupCount=function()
{
  return this.fileNames.length;
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
  var undoList;
  var modifiedSave;
  var autoSaverId;

  function init()
  {
    var doc=$('.lines');
    doc.on('click','.para',lineClickProc);
    doc.on('blur','.editText',editBlurProc);
    doc.on('keydown','.editText',editKeyPressProc);
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
    for(var i=0;i<Settings.selectPattern.length;i++)
    {
      var rslt=Settings.selectPattern[i].exec(str);
      if(rslt)
      {
        start=rslt.index+1;
        end=start+rslt[1].length;
        break;
      }

    }
    return {start:start,end:end};
  }

  function lineClickProc(e) //"this" is not Editor
  {
    var ele=e.target;
    if(ele.className.slice(0,4)!='line')
      return;
    var pos=getPosFromId(ele.id);
    if(!project.groupAttrs[pos.group].editable)
      return;
    if(!ele.myIsEditing)
    {
      var pureText=ele.textContent;
      
      ele.innerHTML='<textarea class="editText">'+ele.innerHTML+'</textarea>';

      $('.editText').flexText();
      var te=$('.editText')[0];
      te.myPos=pos;
      te.focus();
      if(Settings.autoSelectText==true)
      {
        var selection=getQuotedText(pureText);
        te.selectionStart=selection.start;
        te.selectionEnd=selection.end;
      }
      ele.myIsEditing=true;
    }
  }

  function editBlurProc() //"this" is not Editor
  {
    if(this.noModify)
      return;
    function replaceSpace(s)
    {
      return s.replace('\xa0',' ');
    }
    var pos=this.myPos;
    var newStr=replaceSpace(this.value);
    var oldStr=project.lineGroups[pos.group][pos.index];
    // if(oldStr==newStr)
    // {
    //   setLineInHtml(pos.group,pos.index,newStr);
    // }
    // else
    // {
      addUndoInfo(pos.group,pos.index,{olds:oldStr,news:newStr});
      modifyLine(pos.group,pos.index,newStr);
    // }
  }

  function scrollToLine(destLine)
  {
    var ls=$('.lines');
    var destTop=destLine[0].offsetTop-window.innerHeight/2+destLine.height();
    // if(ls.scrollTop()<destTop)
    // {
      ls.animate({scrollTop:destTop},300);
    // }
  }

  function editKeyPressProc(e)
  {
    //console.dir(e);
    if(e.which==13) //enter
    {
      //console.dir(this);
      var pos=this.myPos;
      this.blur();
      if(pos.index<project.lineGroups[pos.group].length-1)
      {
        var nextLine=$('#'+getIdFromPos(pos.group,pos.index+1));
        if(nextLine)
        {
          //console.dir(nextLine);
          scrollToLine(nextLine);
          nextLine.click();
        }
      }
      return false;
    }
    else if(e.which==27)
    {
      var pos=this.myPos;
      this.noModify=true;
      setLineInHtml(pos.group,pos.index,project.lineGroups[pos.group][pos.index]);
    }
  }

  // function paraClickProc()
  // {
  //   var rect=$('#hlRect');
  //   if(rect.length==0)
  //   {
  //     console.log('creating');
  //     rect=$('<div id="hlRect"></div>');
  //     $('.lines')[0].appendChild(rect[0]);
  //   }
  //   th=$(this);
  //   rect.css({
  //     height:th.height(),
  //     width:th.width()-2,
  //     display:"block",
  //     left:th[0].offsetLeft,
  //     top:th[0].offsetTop-2,
  //   });
  // }

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
    if(isMod===true)
      l.addClass('modifiedStart');
    else if(isMod===false)
      l.removeClass('modifiedStart');
    return true;
  }

  function switchLineStatus(lineObj,status)
  {
    if(lineObj.hasClass(status))
      lineObj.removeClass(status);
    else
      lineObj.addClass(status);
  }

  function copyUndoList(ul)
  {
    var newl=ul.slice(0,ul.curIdx);
    newl.curIdx=ul.curIdx;
    newl.savedIdx=ul.savedIdx;
    if(newl.savedIdx>newl.curIdx)
      newl.savedIdx=-1;
    return newl;
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

  function resetAutoSaver(interval)
  {
    if(autoSaverId!=undefined)
      clearInterval(autoSaverId);
    if(interval!=0)
    {
      autoSaverId=setInterval(function(){
        if(!isModified())
        {
          clearInterval(autoSaverId);
          autoSaverId=undefined;
        }
        else
        {
          App.buttonSave();
        }
      },interval*1000);
    }
  }

  function modifyLine(group,idx,str)
  {
    project.lineGroups[group][idx]=str;
    setLineInHtml(group,idx,str,true);
    App.setWindowTitle(isModified());
    if(autoSaverId==undefined && Settings.autoSaveInterval!=0 && isModified())
    {
      resetAutoSaver(Settings.autoSaveInterval);
    }
  }

  function clearAll()
  {
    $('.lines')[0].textContent='';
    project=new Project();
    //curHighlightBox=-1;
    undoList=[];
    undoList.savedIdx=0;
    undoList.curIdx=0;
    modifiedSaved={};
    if(autoSaverId!=undefined)
    {
      clearInterval(autoSaverId);
      autoSaverId=undefined;
    }
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
    return !(undoList.savedIdx==undoList.curIdx);
  }

  function isOpenFile()
  {
    return project.lineGroups.length!=0;
  }

  function setUndoSaved()
  {
    undoList.savedIdx=undoList.curIdx;
    $('.modifiedSaved').removeClass('modifiedSaved');
    modifiedSaved={};
  }

  function addUndoInfo(group,idx,str)
  {
    $('#'+getIdFromPos(group,idx)).addClass('modifiedSaved');

    if(undoList.curIdx<undoList.length)
      undoList=copyUndoList(undoList);

    undoList.push({group:group,index:idx,string:str});
    undoList.curIdx=undoList.length;
    if(modifiedSaved[idx]==undefined)
      modifiedSaved[idx]=0;
    modifiedSaved[idx]++;
  }

  function undo()
  {
    if(undoList.curIdx<=0)
      return;

    var item=undoList[undoList.curIdx-1];
    undoList.curIdx--;
    var destLine=$('#'+getIdFromPos(item.group,item.index));
    if(destLine.length!=0)
    {
      scrollToLine(destLine);
      modifyLine(item.group,item.index,item.string.olds);
      //switchLineStatus(destLine,'modifiedSaved');
      console.log(modifiedSaved[item.index]);
      if(modifiedSaved[item.index]==undefined)
        modifiedSaved[item.index]=0;
      modifiedSaved[item.index]--;
      if(modifiedSaved[item.index]==0 || modifiedSaved[item.index]==-1)
        switchLineStatus(destLine,'modifiedSaved');
    }
  }

  function redo()
  {
    if(undoList.curIdx>=undoList.length)
      return;

    var item=undoList[undoList.curIdx];
    undoList.curIdx++;
    var destLine=$('#'+getIdFromPos(item.group,item.index));
    if(destLine.length!=0)
    {
      scrollToLine(destLine);
      modifyLine(item.group,item.index,item.string.news);
      if(modifiedSaved[item.index]==undefined)
        modifiedSaved[item.index]=0;
      modifiedSaved[item.index]++;
      if(modifiedSaved[item.index]==0 || modifiedSaved[item.index]==1)
        switchLineStatus(destLine,'modifiedSaved');
    }
  }

  return {
    setLines:setLines,
    getLines:getLines,
    setGroupAttr:setGroupAttr,
    getGroupAttr:getGroupAttr,
    modifyLine:modifyLine,

    linkProject:linkProject,

    updateLines:updateLines,
    isModified:isModified,
    isOpenFile:isOpenFile,

    setUndoSaved:setUndoSaved,
    undo:undo,
    redo:redo,

    init:init,
    clearAll:clearAll,

    resetAutoSaver:resetAutoSaver,

    //debug
    getUndoList:function(){return undoList},
    getModSaved:function(){return modifiedSaved},
  };
})();

var App=(function(){

    var windowTitle="Node-Line Editor";

    function init()
    {
      $('#btn_open').on('click',buttonOpen);
      $('#btn_duplicate').on('click',buttonDuplicate);
      $('#btn_save').on('click',buttonSave);
      $('#btn_close').on('click',buttonClose);
      $('#btn_undo').on('click',Editor.undo);
      $('#btn_redo').on('click',Editor.redo);

      //动画按钮效果
      var doc=$(document);
      doc.on('mousedown','.animButton',function(){
        $(this).css('font-size','95%');
      });
      doc.on('mouseup','.animButton',function(){
        $(this).css('font-size','');
      });

      //全局按键绑定
      doc.on('keydown','body',function(e){
        //console.log(e.keyCode);
        if(e.keyCode==123) //F12
        {
          OutWindow.showDevTools();
        }
        else if(e.keyCode==116) //F5
          window.location.reload();
        else if(e.keyCode==90 && e.ctrlKey==true && //Ctrl Z
         e.altKey==false && e.shiftKey==false)
        {
          if(Editor.isOpenFile())
            Editor.undo();
        }
        else if(e.keyCode==89 && e.ctrlKey==true && //Ctrl Y
         e.altKey==false && e.shiftKey==false)
        {
          if(Editor.isOpenFile())
            Editor.redo();
        }
        else if(e.keyCode==83 && e.ctrlKey==true && //Ctrl S
         e.altKey==false && e.shiftKey==false)
        {
          $('#btn_save').click();
        }
      });

      function noDefault(e){
        e.preventDefault();
      }
      doc.on({
        dragleave:noDefault,
        drop:noDefault,
        dragenter:noDefault,
        dragover:noDefault,
      });

      $('.lines')[0].ondrop=function(e){
        e.preventDefault();
        if(e.dataTransfer.files.length<0)
          return;
        var fname=e.dataTransfer.files[0].path;
        testSave(function()
        {
          if(fname.slice(-4)=='.txt')
          {
            openTxt(fname);
          }
          else
          {
            openProj(fname);
          }
        });
      };

      //复选框点击文本可选中
      $('.configBox').on('click','.configLabelInButton',function(){
        this.parentElement.children[0].click();
      });

      //全局事件绑定
      OutWindow.on('close',function(){
        testSave(function(){OutWindow.close(true)})
      });

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
      $('.confirmButton').off('click').on('click',function(evt){
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

    function openTxt(fname)
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

        if(Settings.useNewsc=='ifexists' ||
            Settings.useNewsc=='always')
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
          else if(Settings.useNewsc=='always')
          {
            proj.addGroup(newScName,ls.slice(0),codec,{editable:true});
          }
          else if(Settings.autoDuplicateGroup)
          {
            proj.addGroup('',ls.slice(0),codec,{editable:true});
          }
        }
        else
        {
          if(Settings.autoDuplicateGroup)
          {
            proj.addGroup('',ls.slice(0),codec,{editable:true});
          }
        }

        Editor.updateLines();
        setWindowTitle(false);
      });
    }

    function openProj(fname)
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

    function buttonOpen()
    {
      testSave(choose);

      function choose()
      {
        Misc.chooseFile('#openFile',function (evt)
        {
          var fname=this.value;
          if(fname.slice(-4)=='.txt')
          {
            openTxt(fname);
          }
          else
          {
            openProj(fname);
          }
          $(this).val('');
        });
      }
    }

    function buttonDuplicate()
    {
      var proj=CurrentProject;
      if(Editor.isOpenFile() && proj.fileNames.length>=1)
      {
        proj.duplicateGroup(proj.getGroupCount()-1);
        Editor.updateLines(proj.getGroupCount()-1);
      }
    }

    function buttonSave(cb)
    {
      if(Editor.isOpenFile() && Editor.isModified())
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
            (Settings.useNewsc=='always' && proj.fileNames[0].slice(-5)!='.proj'))
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
      if(Editor.isOpenFile())
      {
        testSave(function(){
          Editor.clearAll();
          CurrentProject=new Project();
          setWindowTitle(false);
        });
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

    return {
      showModalDialog:showModalDialog,
      showHint:showHint,
      windowTitle:windowTitle,
      setWindowTitle:setWindowTitle,
      testSave:testSave,
      buttonSave:buttonSave,
      init:init,
    };
})();

function Init()
{
  //初始化对象
  App.init();
  Menu.init();
  Editor.init();

  //设置主div高度
  $('.lines').css('height',window.innerHeight-20);
  $(window).on('resize',function(){
    $('.lines').css('height',window.innerHeight-20);
  });
  

  App.setWindowTitle();
  CurrentProject=new Project();
}

