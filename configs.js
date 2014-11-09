
var Lang={};
Lang.chn={
  confirmSaveFile: '文件已修改，是否保存？',
  confirmYes: '是',
  confirmNo: '否',
  confirmOK:'确定',
  confirmCancel:'取消',

  fileSaved:'{0} 已保存',

  regexpError: '正则表达式语法错误：',

  setting_autoSaveInterval: '自动保存间隔(单位秒，0为不自动)：',
  setting_defaultOpenCodec: '文本默认打开编码：',
  setting_useNewsc: '是否使用NewSc目录：',
  setting_useNewsc_0: '如果存在',
  setting_useNewsc_1: '总是使用',
  setting_useNewsc_2: '不使用',
  setting_autoSelectText: '自动选中文本',
  setting_selectPattern: '选中规则：',

  menuSettings: '设置',
};
var CurLang=Lang.chn;

var configs=(function(){

    var settingsDefines=[
      {
        type:'number',
        name:'autoSaveInterval',
        defa:120,
      },
      {
        type:'string',
        name:'defaultOpenCodec',
        defa:'936'
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

    function getDefaultSettings()
    {
      var settings=getDefault(settingsDefines);
      settings.selectPattern=settings.selectPattern.split('\\0');
      for(var i=0;i<settings.selectPattern.length;i++)
      {
        try{
          settings.selectPattern[i]=new RegExp(settings.selectPattern[i]);
        }
        catch(e)
        {
          setTimeout(function(){App.showHint(CurLang.regexpError+'\n'+e.message)},1000);
        }
      }
      return settings;
    }

    function generateSettingHtml(defs,curs)
    {
      function getInstructionText(name)
      {
        return Misc.encodeHtml(CurLang['setting_'+name] || name);
      }
      function getSubInstructionText(name,id)
      {
        return Misc.encodeHtml(CurLang['setting_'+name+'_'+id] || name);
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
            Misc.format('<input type="text" id="settingInDialog_{0}" value="{1}" />',i,Misc.encodeHtml(curs[opt.name]))+
            '</span></div>';
          optstr+=s;
          break;
        case 'patterns':
          var ptr=curs[opt.name].map(function(ele){return ele.source}).join('\\0');
          var s='<div class="configWithLabel"><span>'+getInstructionText(opt.name)+
            Misc.format('<input type="text" id="settingInDialog_{0}" value="{1}" />',i,Misc.encodeHtml(ptr))+
            '</span></div>';
          optstr+=s;
          break;
        case 'bool':
          var isCh=curs[opt.name] ? 'checked="1"' : '';
          var s='<div class="configWithLabel"><span>'+
            Misc.format('<input type="checkbox" class="configCheckbox" id="settingInDialog_{0}" {1} /><span class="configLabelInButton">',i,isCh)+
            getInstructionText(opt.name)+
            '</span></span></div>';
          optstr+=s;
          break;
        case 'combo':
          var subops='';
          for(var j=0;j<opt.data.length;j++)
          {
            subops+=Misc.format('<option value="{0}">{1}</option>',Misc.encodeHtml(opt.data[j]),getSubInstructionText(opt.name,j));
          }
          var s='<div class="configWithLabel"><span>'+getInstructionText(opt.name)+
            Misc.format('<select id=settingInDialog_{0}>',i)+subops+'</select></span></div>';
          optstr+=s;
          break;
        default:
          console.log('unknown Setting defines');
        }
      }

      return optstr;
    }

    return {
      getSettingDefines:function(){return settingsDefines},
      getDefaultSettings:getDefaultSettings,
      generateSettingHtml:generateSettingHtml,
    };
})();

var Settings;
var UISettings;