(function(w){'use strict';
function role(a){if(!a||a.is_home)return '';if(/^(coach|shared|learner)$/.test(a.audience||''))return a.audience;var b=a.blueprint;if(!b)return '';return /^(مدرب الفئة|مدربون|المرشد|مرافق أو مدرب)/.test(b.audience_ar||'')?'coach':'learner'}
function label(a){var v=role(a),child=a&&(a.age_group==='1-4'||a.age_group==='4-8');return v==='coach'?'للمدرب أساسًا':v==='shared'?(child?'للطفل والمدرب معًا':'للمتعلم والمدرب معًا'):v==='learner'?(child?'للطفل بإسناد المدرب':'للمتعلم'):''}
function note(a){return String(a&&a.audience_note_ar||'')}
w.APP360_APP_AUDIENCE={version:'1.0.0',role:role,label:label,note:note};
})(window);
