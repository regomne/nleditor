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

var Editor=(function(){

    //private:
	var lineGroups=[];
    var editableGroups={};
	var markedLines={};
	var curHighlightBox=null;
	var boxStatus={};

    function init()
    {
        var doc=$(document);
        doc.on('click','.line1',lineClickProc);
        doc.on('blur','.editText',editBlurProc);
    }

	function getPosFromId(id)
	{
		return {
            group:parseInt(id.slice(4,5)), //lineX_XX
            index:parseInt(id.slice(6)),
        };
	}

    function getIdFromPos(group,linesNum)
    {
        return 'line'+group+'_'+linesNum;
    }

	function lineClickProc() //"this" is not Editor
	{
		var id=getPosFromId(this.id).index;
		var status=boxStatus[id];
		if(!status)
		{
			this.innerHTML='<textarea class="editText" rows=1>'+this.innerHTML+'</textarea>';
			$('.editText')[0].focus();
			boxStatus[id]='editing';
		}
	}

	function editBlurProc() //"this" is not Editor
	{
		var par=this.parentElement;
        var pos=getPosFromId(par.id);
		lineGroups[pos.group][pos.index]=this.value;
		boxStatus[getPosFromId(par.id).index]='';
        this.outerText=this.value;
	}

    function setHtmlLineCount(cnt)
    {
        var frame=$('.lines')[0];
        var childCnt=frame.children.length;
        if(childCnt>cnt)
        {
            for(var i=childCnt-1;i>=cnt;i--)
            {
                frame.removeChild(frame.children[i]);
            }
        }
        else if(childCnt<cnt)
        {
            for(var i=childCnt;i<cnt;i++)
            {
                frame.appendChild($('<p class="para" id="para"'+childCnt+'></p>')[0]);
            }
        }
    }

    function getHtmlLineCount()
    {
        return $('.lines')[0].children.length;
    }

    function setParaLine(para,group,idx,str)
    {
        var before=null;
        for(var i=0;i<para.children.length;i++)
        {
            var tg=getPosFromId(para.children[i].id).group;
            if(group==tg)
            {
                before=i;
                break;
            }
            else if(group<tg)
            {
                before=para.children[i];
                break;
            }
        }
        if(typeof(before)=='number')
        {
            para.children[i].textContent=str;
            return;
        }
        var ele=$('<div class="line'+group+'" id="'+getIdFromPos(group,idx)+'">'+xssHelper.encode(str)+'</div>')[0];
        para.insertBefore(ele,before);
    }

    //public:
	function setLines(group,ls)
	{
        if(group>lineGroups.length)
            throw "can't set group n";
		
        lineGroups[group]=ls;
	}

    function getLines(group,ls)
    {
        if(group>=lineGroups.length)
            throw "group not exists";
        return lineGroups[group];
    }

    function clearAll()
    {
        $('.lines').empty();
        lineGroups=[];
        editableGroups={};
        markedLines={};
        curHighlightBox=null;
        boxStatus={};
    }

    function getLineInHtml(group,idx)
    {
        var l=document.getElementById(getIdFromPos(group,idx));
        if(l==undefined)
            return null;
        if(l.children.length!=0) //assume the children is textarea
            return l.children[0].value;
        return l.textContent;
    }

    function setLineInHtml(group,idx,str)
    {
        var l=document.getElementById(getIdFromPos(group,idx));
        if(l==undefined)
            return false;
        l.textContent=str;
        return true;
    }

    function updateLines(group)
    {
        if(group===undefined)
        {
            var maxLineCnt=Math.max.apply(null,lineGroups.map(function(ls){return ls.length}));
            setHtmlLineCount(maxLineCnt); 
            for(var i=0;i<lineGroups.length;i++)
                updateLines(i);
            return;
        }

        if(group>=lineGroups.length)
            return;

        var ls=lineGroups[group];
        if(ls.length>getHtmlLineCount())
            setHtmlLineCount(ls.length);

        var paras=$('.para');
        for(var i=0;i<ls.length;i++)
        {
            setParaLine(paras[i],group,i,ls[i]);
        }
    }

    init();

    return {
        setLines:setLines,
        getLines:getLines,

        setLineInHtml:setLineInHtml,
        getLineInHtml:getLineInHtml,

        updateLines:updateLines,

        clearAll:clearAll,
    };
})();

function Init()
{
	$('.lines').css('height',window.innerHeight-20);
	$(window).on('resize',function(){
		$('.lines').css('height',window.innerHeight-20);
	});


}

