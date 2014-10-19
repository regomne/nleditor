
var Lang={};
Lang.chn={
  confirmSaveFile: '文件已修改，是否保存？',
  confirmYes: '是',
  confirmNo: '否',
  confirmOk:'确定',
  confirmCancel:'取消',

  fileSaved:'{0} 已保存',

  regexpError: '正则表达式语法错误：',
};
var CurLang=Lang.chn;

var configs=(function(){
    var defaultConfigs={
        defaultCodec:'936',
        useNewsc:'ifexists',
        selectPattern:['「(.*)」','【(.*)】','（(.*)）',],
    };

    var conf=Misc.clone(defaultConfigs);
    for(var i=0;i<conf.selectPattern.length;i++)
    {
      try{
        conf.selectPattern[i]=new RegExp(conf.selectPattern[i]);
      }
      catch(e)
      {
        setTimeout(function(){App.showHint(CurLang.regexpError+'\n'+e.message)},1000);
      }
    }
    return conf;
})();
