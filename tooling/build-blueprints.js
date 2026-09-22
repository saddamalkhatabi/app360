'use strict';

// Catalog is authoritative. Generated planning files never overwrite application code.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const catalog = require('../data/catalog.json');
const goals = require('../data/goals.json');
const check = process.argv.includes('--check');
let changed = 0;
const goalMap = new Map(Object.values(goals.age_groups).flat().map(g => [g.key, g]));
const refs = new Map((catalog.design_references || []).map(r => [r.id, r]));
const bullet = rows => rows.map(x => '- ' + x).join('\n');
const optBullets = (title, rows) => rows && rows.length ? `## ${title}\n\n${bullet(rows)}\n\n` : '';
const optPara = (title, text) => text ? `## ${title}\n\n${text}\n\n` : '';
const header = '<!-- Generated from data/catalog.json by tooling/build-blueprints.js; edit the catalog, then regenerate. -->\n\n';
function emit(rel, content) {
  const target = path.join(root, rel);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === content) return;
  changed++;
  if (check) { console.error('STALE blueprint:', rel); return; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
function plannedManifest(a) {
  const base = `apps/${a.age_group}/${a.slug}`;
  return {
    schema_version: '1.1', id: a.id, slug: a.slug, title_ar: a.title_ar,
    age_group: a.age_group, version: 1, status: a.status, scaffold_state: 'blueprint-only',
    kind: a.kind, goal_keys: a.goal_keys,
    entry_path: `${base}/index.html`, manifest_path: `${base}/manifest.webmanifest`, icon_path: `${base}/icon.svg`,
    runtime_profile: a.runtime_profile, depth: a.depth, offline_mode: a.offline_mode,
    update_policy: 'service-worker-auto-activation', capabilities: a.capabilities, bundles: a.bundles,
    practice_model_ar: a.practice_model,
    blueprint_path: a.blueprint_path, prompt_path: a.prompt_path
  };
}
const index = [header + '# دليل بناء التطبيقات العملية\n',
  'الكتالوج هو مصدر الأسماء والخطط والارتباطات. ملفات المواصفات والمطالبات مشتقة منه ويمكن تجديدها بأمر `node tooling/build-blueprints.js`.\n',
  'تضم الخطة تطبيقات حية وأخرى مخططة للبناء. حافظ على التطبيقات الحية كما هي إلا بطلب تطوير محدد، وابن التطبيقات المخططة فوق البنية المشتركة الحالية بدل إنشاء نسخ صغيرة أو معزولة. الربط يصف مساهمة محددة في الهدف ولا يعني تغطيته كاملًا أو إثبات أثر التطبيق.\n',
  'لكل فئة ترتيب بناء مستقل حسب الأولوية ثم ترتيب الكتالوج. ابدأ تطبيقًا واحدًا، نفذ مهمة كاملة واختبرها مع مستخدم مناسب قبل الانتقال إلى التالي.\n'];
for (const group of catalog.age_groups) {
  index.push(`## الفئة ${group.id}\n`, '| التطبيق | الناتج العملي | الحالة | البدء |\n|---|---|---|---|');
  for (const a of catalog.apps.filter(a => a.age_group === group.id).sort((a,b) => a.priority-b.priority)) {
    const b = a.blueprint, base = `apps/${a.age_group}/${a.slug}`;
    const live = a.status === 'live';
    const goalText = a.goal_links.map(l => {
      const g = goalMap.get(l.goal_key);
      return `### ${g.role === 'coach' ? 'المدرب' : 'المتعلم'}: ${g.title_ar}\n\n` +
        `المفتاح: \`${g.key}\`\n\nالمساهمة والنشاط: ${l.rationale_ar}\n\nدليل الملاحظة: ${l.evidence_ar}\n\n` +
        `الحالة: ${l.delivery === 'planned' ? 'مطلوب بناؤه ضمن النسخة الأولى' : 'ممارسة ممكنة في التطبيق الحالي مع المرافق؛ لا تمثل لوحة مدرب آلية'}.\n`;
    }).join('\n');
    const referenceText = b.reference_ids.length ? bullet(b.reference_ids.map(id => {
      const r = refs.get(id); return `[${r.title}](${r.url})`;
    })) : 'تصميم خاص بالمختبر؛ لا تنسب له تجربة منشورة لم تجرَ.';
    const spec = header + `# ${a.title_ar}\n\n` +
      `- الفئة: ${a.age_group}\n- الهوية الثابتة: \`${a.id}\`\n- المسار الوحيد: \`${base}/\`\n- الحالة: ${live ? 'يعمل الآن؛ حافظ على التنفيذ الحالي' : 'مخطط للبناء؛ لا يوجد تطبيق تشغيلي بعد'}\n- أولوية البناء داخل الفئة: ${a.priority}\n\n` +
      `## الحاجة والناتج\n\n${a.description_ar}\n\n**الناتج:** ${b.output_ar}\n\n**المستخدم:** ${b.audience_ar}\n\n` +
      `## نطاق النسخة الأولى وتسلسل الشاشات\n\n${bullet(b.mvp_steps_ar)}\n\n` +
      optBullets('مسارات التجربة والتدرج', b.experience_tracks_ar) +
      optBullets('البنية المشتركة التي يجب إعادة استخدامها', b.shared_infrastructure_ar) +
      optBullets('نظام المحتوى والتوسع', b.content_engine_ar) +
      optPara('التوافق والأجهزة', b.compatibility_ar) +
      optBullets('بوابات الجودة قبل الإطلاق', b.quality_strategy_ar) +
      `## الملاءمة والتدرج\n\n${b.age_adaptation_ar}\n\n${b.feedback_ar}\n\n` +
      `## الارتباطات المحددة بالأهداف\n\n${catalog.mapping_policy_ar}\n\n${goalText}\n` +
      `## بيانات النسخة الأولى\n\n${b.data_model.map(x => '`'+x+'`').join(' · ')}\n\n` +
      'يحفظ الناتج المناسب لهذا التطبيق ومحاولاته محليًا بمفتاح يتضمن الهوية ونسخة schema. حدّد شكل artifact من الناتج المذكور؛ لا تجمع بيانات غير لازمة. عند رفض التخزين يستمر النشاط مع تنبيه واضح وخيار تصدير، ولا يعد المستخدم بحفظ غير حاصل. التسجيل اختياري مع بديل نصي أو ملاحظة مرافق.\n\n' +
      `## التقنية وحدود البناء\n\nRuntime: \`${a.runtime_profile}\` · Depth: \`${a.depth}\` · Offline المستهدف: \`${a.offline_mode}\`.\n\n` +
      `القدرات ${live ? 'المعلنة حاليًا' : 'المستهدفة عند التنفيذ'}: ${a.capabilities.map(x => '`'+x+'`').join('، ')}.\n\n` +
      `${b.boundary_ar}\n\n` +
      'اقرأ FRAMEWORK_AR وARCHITECTURE_AR وDEPENDENCY_POLICY_AR وPWA_OFFLINE_POLICY_AR في docs. لا تستورد من تطبيق آخر ولا تنسخ أصول الرسم. أضف القدرات الصوتية أو التسجيلية إلى العقد إذا بنيت بالفعل؛ لا تفترض أن سجل القدرات مكتبات جاهزة.\n\n' +
      (live ? 'لا تعيد توليد app.json أو واجهة الرسم أو الصوت أو Service Worker؛ الإضافة الحالية توثيق فقط.\n\n' :
        'هذا المجلد حجز رسمي للخطة فقط. عند بدء التنفيذ استخدم `node tooling/scaffold-app.js '+a.age_group+' '+a.slug+' "'+a.title_ar+'"`؛ يحتفظ بالمواصفات والهوية. يتولد عندها package.json وواجهة وManifest وأيقونات وSW، ثم ابنِ الممارسة؛ القالب وحده لا يجعل الحالة live. ثبّت dependencies من الجذر وحدّث lockfile الواحد.\n\n') +
      'واجهة عربية RTL مع تكبير الخط ودعم لوحة المفاتيح واللمس وأزرار بديلة للسحب. أمثلة الإنجليزية مجموعة مستقلة عند وجود محتوى لغوي؛ لا تخلط تعليم قواعد اللغتين. اختبر الهاتف والتابلت والحاسوب، والوضع الأفقي والرأسي. التوافق القديم مطلوب للرسم الحالي؛ لا تدّع دعم جهاز قديم في تطبيق جديد دون اختبار.\n\n' +
      `## قبول الممارسة\n\n${bullet(b.acceptance_ar)}\n\n` +
      `- يتحقق الناتج: ${b.output_ar}\n- كل ارتباط مدرب له نشاط واضح؛ لا تستبدله بعرض عنوان الهدف.\n- بعد البناء تعمل حلقة كاملة وحفظ وإعادة فتح وتصدير أو حذف حسب نوع الناتج.\n- اختبر الانقطاع ورفض التخزين أو الميكروفون حيث ينطبق، والتثبيت والتحديث دون فقد الناتج.\n- قبل live نفذ مراجعة ملاءمة وتجربة مستخدم موثقة، وحدّث الحالة والرابط والعقد وشغّل validator.\n\n` +
      `## أساس الفكرة والمراجع\n\n${b.design_basis_ar}\n\n${referenceText}\n`;
    emit(a.blueprint_path, spec);
    const prompt = header + `# مطالبة بناء: ${a.title_ar}\n\n` +
      `اعمل في مستودع saddamalkhatabi/app360 على ${a.title_ar} للفئة ${a.age_group}، بهوية ${a.id} ومسار ${base}/ فقط.\n\n` +
      'اقرأ docs/FRAMEWORK_AR.md وdocs/ARCHITECTURE_AR.md وdocs/DEPENDENCY_POLICY_AR.md وdocs/PWA_OFFLINE_POLICY_AR.md وdocs/APP_SPEC_TEMPLATE_AR.md ثم data/catalog.json وdata/goals.json وdata/capabilities.json وعقد التطبيق ومواصفاته التالية.\n\n' +
      `اقرأ ${a.blueprint_path} كاملًا. الناتج المطلوب: ${b.output_ar}\n\n` +
      `ابنِ هذه الحلقة أولًا:\n\n${bullet(b.mvp_steps_ar)}\n\n` +
      (b.experience_tracks_ar&&b.experience_tracks_ar.length?`مسارات التجربة المطلوبة:\n\n${bullet(b.experience_tracks_ar)}\n\n`:'') +
      (b.shared_infrastructure_ar&&b.shared_infrastructure_ar.length?`أعد استخدام هذه البنية المشتركة ولا تبن نسخًا موازية منها:\n\n${bullet(b.shared_infrastructure_ar)}\n\n`:'') +
      (b.content_engine_ar&&b.content_engine_ar.length?`نظام المحتوى والتوسع:\n\n${bullet(b.content_engine_ar)}\n\n`:'') +
      (b.compatibility_ar?`التوافق والأجهزة: ${b.compatibility_ar}\n\n`:'') +
      (b.quality_strategy_ar&&b.quality_strategy_ar.length?`بوابات الجودة قبل الإطلاق:\n\n${bullet(b.quality_strategy_ar)}\n\n`:'') +
      `تكييف الفئة: ${b.age_adaptation_ar}\n\n` +
      `الارتباطات الملزمة من حيث النشاط والدليل:\n\n${bullet(a.goal_links.map(l => goalMap.get(l.goal_key).title_ar+' ('+l.goal_key+'): '+l.rationale_ar+'؛ نلاحظ: '+l.evidence_ar))}\n\n` +
      `معايير القبول الخاصة:\n\n${bullet(b.acceptance_ar)}\n\n${b.boundary_ar}\n\n` +
      (live ? 'هذا التطبيق حي ومطلوب الحفاظ عليه: هذه مطالبة سياق لمراجعة أو تطوير لاحق بطلب محدد؛ لا تعد بناءه ولا تغيّر سلوك القلم أو اللمس أو الصوت دون طلب.\n\n' :
        'ابدأ من المجلد الموجود وشغّل scaffold-app كما في المواصفات دون تغيير الهوية أو حذف الوثائق. أنجز تطبيقًا واحدًا بممارسة عاملة، لا صفحة تعريف أو اختبار معلومات عام.\n\n') +
      'استخدم موارد أصلية أو مرخصة وبيانات وهمية في المحاكاة. اجعل الأساس محليًا مع RTL وأزرار لمس واضحة وبديل للسحب والتسجيل، واختبر الحفظ والانقطاع والتثبيت والتحديث. لا تضف مفاتيح خدمات في الواجهة. لا تنسخ من تطبيق آخر؛ لا تستخرج مشتركًا إلا لاحتياج فعلي.\n\n' +
      'افصل مهام المتعلم والمدرب وحالة المخطط عن العامل. لا تضمن أثرًا تربويًا قبل تجربة مناسبة. حدّث الكتالوج والعقد وفق التنفيذ الفعلي، ثم شغّل node tooling/build-blueprints.js وnode tooling/validate-platform.js. اذكر ما بُني وما اختُبر وما بقي، ولا تعلن live قبل اجتياز قبول الممارسة والأجهزة المطلوبة.\n';
    emit(a.prompt_path, prompt);
    if (!live && !fs.existsSync(path.join(root, base, 'package.json'))) {
      emit(base+'/app.json', JSON.stringify(plannedManifest(a), null, 2)+'\n');
      emit(base+'/README.md', header+`# ${a.title_ar}\n\n${a.description_ar}\n\nمجلد خطة أولية للفئة ${a.age_group}، وليس تطبيقًا جاهزًا.\n\n- [مواصفات البناء](BUILD_SPEC.md)\n- [مطالبة البناء](PROMPT_AR.md)\n- [عقد التطبيق المستهدف](app.json)\n\nالمصدر المعتمد للتعديل هو data/catalog.json؛ لا تعدّل الملفات المشتقة يدويًا.\n`);
    }
    index.push(`| ${a.title_ar} | ${b.output_ar} | ${live ? 'يعمل الآن' : 'مخطط'} | [المواصفات](../${a.blueprint_path}) · [المطالبة](../${a.prompt_path}) |`);
  }
  index.push('');
}
index.push('## المراجع وحدود الاستدلال\n', 'هذه أمثلة للممارسات وأنماط منتجات قائمة، وليست إثباتًا لأثر تطبيقاتنا المقترحة أو ترخيصًا لنسخ أصولها. لا نفرض مطابقة كاملة لهدف مركب لمجرد إدراجه.\n');
for (const r of refs.values()) index.push(`- [${r.title}](${r.url}): ${r.note_ar} راجعنا المرجع في ${r.reviewed_on}.`);
emit('docs/APP_BUILD_INDEX_AR.md', index.join('\n')+'\n');
if (check && changed) process.exitCode = 1;
console.log(check ? `Blueprint freshness: ${changed} stale files` : `Generated ${changed} planning files`);
