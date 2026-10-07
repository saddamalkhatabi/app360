(function(w,d){
'use strict';
var swalBase=d.currentScript&&d.currentScript.src;
if(w.APP360_LEGACY||w.Swal)return;

/* Safe compatibility loader. Keep portal bootstrap independent from any CDN.
   SweetAlert2 is optional UI enhancement only. */
function load(){
  if(w.APP360_LEGACY||w.Swal||d.getElementById('app360-swal2-script'))return;
  try{
    var head=d.head||d.getElementsByTagName('head')[0]||d.documentElement;
    var css=d.createElement('link');
    css.rel='stylesheet';
    css.href='';
    /* Styles are bundled in the local all build. */
    var sc=d.createElement('script');
    sc.id='app360-swal2-script';
    sc.src=new URL('../vendor/sweetalert2-11.23.0.all.min.js',swalBase||new URL('assets/js/swal-modern-loader.js',location.href).href).href;
    sc.async=true;
    sc.onerror=function(){};
    head.appendChild(sc);
  }catch(e){}
}
if(d.readyState==='loading'){
  if(d.addEventListener)d.addEventListener('DOMContentLoaded',load,false);
  else if(w.attachEvent)w.attachEvent('onload',load);
  else setTimeout(load,0);
}else load();
})(window,document);
