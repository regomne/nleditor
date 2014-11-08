
var Menu=(function(){

  function mnSettings()
  {
    console.log('pressed');
  }

  function init()
  {
    var curLang=CurLang;
    var mni=GuiNode.MenuItem;
    var mn=GuiNode.Menu;
    
    var menu1=new mn();
    menu1.append(new mni({label:curLang.menuSettings, click:mnSettings}));
    $('body').on('contextmenu',function(ev){
      //console.dir(ev);
      menu1.popup(ev.clientX,ev.clientY);
      return false;
    });
  }

  return {
    init:init,
  };
})();