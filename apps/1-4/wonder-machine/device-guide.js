(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./device-core.js'));
  else root.WonderDeviceGuide = factory(root.WonderDeviceCore);
})(this, function(core) {
  'use strict';

  var labels = {
    ar: {
      choose: 'اختر جهازًا أو مهمة', chooseShort: 'اختر', chooseClose: 'تم', actions: 'خيارات المشهد',
      chooseLevel: 'اختر مرحلة', chooseDevice: 'اختر جهازًا', chooseTask: 'اختر مهمة',
      coach: 'المدرب', solo: 'ألعب وحدي', listen: 'اسمع', mute: 'كتم كلام المدرب',
      auto: 'انتقال تلقائي بعد النجاح', waiting: 'التالي بعد قليل', stay: 'ابقَ هنا',
      start: 'ابدأ المهمة', next: 'المهمة التالية', replay: 'أعد المهمة',
      previousPanel: 'الجهاز السابق', nextPanel: 'الجهاز التالي',
      goalAudio: 'اسمع هدف المهمة', last: 'أحسنت! هذه آخر مهمة في المسار.',
      open: 'ابدأ مهمة، أو جرّب أي أداة.',
      done: 'أحسنت! جهّزت المشهد المطلوب.', unreachable: 'أعد المشهد لتجرّب المهمة من جديد.',
      demo: 'شاهد المثال، ثم جرّب بنفسك.',
      effects: 'المؤثرات',
      step: function(number, name, state) { return 'اضغط ' + number + ' · ' + name + ' ← ' + state + '.'; },
      mission: function(index, total) { return 'المهمة ' + arabicNumber(index) + ' من ' + arabicNumber(total); },
      progress: function(count, total) { return 'أنجزت ' + arabicNumber(count) + ' من ' + arabicNumber(total) + ' مهمة'; }
    },
    en: {
      choose: 'Choose a panel or mission', chooseShort: 'Choose', chooseClose: 'Done', actions: 'Scene options',
      chooseLevel: 'Choose a level', chooseDevice: 'Choose a panel', chooseTask: 'Choose a mission',
      coach: 'Coach', solo: 'Play solo', listen: 'Listen', mute: 'Mute coach voice',
      auto: 'Move on after each success', waiting: 'Next up in a moment', stay: 'Stay here',
      start: 'Start mission', next: 'Next mission', replay: 'Try again',
      previousPanel: 'Previous panel', nextPanel: 'Next panel',
      goalAudio: 'Hear the mission goal', last: 'Well done! This is the last mission in the path.',
      open: 'Start a mission, or try any tool.',
      done: 'Well done! You prepared the scene.', unreachable: 'Reset the scene to try the mission again.',
      demo: 'Watch the example, then try it yourself.',
      effects: 'Effects',
      step: function(number, name, state) { return 'Tap ' + number + ' · ' + name + ' → ' + state + '.'; },
      mission: function(index, total) { return 'Mission ' + index + ' of ' + total; },
      progress: function(count, total) { return 'Missions completed ' + count + ' of ' + total; }
    }
  };

  function arabicNumber(value) {
    return String(value).replace(/[0-9]/g,function(digit){return '٠١٢٣٤٥٦٧٨٩'.charAt(Number(digit));});
  }

  function plan(device, task, machine) {
    var order=device.id==='wash'&&task.id==='soap'?['soap','water']:null;
    return core.plan(device,machine,task,order);
  }

  function instruction(device, task, machine, language, coaching) {
    var copy = labels[language];
    if (!task.goal) return {text: copy.open, clip: 'start'};
    if (core.progress(machine, task).done) return {text: copy.done, clip: 'done'};
    var path = plan(device, task, machine);
    if (!path.length) return {text: copy.unreachable, clip: 'reset'};
    if (!coaching) return {text: task.note[language], clip: missionClip(device,task)};
    var step = path[0];
    var index = device.tools.map(function(tool) { return tool.key; }).indexOf(step.tool);
    var tool = device.tools[index];
    var number = language==='ar'?arabicNumber(index+1):index+1;
    return {text: copy.step(number, tool.name[language], tool.states[step.value][language]), clip: 'tool-' + (index + 1), tool: step.tool};
  }

  function missionClip(device,task) {
    return 'mission-'+device.id+'-'+task.id;
  }

  function next(device, task, level) {
    var index = device.tasks.indexOf(task);
    var nextTask = device.tasks[index + 1];
    if (nextTask) return {device: device.id, task: nextTask.id, level: level};
    var panels = core.list('4-8', level);
    var nextPanel = panels[panels.indexOf(device) + 1];
    if (!nextPanel && level < 4) {
      level++;
      nextPanel = core.list('4-8', level)[0];
    }
    return nextPanel ? {device: nextPanel.id, task: nextPanel.tasks[0].id, level: level} : null;
  }

  return {labels: labels, instruction: instruction, missionClip: missionClip, plan: plan, next: next};
});
