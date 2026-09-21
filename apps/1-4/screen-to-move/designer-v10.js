(function(root){
'use strict';
var base=root.App360WorksheetDesigner;
function el(id){return document.getElementById(id)}
function qa(sel,baseNode){return Array.prototype.slice.call((baseNode||document).querySelectorAll(sel)||[])}
function addClass(n,c){if(!n)return;if((' '+n.className+' ').indexOf(' '+c+' ')<0)n.className=(n.className+' '+c).replace(/^\s+|\s+$/g,'')}
function removeClass(n,c){if(!n)return;n.className=(' '+n.className+' ').replace(' '+c+' ',' ').replace(/^\s+|\s+$/g,'')}
function enhanceWorksheet(){
  var panel=document.querySelector('.wd9-panel');if(!panel||panel.getAttribute('data-v10')==='1')return;
  panel.setAttribute('data-v10','1');addClass(panel,'wd10-panel');
  var main=panel.querySelector('.wd-main'),side=panel.querySelector('.wd-sidebar'),work=panel.querySelector('.wd-work');if(!main||!side||!work)return;
  var drawer=document.createElement('aside');drawer.id='wdSettingsDrawer';drawer.className='wd-settings-drawer';
  var top=work.querySelector('.wd-toptools'),templates=work.querySelector('.wd-template-strip'),ready=work.querySelector('.wd-ready');
  if(top)drawer.appendChild(top);if(templates)drawer.appendChild(templates);if(ready)drawer.appendChild(ready);drawer.appendChild(side);panel.appendChild(drawer);
  var toggle=document.createElement('button');toggle.id='wdSettingsToggle';toggle.className='wd-settings-toggle';toggle.type='button';toggle.innerHTML='<span aria-hidden="true">☰</span><b>الأدوات والإعدادات</b>';panel.appendChild(toggle);
  function close(){removeClass(drawer,'open');removeClass(toggle,'open');toggle.setAttribute('aria-expanded','false')}
  function open(){addClass(drawer,'open');addClass(toggle,'open');toggle.setAttribute('aria-expanded','true')}
  toggle.setAttribute('aria-expanded','false');toggle.onclick=function(){if((' '+drawer.className+' ').indexOf(' open ')>=0)close();else open()};
  toggle.title='إظهار أو إخفاء الأدوات والإعدادات';
  open();
}
if(base&&base.open){var oldOpen=base.open;base.open=function(game){oldOpen(game);setTimeout(enhanceWorksheet,10)};base.version=10;}
root.App360EnhanceWorksheetV10=enhanceWorksheet;
})(window);
