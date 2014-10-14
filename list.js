
/*
config:
{
    colors:
    {
        
    }
    defalutCodec
}
*/

/*
project:
{
    fileNames:['','']
    lineGroups:[[...],[...]]
    groupAttrs:[{},{}]
    linesMark:{}
    codecs:['xxx']
    
    lastLine

}
*/

var Project=function(proj)
{
    if(proj instanceof Object)
    {
        this.fileNames=proj.fileNames;
        this.lineGroups=proj.lineGroups;
        this.groupAttrs=proj.groupAttrs;
        this.linesMark=proj.linesMark;
        this.codecs=proj.codecs;

        this.lastLine=proj.lastLine;
    }
    else
    {
        this.fileNames=[];
        this.lineGroups=[];
        this.groupAttrs=[];
        this.linesMark={};
        this.codecs=[];
        this.lastLine=-1;
    }
}


var Editor=(function(){

    //private:
	var project;
	var curHighlightBox;
	var boxStatus;

    function init()
    {
        var doc=$(document);
        doc.on('click','.line1',lineClickProc);
        doc.on('blur','.editText',editBlurProc);

        project=new Project();
        curHighlightBox={};
        boxStatus={};
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
		var pos=getPosFromId(this.id);
        if(!project.groupAttrs[pos.group].editable)
            return;
		var status=boxStatus[pos.index];
		if(!status)
		{
			this.innerHTML='<textarea class="editText" rows=1>'+this.innerHTML+'</textarea>';
			$('.editText')[0].focus();
			boxStatus[pos.index]='editing';
		}
	}

	function editBlurProc() //"this" is not Editor
	{
		var par=this.parentElement;
        var pos=getPosFromId(par.id);
		project.lineGroups[pos.group][pos.index]=this.value;
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
        var ele=$('<div class="line'+group+'" id="'+getIdFromPos(group,idx)+'">'+Misc.encodeHtml(str)+'</div>')[0];
        para.insertBefore(ele,before);
    }

    //public:
	function setLines(group,ls)
	{
        project.lineGroups[group]=ls;
        project.groupAttrs[group]={};
	}

    function setGroupAttr(group,attr)
    {
        project.groupAttrs[group]=attr;
    }

    function getLines(group,ls)
    {
        if(group>=project.lineGroups.length)
            throw "group not exists";
        return project.lineGroups[group];
    }

    function getGroupAttr(group)
    {
        return project.groupAttrs[group];
    }

    function clearAll()
    {
        $('.lines')[0].textContent='';
        project=new Project();
        curHighlightBox=null;
        boxStatus={};
    }

    function setProject(proj)
    {
        project=new Project(proj);
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
            var maxLineCnt=Math.max.apply(null,project.lineGroups.map(function(ls){return ls.length}));
            setHtmlLineCount(maxLineCnt); 
            for(var i=0;i<project.lineGroups.length;i++)
                updateLines(i);
            return;
        }

        if(group>=project.lineGroups.length)
            return;

        var ls=project.lineGroups[group];
        if(!ls)
            return;

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
        setGroupAttr:setGroupAttr,
        getGroupAttr:getGroupAttr,

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

