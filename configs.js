
var Lang={};
Lang.chn={
  confirmSaveFile: '文件已修改，是否保存？',
  confirmYes: '是',
  confirmNo: '否',
  confirmOk:'确定',
  confirmCancel:'取消',

  fileSaved:'{0} 已保存',

  regexpError: '正则表达式语法错误：',

  setting_autoSaveInterval: '自动保存间隔(单位秒，0为不自动)',
  setting_defaultOpenCodec: '文本默认打开编码',
  setting_useNewsc: '是否使用NewSc目录',
  setting_useNewsc_0: '如果存在',
  setting_useNewsc_1: '总是使用',
  setting_useNewsc_2: '忽略',
  setting_autoSelectText: '自动选中文本',
  setting_selectPattern: '选中规则',
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
        type:'string',
        name:'selectPattern',
        defa:'「(.*)」\0【(.*)】\0（(.*)）',
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
      settings.selectPattern=settings.selectPattern.split('\0');
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


    return {
      settingsDefines:settingsDefines,
      getDefaultSettings:getDefaultSettings,
    };
})();

var Settings;
var UISettings;