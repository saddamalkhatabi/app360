/* Offline-first AR / EN labels and voice selection; does not change saved custom routines. */
(function(w,d){
'use strict';
var KEY='app360-routine-language-v1',lang='ar',m,labels=w.APP360_ROUTINE_ENGLISH_LABELS||{},D=w.ROUTINE_DATA;
try{lang=w.localStorage.getItem(KEY)||'ar'}catch(e){}
m=/(?:\?|&)lang=(ar|en)(?:&|$)/i.exec(w.location.search||'');
if(m){lang=m[1].toLowerCase();try{w.localStorage.setItem(KEY,lang)}catch(e){}}
if(lang!=='en')lang='ar';
w.APP360_ROUTINE_LANG=lang;
w.APP360_ROUTINE_SET_LANG=function(code){
 if(code!=='ar'&&code!=='en')return;
 try{w.localStorage.setItem(KEY,code)}catch(e){}
 w.location.reload();
};
var i,a,x;
if(D&&D.habits){
 for(i=0;i<D.habits.length;i++){
  a=D.habits[i]; x=labels[a.id];
  if(!x||!x.title||!x.steps||x.steps.length!==5)continue;
  if(lang==='en'){
   a.title=x.title; a.steps=x.steps.slice(0);
   a.tip='Watch the five pictures, then try the steps together.';
  }
 }
}
function setText(selector,t){
 var el=d.querySelector(selector);if(el)el.textContent=t;
}
function english(){
 d.documentElement.lang='en';
 d.body.className+=' routineLangEnglish';
 var translate={
  '.brand small':'Family School 360 · Ages 1 to 4',
  '.brand h1':'I Can Do It: My Picture Routine',
  '.brand p':'50 everyday skills learned with pictures and practice.',
  '.habitCount':'50 routines',
  '#tabs [data-view="library"]':'⭐ Learn a routine',
  '#tabs [data-view="builder"]':'🧩 Make my routine',
  '#tabs [data-view="child"]':'▶ Let’s begin',
  '#tabs [data-view="review"]':'🌱 For grown-ups',
  '.routineIntro .eyebrow':'First pictures, then practice',
  '.routineIntro h2':'Five easy pictures, then let me try',
  '.routineIntro p':'Watch the whole picture story. Look at each scene, then practice in real life.',
  '.introSteps':'① Watch the story   ② Look at each step   ③ Try it   ④ Practice kindly',
  '.introMark b':'Scenes in every routine',
  '.introMark small':'One picture storyboard',
  '#prevHabit':'← Previous routine',
  '#nextHabit':'Next routine →',
  '#reelReplay':'↻ Replay',
  '#playStory':'▶ Play from the start',
  '#speakStory':'🔊 Hear the routine name',
  '#useHabit':'Practice this routine',
  '.libraryHead h2':'50 small habits to grow independence',
  '.libraryHead p':'Each routine has five visual steps for little learners.',
  '#blank':'＋ Our own routine',
  '.designNote b':'Picture-story viewer',
  '.designNote p':'Watch the whole story, focus on one scene at a time, and return to the full picture at the end.',
  '#save':'💾 Save on this device',
  '#addStep':'＋ Add a step',
  '#startRoutine':'▶ Let’s try it',
  '#backBuilder':'✎ Edit',
  '#stopRun':'Stop for now',
  '#speakStep':'🔊 Hear this step',
  '.realHint':'Look at the picture, try it in real life, and come back whenever you like.',
  '#print':'🖨 Print',
  '#exportBtn':'⇩ Export',
  '#again':'↻ Try again'
 };
 for(var q in translate)if(translate.hasOwnProperty(q))setText(q,translate[q]);
 var b=d.querySelector('.topTools');
 if(b){var button=d.createElement('button');button.id='routineLanguageToggle';button.type='button';button.className='routineLanguageToggle';button.title='Switch to Arabic';button.textContent='العربية';button.onclick=function(){w.APP360_ROUTINE_SET_LANG('ar')};b.appendChild(button)}
 var catTitles={'hygiene':'Hygiene','dress':'Getting dressed','order':'Tidying up','food':'Food and drinks','daily':'Everyday skills','social':'Friends and feelings','safety':'Staying safe'};
 if(D&&D.categories){for(i=0;i<D.categories.length;i++){a=D.categories[i];if(catTitles[a.id])a.title=catTitles[a.id]}}
}else{
 var b=d.querySelector('.topTools');
 if(b){var button=d.createElement('button');button.id='routineLanguageToggle';button.type='button';button.className='routineLanguageToggle';button.title='Switch to English';button.textContent='English';button.onclick=function(){w.APP360_ROUTINE_SET_LANG('en')};b.appendChild(button)}
}
if(lang==='en')english();
})(window,document);
