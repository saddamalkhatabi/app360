/* Local guided sessions. Uses the scene narrator and the existing legacy-compatible sheet. */
(function(w,d){'use strict';
var hooks=null,prefs={age:'1-4',family:'',minutes:5,autoplay:true},key='app360:a1-imitate:coach:v1';
var routes=[{id:'turn-taking-1-4',age:'1-4',level:1,path:'launch.html?action=session&launch_age=1-4&autoplay=1'}, {id:'turn-taking-4-8',age:'4-8',level:5,path:'launch.html?action=session&launch_age=4-8&launch_level=5&autoplay=1'}];
function el(id){return d.getElementById(id)}
function label(age){return age==='4-8'?'مدربة المدرسة':'مدربة الروضة'}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function refresh(age){if(el('coachLabel'))el('coachLabel').textContent=label(age)+' · المدرب الآلي'}
function save(){prefs={age:el('coachAge').value,family:el('coachFamily').value,minutes:Math.max(1,Math.min(30,Math.round(Number(el('coachMinutes').value)||5))),autoplay:el('coachAuto').checked};try{w.localStorage.setItem(key,JSON.stringify(prefs))}catch(e){}return prefs}
function open(){if(!hooks||!w.A1TurnTaking)return;var api=w.A1TurnTaking,s=api.state(),options='<option value="">كل المجالات</option>',i;
for(i=0;i<hooks.families.length;i++){var f=hooks.families[i];options+='<option value="'+esc(f.id)+'">'+esc(f.title)+'</option>'}
hooks.openSheet('المدرب الآلي · '+label(s.age),'<section class="coach-panel"><p>أختار معكم تجربة، وأشرح مشاهدها بصوت مسجل. ثم أترك وقتًا للعب في الواقع، وأنتقل إلى التجربة التالية عند تفعيل التنقل الآلي.</p><label>الفئة والمسار<select id="coachAge"><option value="1-4">مدربة الروضة · 1–4</option><option value="4-8">مدربة المدرسة · 4–8 · المستوى المتقدم</option></select></label><label>مجال التجارب<select id="coachFamily">'+options+'</select></label><label>وقت الجلسة بالدقائق<input id="coachMinutes" type="number" min="1" max="30" step="1"></label><label class="coach-check"><input id="coachAuto" type="checkbox"> التنقل الآلي بين التجارب بعد الشرح ووقت التطبيق</label><p class="coach-hint">في الوضع اليدوي أشرح تجربة واحدة، ثم تختارون وقت الانتقال بأنفسكم. يمكن إخفاء نص الشرح أو كتمه من أزرار المشاهد.</p><button id="coachStart" class="btn primary wide">ابدأ جلسة جديدة</button><div id="coachCurrent"'+(s.experience?'':' hidden')+'><p id="coachStatus" role="status"></p><div class="action-row"><button id="coachResume" class="btn primary">استئناف الجلسة الحالية</button><button id="coachStop" class="btn">إنهاء الجلسة</button></div></div><small>فتح هذه اللوحة يوقف الجلسة مؤقتًا. إغلاقها وحده لا يستأنفها. تسجيل تنفيذ التجربة يتم بتأكيدكم.</small></section>');
el('coachAge').value=s.age;el('coachFamily').value=prefs.family;el('coachMinutes').value=prefs.minutes;el('coachAuto').checked=prefs.autoplay;
el('coachAge').onchange=function(){el('sheetTitle').textContent='المدرب الآلي · '+label(this.value)};
if(s.experience)el('coachStatus').textContent='الجلسة متوقفة مؤقتًا · '+(s.auto?Math.max(0,Math.ceil(s.remaining))+' ثانية متبقية · ':'تنقل يدوي · ')+(s.phase==='practice'?'وقت اللعب في الواقع':'شرح المشاهد');
el('coachStart').onclick=function(){var p=save();hooks.closeSheet(false);if(!api.start({age:p.age,family:p.family,duration_seconds:p.minutes*60,autoplay:p.autoplay}))return;refresh(p.age)};
el('coachResume').onclick=function(){hooks.closeSheet(false);api.resume()};
el('coachStop').onclick=function(){api.stop();el('coachCurrent').hidden=true};
el('coachAge').focus();
}
w.A1AutoCoach={routes:routes,refresh:refresh,open:open,mount:function(config){hooks=config;try{var p=JSON.parse(w.localStorage.getItem(key)||'null');if(p){prefs.family=typeof p.family==='string'?p.family:'';prefs.minutes=Math.max(1,Math.min(30,Math.round(Number(p.minutes)||5)));prefs.autoplay=p.autoplay!==false}}catch(e){}var button=el('coachBtn');if(button)button.onclick=open;refresh(w.A1TurnTaking.state().age)}};
})(window,document);
