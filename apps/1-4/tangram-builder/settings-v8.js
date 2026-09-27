'use strict';
(function(){
var cb=d.getElementById('directGuideToggle');
if(!cb)return;
settings.directGuide=G('app360:a1-tangram:directGuide','1')!=='0';
cb.checked=settings.directGuide;
var saveBtn=d.getElementById('saveSettingsBtn'),resetBtn=d.getElementById('resetSettingsBtn');
var oldSave=saveBtn&&saveBtn.onclick,oldReset=resetBtn&&resetBtn.onclick;
if(saveBtn)saveBtn.onclick=function(){settings.directGuide=!!cb.checked;S('app360:a1-tangram:directGuide',settings.directGuide?'1':'0');if(oldSave)oldSave();else draw()};
if(resetBtn)resetBtn.onclick=function(){cb.checked=true;settings.directGuide=true;S('app360:a1-tangram:directGuide','1');if(oldReset)oldReset();draw()};
cb.onchange=function(){settings.directGuide=!!cb.checked;draw()};
})();
