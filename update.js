var Update=(function(){
  var fs=require('fs');
  var http=require('http');
  var https=require('https');
  var iconv=require('iconv-lite');

  var downloads = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb);
      });
    });
  };
  var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb);
      });
    });
  };

  function downloadTemp(url,cb)
  {
    https.get(url, function(res) {
    var data = [], dataLen = 0; 

    res.on('data', function(chunk) {

            data.push(chunk);
            dataLen += chunk.length;

        }).on('end', function() {
            var buf = new Buffer(dataLen);

            for (var i=0, len = data.length, pos = 0; i < len; i++) { 
                data[i].copy(buf, pos); 
                pos += data[i].length; 
            }
            cb(buf);
        });
    });
  }

  function readUpdateFile(fileUrl,cb)
  {
    downloadTemp(fileUrl,function(file){
      var txt=iconv.decode(file,'utf-8');
      var p=txt.indexOf('-----\r\n');
      if(p==-1)
      {
        cb();
        return;
      }

      var hashes={};
      var vers=[];
      try{
        eval('hashes='+txt.slice(0,p));
        eval('vers='+txt.slice(p+7));
      }
      catch(e)
      {
        cb();
        return;
      }
      cb(hashes,vers);
    });
  }

  function isVerNewerThanNow()
  {

  }

  return {
    processUpdateFile:processUpdateFile,
    isVerNewerThanNow:isVerNewerThanNow,
  };
})();