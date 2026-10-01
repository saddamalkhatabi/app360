(function(d){
'use strict';
function dyn(id,src,cb){var h=d.head||d.getElementsByTagName('head')[0]||d.body,s;if(d.getElementById(id)){if(cb)cb();return}s=d.createElement('script');s.id=id;s.src=src;s.async=false;if(cb){s.onload=cb;s.onerror=cb}h.appendChild(s)}
function embedded(){return window.parent!==window&&/[?&]family_embedded=1(?:&|$)/i.test(String(window.location.search||''))}
if(d.readyState==='loading'&&d.write){if(!embedded()){d.write('<script id="app360FamilySync" src="../../../assets/js/app360-family-sync-v1.js?v=6"><\/script>');d.write('<script id="app360FamilyCatalog" src="../../../assets/js/app360-family-catalog-v1.js?v=6"><\/script>')}d.write('<script id="pkUiV11Original" src="ui-v11-original.js?v=19"><\/script>');return}
if(!embedded())dyn('app360FamilySync','../../../assets/js/app360-family-sync-v1.js?v=6',function(){dyn('app360FamilyCatalog','../../../assets/js/app360-family-catalog-v1.js?v=6')});dyn('pkUiV11Original','ui-v11-original.js?v=19');
})(document);
