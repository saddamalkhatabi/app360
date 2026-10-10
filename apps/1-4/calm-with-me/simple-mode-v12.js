(function(d){
'use strict';
function dyn(id,src,cb){var h=d.head||d.getElementsByTagName('head')[0]||d.body,s;if(d.getElementById(id)){if(cb)cb();return}s=d.createElement('script');s.id=id;s.src=src;s.async=false;if(cb){s.onload=cb;s.onerror=cb}h.appendChild(s)}
if(d.readyState==='loading'&&d.write){d.write('<script id="app360FamilySync" src="../../../assets/js/app360-family-sync-v1.js?v=107"><\/script>');d.write('<script id="app360FamilyCatalog" src="../../../assets/js/app360-family-catalog-v1.js?v=107&brand=98"><\/script>');d.write('<script id="calmSimpleModeOriginal" src="simple-mode-v12-original.js?v=17&brand=98"><\/script>');return}
dyn('app360FamilySync','../../../assets/js/app360-family-sync-v1.js?v=107',function(){dyn('app360FamilyCatalog','../../../assets/js/app360-family-catalog-v1.js?v=107&brand=98')});dyn('calmSimpleModeOriginal','simple-mode-v12-original.js?v=17&brand=98');
})(document);
