(function(w,d){
'use strict';
if(w.APP360_LEGACY)return;
/* Loaded during parsing so modern browsers keep the original SweetAlert2 UI.
   If the CDN is unavailable, the already-installed App 360 fallback remains. */
try{
  d.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/dist/sweetalert2.min.css">');
  d.write('<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/dist/sweetalert2.all.min.js"><\\/script>');
}catch(e){}
})(window,document);
