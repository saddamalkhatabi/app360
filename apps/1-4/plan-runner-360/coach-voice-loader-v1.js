(function(w,d){'use strict';
var manifest=null;
function load(done){var req=new XMLHttpRequest();req.onreadystatechange=function(){if(req.readyState!==4)return;if(req.status!==200)return done(null);try{manifest=JSON.parse(req.responseText);done(manifest)}catch(e){done(null)}};req.open('GET','../../../tooling/age1-4-silma/worker-4/narration-plan-runner-360.json',true);req.send(null)}
w.SilmaCoachManifest={load:load,get:function(){return manifest},audioReady:function(clip){return !!(clip&&clip.engine==='silma'&&clip.render_status==='rendered_and_verified')}};
})(window,document);
