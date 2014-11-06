
var Lang={};
Lang.chn={
  confirmSaveFile: '文件已修改，是否保存？',
  confirmYes: '是',
  confirmNo: '否',
  confirmOk:'确定',
  confirmCancel:'取消',

  fileSaved:'{0} 已保存',

  regexpError: '正则表达式语法错误：',

  setting_defaultOpenCodec: '文本默认打开编码',
  setting_useNewsc1: '如果存在',
  setting_useNewsc2: '总是使用',
  setting_useNewsc3: '忽略',
  setting_selectPattern: '文本自动选中',
};
var CurLang=Lang.chn;

var configs=(function(){
    var defaultSettings={
        defaultOpenCodec:'936',
        useNewsc:'ifexists',
        selectPattern:['「(.*)」','【(.*)】','（(.*)）',],
    };

    var settingsDefines=[
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
        type:'string',
        name:'selectPattern',
        defa:'「(.*)」\0【(.*)】\0（(.*)）',
      },
    ];

    var settings=Misc.clone(defaultSettings);
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

    return {
      settings:settings,
    };
})();
