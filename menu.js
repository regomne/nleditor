
var Menu=(function(){

  function init()
  {
    var mni=GuiNode.MenuItem;
    var mn=GuiNode.Menu;
    
    var menu1=new mn();
    menu1.append(new mni({label:CurLang.menuSettings, click:mnSettings}));
    menu1.append(new mni({label:CurLang.menuUiSettings,click:mnUiSettings}));
    $('body').off('contextmenu').on('contextmenu',function(ev){
      //console.dir(ev);
      menu1.popup(ev.clientX,ev.clientY);
      return false;
    });
  }

  function mnSettings()
  {
    var sets=configs.getSettingDefines();
    var optsDiv=$('#configOptions');
    var boxDiv=$('.configBox');

    var maxw=window.innerWidth*0.7;
    boxDiv.css('max-width',maxw>500?500:maxw);
    optsDiv.css('max-height',window.innerWidth*0.8)

    $('#configOK')[0].textContent=CurLang.confirmOK;
    $('#configCancel')[0].textContent=CurLang.confirmCancel;

    $('#configOK').off('click').on('click',function(){
      var conf=configs.saveConfigsFromHtml(sets,'setting');
      if(conf)
      {
        configs.applySetting(sets,conf);
        Settings=conf;
        $.magnificPopup.close();
      }
    });
    $('#configCancel').off('click').on('click',function(){
      $.magnificPopup.close();
    });

    optsDiv[0].textContent='';
    optsDiv.append($(configs.generateConfigHtml(sets,Settings,'setting')));
    $.magnificPopup.open({
      items: {
        src: '#configBox'
      },
      type: 'inline',
      removalDelay: 300,
      mainClass: 'mfp-fade',
      showCloseBtn:false,
      closeOnBgClick:false,
      // callbacks:{close: function(arg){
      //   callback(userSelect);
      // }},
    }, 0);
  }

  function mnUiSettings()
  {
    var sets=configs.getUiSettingDefines();
    var optsDiv=$('#configOptions');
    var boxDiv=$('.configBox');

    var maxw=window.innerWidth*0.7;
    boxDiv.css('max-width',maxw>500?500:maxw);
    optsDiv.css('max-height',window.innerWidth*0.8)

    $('#configOK')[0].textContent=CurLang.confirmOK;
    $('#configCancel')[0].textContent=CurLang.confirmCancel;

    $('#configOK').off('click').on('click',function(){
      var conf=configs.saveConfigsFromHtml(sets,'uiSetting');
      if(conf)
      {
        configs.applyUiSetting(sets,conf);
        UISettings=conf;
        $.magnificPopup.close();
      }
    });
    $('#configCancel').off('click').on('click',function(){
      $.magnificPopup.close();
    });

    optsDiv[0].textContent='';
    optsDiv.append($(configs.generateConfigHtml(sets,UISettings,'uiSetting')));
    $('.colorPicker').spectrum({
      showAlpha: true,
      //showButtons: false,
      clickoutFiresChange: true,
      preferredFormat: "rgb",
      cancelText:CurLang.confirmCancel,
      chooseText:CurLang.confirmOK,
    });
    $('.browseButtonInConfig').off('click').on('click',function(e){
      var id=this.id.slice(7);
      Misc.chooseFile('#openFile','',function(){
        $('#'+id).val(this.value);
      });
    })
    $.magnificPopup.open({
      items: {
        src: '#configBox'
      },
      type: 'inline',
      removalDelay: 300,
      mainClass: 'mfp-fade',
      showCloseBtn:false,
      closeOnBgClick:false,
      // callbacks:{close: function(arg){
      //   callback(userSelect);
      // }},
    }, 0);

  }

  return {
    init:init,
  };
})();