(function(w){'use strict';
function q(k,source){var m=String(source||'').match(new RegExp('[?&]'+k+'=([^&]*)'));try{return m?decodeURIComponent(m[1]):''}catch(e){return ''}}
function age(){var current=q('launch_age',w.location.search)||w.APP360_LAUNCH_AGE||q('age',w.location.search);if(!current)try{if(w.parent!==w)current=q('launch_age',w.parent.location.search)||q('age',w.parent.location.search)}catch(e){}return current;}
function supports(app,value){if(!app)return false;return app.age_group===value||app.age_groups&&app.age_groups.indexOf(value)>=0;}
function resolve(app){var a=age(),level=supports(app,a)&&app.age_entry_levels?Number(app.age_entry_levels[a]):0;return {age:a,level:level||null};}
function href(app,value){var a=value&&value!=='all'?value:age(),h=String(app&&app.href||'');if(!h||!supports(app,a))return h;h=h.replace(/([?&])launch_(?:age|level)=[^&]*&?/g,'$1').replace(/[?&]$/,'');var level=app.age_entry_levels&&Number(app.age_entry_levels[a]);return h+(h.indexOf('?')>=0?'&':'?')+'launch_age='+encodeURIComponent(a)+(level?'&launch_level='+level:'');}
w.App360AgeLaunch={supports:supports,resolve:resolve,href:href,age:age};
})(window);
