﻿
var Lang=(function(){
  var L={};
  L.chn={
    confirmSaveFile: '文件已修改，是否保存？',
    confirmYes: '是',
    confirmNo: '否',
    confirmOK:'确定',
    confirmCancel:'取消',

    fileSaved:'{0} 已保存',

    regexpError: '正则表达式语法错误：',

    setting_autoSaveInterval: '自动保存间隔(单位秒，0为不自动)：',
    setting_autoDuplicateGroup: '自动复制原文文本',
    setting_defaultOpenCodec: '文本默认打开编码：',
    setting_useNewsc: '是否使用NewSc目录：',
    setting_useNewsc_0: '如果存在',
    setting_useNewsc_1: '总是使用',
    setting_useNewsc_2: '不使用',
    setting_autoSelectText: '自动选中文本',
    setting_selectPattern: '选中规则：',

    uiSetting_lineFont:'字体：',
    uiSetting_lineFontSize:'字体大小：',
    uiSetting_useBgfile:'是否使用背景图片',
    uiSetting_bgFile:'背景图片路径：',
    uiSetting_autoResizeByImage:'自动根据背景图片调节窗口尺寸',
    uiSetting_bgColor:'背景颜色：',
    uiSetting_lineBgColor:'文本行背景色：',
    uiSetting_lineBgNewColor:'文本行变化背景色：',
    uiSetting_editBgColor:'编辑框底色：',
    uiSetting_textColor:'正常文本颜色：',
    uiSetting_modifiedTextColor:'修改过的文本颜色：',
    uiSetting_modifiedSavedBgColor:'上次保存后修改过的文本底色：',

    menuSettings: '设置',
    menuUiSettings: '视图设置',

    buttonBrowse: '浏览',

    buttonTitleOpen: '打开文件/工程',
    buttonTitleSave: '保存文件/工程',
    buttonTitleDuplicate: '复制文本',
    buttonTitleClose: '关闭工程',
    buttonTitleUndo: '撤销',
    buttonTitleRedo: '重做',

    infoBoxTimeElapsedRun:'您已经打开编辑器&nbsp;<b>{0}小时{1}分{2}秒</b>',
    infoBoxModifiedRun:'本次打开编辑器一共修改了&nbsp;<b>{0}</b>&nbsp;行',
    infoBoxTimeElapsedStart:'您已经编辑此文件&nbsp;<b>{0}小时{1}分{2}秒</b>',
    infoBoxModifiedStart:'本文件一共修改了&nbsp;<b>{0}</b>&nbsp;行',
  };
  L.init=function(curlang){
    var btns=$('.menuButton');
    for(var i=0;i<btns.length;i++)
    {
      var name=btns[i].id.slice(10);
      var tt=curlang['buttonTitle'+name];
      if(tt)
        $('#menuButton'+name).attr('title',tt);
    }
  };
  return L;
})();
var CurLang=Lang.chn;

