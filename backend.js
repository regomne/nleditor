var Backend=(function(){
    var fs=require('fs');
    var querystring=require('querystring');
    var path=require('path');
    var iconv=require('iconv-lite');
    //var comm=require('./communication');

    //private:
    function splitTxtFile(data,codec)
    {
        if(codec===undefined)
        {
            if(data[0]==0xfe && data[1]==0xff)
                codec='utf16be';
            else if(data[0]==0xff && data[1]==0xfe)
                codec='utf16le';
            else if(data[0]==0xef && data[1]==0xbb && data[2]==0xbf)
                codec='utf8';
            else
                codec='ascii';
        }

        var str=iconv.decode(data,codec);
        var lines=str.split('\r\n');
        return {
            lines:lines,
            codec:codec,
        };
    }

    function genTextName(fname)
    {
        return fname;
    }
    function genProjName(fname)
    {
        return fname;
    }

    function parseText(cmd,data,callback)
    {
        var fname=genTextName(data);
        var codec=cmd.codec;
        if(codec && !iconv.encodingExists(codec))
            throw "unknown codec";

        fs.readFile(fname,function(err,data)
        {
            var readLs=splitTxtFile(data,codec);
            comm.emit('s_parseText',readLs,callback);
            gLog('text:',fname,'parsed');
        });
    }

    function saveText(cmd,data,callback)
    {
        var ls=data;
        var fname=cmd.name;
        if(fname===undefined)
            throw "no file name";
        if(typeof(fname)!='string')
            throw "file name must be unique";
        fname=genTextName(fname);

        var codec=cmd.codec;
        if(codec && !iconv.encodingExists(codec))
            throw 'unknown codec';
        if(!codec)
            codec='utf8';

        var bin=iconv.encode(ls.join('\r\n'),codec);
        fs.writeFile(fname,bin,function(err)
        {
            if(err) throw err;
            comm.emit('s_saveText',callback);
            gLog('text:',fname,'saved');
        });
    }

    function parseProj(cmd,data,callback)
    {
        var fname=genProjName(data);

        fs.readFile(fname,function(err,data)
        {
            if(err) throw err;
            var proj=JSON.parse(iconv.decode(data,'utf16le'));
            comm.emit('s_parseProj',proj,callback);
            gLog('proj:',fname,'parsed');
        });
    }

    function saveProj(cmd,data,callback)
    {
        var proj=data;
        var fname=cmd.name;
        if(fname===undefined)
            throw "no file name";
        if(typeof(fname)!='string')
            throw "file name must be unique";
        fname=genProjName(fname);

        var bin=iconv.encode(JSON.stringify(proj),'utf16le');
        fs.writeFile(fname,bin,function(err)
        {
            if(err) throw err;
            comm.emit('s_saveProj',callback);
            gLog('proj:',fname,'saved');
        });
    }

    function recvCmd(qs,data,callback)
    {
        gLog(qs,'recved');
        var cmd=querystring.parse(qs);
        if(cmd['cmd']===undefined)
        {
            gLog('no cmd.');
            comm.emit('s_error','no cmd');
        }

        var dispTable={
            parseText:parseText,
        };

        if(dispTable[cmd['cmd']]!=undefined)
        {
            try
            {
                dispTable[cmd['cmd']](cmd,data,callback);
            }
            catch(e)
            {
                gLog('processing',cmd['cmd'],'err occured: ',e);
                comm.emit('s_error',e);
            }
        }
        else
        {
            gLog('err cmd: ',cmd['cmd']);
            comm.emit('s_error','err cmd: '+cmd['cmd']);
        }
    }

    return {
        recvCmd:recvCmd,
    };

})();