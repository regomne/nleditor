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
  }}

  else
  return{
  getImageSrc: function(name){
    return name;
  },
  };
})();