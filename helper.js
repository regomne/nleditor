var helper=(function(){


  if(USE_NODE_WEBKIT){

  return {
  getImageSrc: function(name){
    if(name[1]==':')
      return 'file:///'+name;
    return name;
  },
  getGUI: function(){return require('nw.gui')},
  getOutWindow: function(){return GuiNode.Window.get()},
  saveWindowSize: function(){
    var fs=require('fs');
    var pkg=JSON.parse(fs.readFileSync('package.json'));
    var h=document.documentElement.clientHeight;
    var w=document.documentElement.clientWidth;
    if(h!=pkg.window.height || w!=pkg.window.width)
    {
      pkg.window.height=Math.floor(h);
      pkg.window.width=Math.floor(w);
      fs.writeFileSync('package.json',JSON.stringify(pkg));
    }
  },
  }}

  else
  return{
  getImageSrc: function(name){
    return name;
  },
  };
})();