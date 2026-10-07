(function(w,d){
'use strict';
var swalBase=d.currentScript&&d.currentScript.src;
if(w.APP360_LEGACY||w.Swal)return;

/* Safe non-blocking SweetAlert2 preloader for modern browsers.
   Never use document.write here: a malformed/blocked injected script must not
   stop the portal bootstrap (age groups + applications). lab360.js also has
   its own lazy fallback loader when a detail dialog is actually opened. */
function load(){
  if(w.APP360_LEGACY||w.Swal||d.getElementById('app360-swal2-script'))return;
  try{
    var head=d.head||d.getElementsByTagName('head')[0]||d.documentElement;
    var css=d.createElement('link');
    css.rel='stylesheet';
    css.href='';
    css.setAttribute('data-app360-swal','css');
    /* Styles are bundled in the local all build. */

    var sc=d.createElement('script');
    sc.id='app360-swal2-script';
    sc.src=new URL('../vendor/sweetalert2-11.23.0.all.min.js',swalBase||new URL('assets/js/swal-modern-loader.js',location.href).href).href;
    sc.async=true;
    sc.onerror=function(){
      /* Do nothing: portal rendering is independent from SweetAlert2.
         lab360.js will retry lazily only when details are requested. */
    };
    head.appendChild(sc);
  }catch(e){}
}

if(d.readyState==='loading'){
  if(d.addEventListener)d.addEventListener('DOMContentLoaded',load,false);
  else if(w.attachEvent)w.attachEvent('onload',load);
  else setTimeout(load,0);
}else load();
})(window,document);