var configs=(function(){

    var settingsDefines=[
      {
        type:'number',
        name:'autoSaveInterval',
        defa:120,
        //valid:function(){}
      },
      {
        type:'bool',
        name:'autoDuplicateGroup',
        defa:'true'
      },
      {
        type:'string',
        name:'defaultOpenCodec',
        defa:'936',
      },
      {
        type:'combo',
        name:'useNewsc',
        data:['ifexists','always','no'],
        defa:'ifexists'
      },
      {
        type:'bool',
        name:'autoSelectText',
        defa:true,
        options:{enabled:'selectPattern'}
      },
      {
        type:'patterns',
        name:'selectPattern',
        defa:'「(.*)」\\0【(.*)】\\0（(.*)）',
      },
    ];

    var uiSettingsDefines=[
      {
        type:'string',
        name:'lineFont',
        defa:'微软雅黑',
        cssSel:'.listAll',
        cssKey:'font-family',
      },
      {
        type:'number',
        name:'lineFontSize',
        defa:16,
        cssSel:'.lines',
        cssKey:'font-size',
      },
      {
        type:'bool',
        name:'useBgfile',
        defa:true,
      },
      {
        type:'file',
        name:'bgFile',
        defa:'./bkgnd.jpg',
      },
      {
        type:'bool',
        name:'autoResizeByImage',
        defa:'true',
      },
      {
        type:'color',
        name:'bgColor',
        defa:'white',
        cssSel: 'body',
        cssKey: 'background-color',
      },
      {
        type:'color',
        name:'lineBgColor',
        defa:'rgba(255,255,255,0.5)',
        cssSel:'.lines',
        cssKey:'background-color',
      },
      {
        type:'color',
        name:'lineBgNewColor',
        defa:'rgba(0,64,255,0.3)',
      },
      {
        type:'color',
        name:'editBgColor',
        defa:'rgba(255,0,120,0.3)',
        cssSel:'.editText',
        cssKey:'background-color',
      },
      {
        type:'color',
        name:'textColor',
        defa:'black',
        cssSel:'.para',
        cssKey:'color',
      },
      {
        type:'color',
        name:'modifiedTextColor',
        defa:'rgb(100,10,10)',
        cssSel:'.modifiedStart',
        cssKey:'color',
      },
      {
        type:'color',
        name:'modifiedSavedBgColor',
        defa:'rgba(150,150,0,0.2)',
        cssSel:'.modifiedSaved',
        cssKey:'background-color',
      },
    ];

    function getDefault(defs)
    {
      var conf={};
      for(var i=0;i<defs.length;i++)
      {
        if(defs[i].type!='tag')
        {
          conf[defs[i].name]=defs[i].defa;
        }
      }
      return conf;
    }

    function parseSelectPattern(str)
    {
      var pat=str.split('\\0');
      for(var i=0;i<pat.length;i++)
      {
        pat[i]=new RegExp(pat[i]);
      }
      return pat;
    }

    function getDefaultSettings()
    {
      var settings=getDefault(settingsDefines);
      try{
        settings.selectPattern=parseSelectPattern(settings.selectPattern);
      }
      catch(e)
      {
        setTimeout(function(){App.showHint(CurLang.regexpError+'\n'+e.message)},1000);
        settings.selectPattern=[];
      }
      return settings;
    }

    function getDefaultUiSettings()
    {
      var settings=getDefault(uiSettingsDefines);
      return settings;
    }

    function generateConfigHtml(defs,curs,confType)
    {
      function getInstructionText(name)
      {
        return Misc.encodeHtml(CurLang[confType+'_'+name] || name);
      }
      function getSubInstructionText(name,id)
      {
        return Misc.encodeHtml(CurLang[confType+'_'+name+'_'+id] || name);
      }
      var optstr='';
      for(var i=0;i<defs.length;i++)
      {
        var opt=defs[i];
        switch(opt.type)
        {
        case 'string':
        case 'number':
          var s='<div class="configWithLabel"><span>'+getInstructionText(opt.name)+
            Misc.format('<input type="text" id="{0}InDialog_{1}" value="{2}" />',confType,i,Misc.encodeHtml(curs[opt.name]))+
            '</span></div>';
          optstr+=s;
          break;
        case 'patterns':
          var ptr=curs[opt.name].map(function(ele){return ele.source}).join('\\0');
          var s='<div class="configWithLabel"><span>'+getInstructionText(opt.name)+
            Misc.format('<input type="text" id="{0}InDialog_{1}" value="{2}" />',confType,i,Misc.encodeHtml(ptr))+
            '</span></div>';
          optstr+=s;
          break;
        case 'bool':
          var isCh=curs[opt.name] ? 'checked="1"' : '';
          var s='<div class="configWithLabel"><span>'+
            Misc.format('<input type="checkbox" class="configCheckbox" id="{0}InDialog_{1}" {2} /><span class="configLabelInButton">',confType,i,isCh)+
            getInstructionText(opt.name)+
            '</span></span></div>';
          optstr+=s;
          break;
        case 'combo':
          var subops='';
          var curop=curs[opt.name];
          for(var j=0;j<opt.data.length;j++)
          {
            var opvalue=opt.data[j];
            subops+=Misc.format('<option value="{0}" {1}>{2}</option>',Misc.encodeHtml(opvalue),
              opvalue==curop?'selected':'',getSubInstructionText(opt.name,j));
          }
          var s='<div class="configWithLabel"><span>'+getInstructionText(opt.name)+
            Misc.format('<select id={0}InDialog_{1}>',confType,i)+subops+'</select></span></div>';
          optstr+=s;
          break;
        case 'file':
          var s=Misc.format('<div class="configWithLabel"><span>{0}<input type="text" id="{1}InDialog_{2}" value="{3}" /><input type="button" class="browseButtonInConfig" id="Button_{1}InDialog_{2}" value="{4}"/></span></div>',getInstructionText(opt.name),confType,i,Misc.encodeHtml(curs[opt.name]),Misc.encodeHtml(CurLang.buttonBrowse));
          optstr+=s;
          break;
        case 'color':
          var s=Misc.format('<div class="configWithLabel"><span>{0}<input type="text" class="colorPicker" id="{1}InDialog_{2}" value="{3}"/></span></div>',getInstructionText(opt.name),confType,i,Misc.encodeHtml(curs[opt.name]));
          optstr+=s;
          break;
        default:
          console.log('unk type');
          //throw "unk conf define"+opt.type;
        }
      }

      return optstr;
    }

    function saveConfigsFromHtml(defs,confType)
    {
      var confs={};
      var allErr=false;
      for(var i=0;i<defs.length;i++)
      {
        var opt=defs[i];
        if(opt.type=='tag')
          continue;
        var eleName=Misc.format('#{0}InDialog_{1}',confType,i);
        var ele=$(eleName);
        if(ele.length==0)
        {
          throw "no element in html: "+i;
        }
        var parEle=$('.configWithLabel:has("'+eleName+'")');
        var err=false;
        switch(opt.type)
        {
        case 'string':
          confs[opt.name]=ele[0].value;
          break;
        case 'number':
          confs[opt.name]=parseInt(ele[0].value) || 0;
          break;
        case 'bool':
          confs[opt.name]=ele[0].checked;
          break;
        case 'combo':
          confs[opt.name]=opt.data[ele[0].selectedIndex];
          break;
        case 'patterns':
          if(!ele[0].value)
          {
            confs[opt.name]=[];
            break;
          }
          var pat=ele[0].value.split('\\0');
          try{
            confs[opt.name]=pat.map(function(el){
              return new RegExp(el);
            });
          }
          catch(e)
          {
            parEle.addClass('badConfig');
            err=true;
            allErr=true;
          }
          break;
        case 'file':
          confs[opt.name]=ele[0].value;
          break;
        case 'color':
          confs[opt.name]=ele[0].value;
          break;
        }
        if(!err)
          parEle.removeClass('badConfig');
      }
      if(allErr)
        return null;
      return confs;
    }

    function applySetting(defs,sett)
    {
      if(Editor.isOpenFile() && Editor.isModified())
        Editor.resetAutoSaver(sett.autoSaveInterval);
    }

    function applyUiSetting(defs,sett)
    {
      var isInConfigWindow=false;
      //apply css settings
      for(var i=0;i<defs.length;i++)
      {
        var opt=defs[i];
        if(opt.type=='tag')
          continue;
        var eleName=Misc.format('#uiSettingInDialog_{0}',i);
        var ele=$(eleName);
        if(ele.length!=0)
        {
          isInConfigWindow=true;
          var parEle=$('.configWithLabel:has("'+eleName+'")');
          if(parEle.css('display')=='none')
            continue;
        }

        if(opt.cssSel)
        {
          $(opt.cssSel).css(opt.cssKey,sett[opt.name]);
        }
      }

      if(sett.useBgfile)
      {
        if(UISettings.bgFile!=sett.bgFile ||
          UISettings.useBgfile==false ||
          (sett.autoResizeByImage==true && UISettings.autoResizeByImage==false))
          App.setBackgroundImage(sett.bgFile,(isInConfigWindow? sett.autoResizeByImage:false));
        else if(sett.bgFile=='./bkgnd.jpg')
          App.setBackgroundImage(sett.bgFile,false);
      }
      else
      {
        App.setBackgroundImage();
      }
    }

    function saveConfigs()
    {
      var tmp={settings:Misc.clone(Settings),uiSettings:UISettings};
      tmp.settings.selectPattern=Settings.selectPattern.map(function(ele){
        return ele.toString().slice(1,-1);
      }).join('\\0');
      comm.emit('c_sendCmd','cmd=saveConfigs&name=configs.json',tmp,function(err){
        if(err)
        {
          console.log(err);
          return;
        }
      });
    }

    function loadConfigs()
    {
      comm.emit('c_sendCmd','cmd=loadConfigs','configs.json',function(err,tmp){
        if(err)
        {
          console.log(err);
          return;
        }
        try{
          tmp.settings.selectPattern=parseSelectPattern(tmp.settings.selectPattern);
        }
        catch(e)
        {
          setTimeout(function(){App.showHint(CurLang.regexpError+'\n'+e.message)},1000);
          tmp.settings.selectPattern=[];
        }
        applySetting(settingsDefines,tmp.settings);
        applyUiSetting(uiSettingsDefines,tmp.uiSettings);
        Misc.copy(Settings,tmp.settings);
        Misc.copy(UISettings,tmp.uiSettings);
      });
    }

    return {
      getSettingDefines:function(){return settingsDefines},
      getUiSettingDefines:function(){return uiSettingsDefines},
      getDefaultSettings:getDefaultSettings,
      getDefaultUiSettings:getDefaultUiSettings,
      generateConfigHtml:generateConfigHtml,
      saveConfigsFromHtml:saveConfigsFromHtml,
      applySetting:applySetting,
      applyUiSetting:applyUiSetting,
      saveConfigs:saveConfigs,
      loadConfigs:loadConfigs,
    };
})();

var Settings=configs.getDefaultSettings();
var UISettings=configs.getDefaultUiSettings();