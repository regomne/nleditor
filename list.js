var xssHelper=(function(){
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

    return {
    	encode: en,
    	decode: de,
    };

})();

var Editor={
	linesOld:{},
	linesNew:{},
	markedLines:{},
	curHighlightBox:null,
	boxStatus:{},

	getNumId:function(id)
	{
		return id.slice(7); //lineNewXXX
	},

	lineClickProc:function() //"this" is not Editor
	{
		var id=Editor.getNumId(this.id);
		var status=Editor.boxStatus[id];
		if(!status)
		{
			this.innerHTML='<textarea class="editText" rows=1>'+this.innerHTML+'</textarea>';
			$('.editText')[0].focus();
			Editor.boxStatus[id]='editing';
		}
	},

	editBlurProc:function() //"this" is not Editor
	{
		var par=this.parentElement;
		Editor.linesNew[Editor.getNumId(par.id)]=this.value;
		Editor.boxStatus[Editor.getNumId(par.id)]='';
		par.innerHTML=xssHelper.encode(this.value);
	},

	setLines:function(ls1,ls2)
	{
		this.linesOld=ls1;
		this.linesNew=ls2;
		var list=$('.lines');
		for(var i=0;i<ls1.length;i++)
		{
			var para=$('<p class="para"></p>');
			para.append($('<div class="lineOld" id="lineOld'+i+'">'+xssHelper.encode(ls1[i])+'</div>'));
			if(ls2[i]!==undefined)
			{
				para.append($('<div class="lineNew" id="lineNew'+i+'">'+xssHelper.encode(ls2[i])+'</div>'));
			}
			list.append(para);
		}

	},
};

function Init()
{
	$('.lines').css('height',window.innerHeight-20);
	$(window).on('resize',function(){
		$('.lines').css('height',window.innerHeight-20);
	});

	var doc=$(document);
	doc.on('click','.lineNew',Editor.lineClickProc);
	doc.on('blur','.editText',Editor.editBlurProc);
}

