var Misc=(function(){
    var REGX_HTML_ENCODE = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;

    var REGX_HTML_DECODE = /&\w+;|&#(\d+);/g;

    var REGX_TRIM = /(^\s*)|(\s*$)/g;

    var HTML_DECODE = {
        "&lt;" : "<", 
        "&gt;" : ">", 
        "&amp;" : "&", 
        "&nbsp;": " ", 
        "&quot;": "\"", 
        "&copy;": ""

        // Add more
    };

    var en = function(s){
        s = (s != undefined) ? s : s.toString();
        return (typeof s != "string") ? s :
            s.replace(REGX_HTML_ENCODE, 
                      function($0){
                          var c = $0.charCodeAt(0), r = ["&#"];
                          c = (c == 0x20) ? 0xA0 : c;
                          r.push(c); r.push(";");
                          return r.join("");
                      });
    };

    var de=function(s){
        var HTML_DECODE = HTML_DECODE;

        s = (s != undefined) ? s : s.toString();
        return (typeof s != "string") ? s :
            s.replace(REGX_HTML_DECODE,
                      function($0, $1){
                          var c = HTML_DECODE[$0];
                          if(c == undefined){
                              // Maybe is Entity Number
                              if(!isNaN($1)){
                                  c = String.fromCharCode(($1 == 160) ? 32:$1);
                              }else{
                                  c = $0;
                              }
                          }
                          return c;
                      });
    };

    function clone(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; ++i) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    function format(str)
    {
      var params=[];
      for(var i=1;i<arguments.length;i++)
        params.push(arguments[i]);
      var reg = /\{(\d+)\}/gm;
      return str.replace(reg,function(match,name)
      {
        return params[~~name];
      })
    }

    function chooseFile(name,type,cb)
    {
      var chooser=$(name);

      chooser.attr('accept',type);
      chooser.val('');
      chooser.off('change').on('change',cb);
      chooser.click();
    }

    function genNewScPath(fname)
    {
      fname=fname.replace('/','\\');
      if(fname.indexOf('\\')==-1)
      {
        return 'NewSc\\'+fname;
      }

      var eles=fname.split('\\');
      var path=eles.slice(0,-1).join('\\');
      return path+'\\NewSc\\'+eles[eles.length-1];
    }

    function genProjName(fname)
    {
      if(fname.slice(-4)=='.txt')
        return fname.slice(0,-4)+'.proj';
      if(fname.slice(-5)=='.proj')
        return fname;
      return fname+'.proj';
    }

    function existsFile(fname)
    {
      var fs=require('fs');
      return fs.existsSync(fname);
    }

    return {
        encodeHtml: en,
        decodeHtml: de,
        clone:clone,
        format:format,
        genNewScPath:genNewScPath,
        chooseFile:chooseFile,
        existsFile:existsFile,
        genProjName:genProjName,
    };

})();
