(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.COMMAND_JOURNEY_MISSIONS = factory();
}(this, function () {
  'use strict';

  var worlds = [
    { id: 'garden', name: ['حديقة الفوانيس', 'Lantern Garden'], goal: ['فانوس', 'lantern'], icon: '🏮',
      skill: ['أول أمر وترتيب البطاقات', 'First command and card order'] },
    { id: 'river', name: ['نهر البلّور', 'Crystal River'], goal: ['جسر', 'bridge'], icon: '🌉',
      skill: ['تصحيح الخطأ والتوقّع', 'Debugging and prediction'] },
    { id: 'sky', name: ['جزيرة النجوم', 'Star Island'], goal: ['نجمة', 'star'], icon: '🌟',
      skill: ['تكرار الأوامر', 'Repeating commands'] }
  ];

  // Each route introduces or checks one idea. Coordinates are screen coordinates in both languages.
  var cards = [
    { id: 'first-light', world: 0, size: 3, start: [0, 1, 1], goal: [1, 1], mode: 'touch', keys: ['e'], answer: ['e'],
      title: ['أوّل ضوء', 'First Light'], prompt: ['المس السهم وأضئ الفانوس!', 'Tap the arrow to light the lantern!'],
      win: ['لمسة واحدة، خطوة واحدة!', 'One tap made one step!'] },
    { id: 'wake-the-firefly', world: 0, size: 3, start: [1, 2, 0], goal: [1, 0], mode: 'touch', keys: ['n', 'e'], answer: ['n', 'n'], lights: [[1, 1]], guide: true,
      title: ['صديقة تضيء الطريق', 'A Light Along the Way'], prompt: ['أيقظ اليراعة في طريقك إلى الفانوس.', 'Wake the firefly on your way to the lantern.'],
      win: ['كل ضغطة تحرّك الروبوت مربعًا واحدًا.', 'Every tap moves the robot one square.'] },
    { id: 'two-cards', world: 0, size: 3, start: [2, 1, 3], goal: [0, 1], keys: ['w'], answer: ['w', 'w'],
      title: ['بطاقتان لفانوس', 'Two Cards for a Lantern'], prompt: ['ضع بطاقتين، ثم المس «شغّل».', 'Add two cards, then tap Play.'],
      win: ['حفظ الروبوت أوامرك ونفّذها بالترتيب!', 'The robot kept your orders and followed them in order!'] },
    { id: 'first-then', world: 0, size: 3, start: [0, 2, 1], goal: [1, 1], keys: ['e', 'n'], answer: ['e', 'n'], lights: [[1, 2]],
      title: ['اليراعة أولًا', 'Firefly First'], prompt: ['مرّ على اليراعة أولًا، ثم أضئ الفانوس.', 'Visit the firefly first, then light the lantern.'],
      win: ['أولًا اليراعة، ثم الفانوس. ترتيب البطاقات غيّر الطريق.', 'Firefly first, lantern second. Card order changed the path.'] },
    { id: 'garden-trail', world: 0, size: 3, start: [2, 0, 3], goal: [1, 2], keys: ['w', 's'], answer: ['w', 's', 's'], walls: [[2, 1]], checkpoint: true,
      title: ['فانوس عند السياج', 'Lantern by the Fence'], prompt: ['ابنِ طريقًا من ثلاث بطاقات حول السياج.', 'Build a three-card path around the fence.'],
      win: ['أضأت الحديقة بخطتك!', 'Your plan lit up the garden!'] },

    { id: 'one-card-fix', world: 1, size: 3, start: [0, 2, 1], goal: [2, 1], keys: ['e', 'n'], answer: ['e', 'n', 'e'], walls: [[2, 2]], starter: ['e', 'e', 'e'], edit: [1], mode: 'repair',
      title: ['الجسر ينتظر', 'The Bridge Is Waiting'], prompt: ['شغّل الخطة وشاهد البطاقة التي تحتاج إلى تغيير.', 'Run the plan and watch for the card that needs changing.'],
      win: ['بدّلت البطاقة الوسطى، ففتح الجسر!', 'You changed the middle card and opened the bridge!'] },
    { id: 'swap-order', world: 1, size: 3, start: [2, 2, 3], goal: [1, 1], keys: ['w', 'n'], answer: ['n', 'w'], lights: [[2, 1]], starter: ['w', 'n'], mode: 'swap',
      title: ['أيّهما أولًا؟', 'Which Comes First?'], prompt: ['شغّل الخطة. بدّل ترتيب البطاقتين لتمرّ على اليراعة أولًا.', 'Run the plan. Swap the cards to visit the firefly first.'],
      win: ['البطاقتان نفسهما. بدأت ببطاقة مختلفة فتغيّر الطريق!', 'Same cards. A different first card made a different path!'] },
    { id: 'point-ahead', world: 1, size: 3, start: [0, 1, 0], goal: [1, 1], keys: ['r', 'f'], answer: ['r', 'f'], mode: 'facing', guide: true,
      title: ['وجه نحو الجسر', 'Face the Bridge'], prompt: ['أدر وجه الروبوت نحو الجسر، ثم تقدّم.', 'Turn the robot to face the bridge, then move forward.'],
      win: ['الدوران يغيّر الوجهة. التقدّم ينقل الروبوت.', 'Turning changes where the robot faces. Forward moves it.'] },
    { id: 'make-a-bend', world: 1, size: 3, start: [0, 2, 1], goal: [1, 1], keys: ['f', 'l'], answer: ['f', 'l', 'f'], walls: [[0, 1], [2, 2]],
      title: ['منعطف النهر', 'The River Bend'], prompt: ['تقدّم إلى المنعطف، ثم اختر أمر الدوران.', 'Move to the bend, then choose a turn.'] ,
      win: ['تقدّم، دُر، تقدّم. ثلاث بطاقات فتحت الجسر!', 'Forward, turn, forward. Three cards opened the bridge!'] },
    { id: 'predict-landing', world: 1, size: 3, start: [1, 2, 0], goal: [2, 1], keys: ['f', 'r'], answer: ['f', 'r', 'f'], mode: 'predict', guesses: [[1, 1], [2, 1], [2, 2]], checkpoint: true,
      title: ['أين سيتوقّف؟', 'Where Will It Stop?'], prompt: ['انظر إلى البطاقات. المس المكان الذي تتوقّع أن يصل إليه الروبوت.', 'Look at the cards. Tap the square where you think the robot will stop.'],
      win: ['يمكن للبطاقات أن تخبرك بالمكان قبل أن يتحرّك الروبوت.', 'The cards can tell you where the robot will stop before it moves.'] },

    { id: 'echo', world: 2, size: 4, start: [0, 2, 1], goal: [2, 2], keys: ['f', 'twice'], answer: ['twice'], lights: [[1, 2]], requiresRepeat: true,
      title: ['صدى النجمة', 'The Star’s Echo'], prompt: ['جرّب بطاقة «تقدّم مرتين» وأيقظ اليراعة في الطريق.', 'Try the Forward Twice card and wake the firefly on the way.'],
      win: ['بطاقة واحدة جعلت الروبوت يتقدّم خطوتين!', 'One card made the robot take two steps!'] },
    { id: 'echo-and-turn', world: 2, size: 4, start: [0, 3, 0], goal: [1, 1], keys: ['f', 'r', 'twice'], answer: ['twice', 'r', 'f'], walls: [[1, 3]], lights: [[0, 1]], requiresRepeat: true,
      title: ['خُطوتان ثم دوران', 'Two Steps and a Turn'], prompt: ['كرّر التقدّم نحو اليراعة، ثم خذ المنعطف.', 'Repeat forward to reach the firefly, then take the turn.'],
      win: ['جمعت التكرار والدوران في خطة واحدة.', 'You put a repeat and a turn in one plan.'] },
    { id: 'repeat-repair', world: 2, size: 4, start: [1, 3, 0], goal: [1, 0], keys: ['f', 'twice'], answer: ['twice', 'f'], lights: [[1, 1]], starter: ['f', 'f'], edit: [0, 1], mode: 'repair', requiresRepeat: true,
      title: ['ضوء بعيد', 'A Distant Light'], prompt: ['شغّل البطاقتين، ثم غيّر إحداهما لتصل إلى النجمة.', 'Run the two cards, then change one to reach the star.'],
      win: ['غيّرت بطاقة واحدة فأصبح الطريق أطول.', 'Changing one card made the path longer.'] },
    { id: 'two-fireflies', world: 2, size: 4, start: [0, 3, 1], goal: [2, 1], keys: ['f', 'l', 'r', 'twice'], answer: ['twice', 'l', 'twice'], lights: [[1, 3], [2, 2]], walls: [[0, 2], [1, 2]], requiresRepeat: true,
      title: ['يراعتان في السماء', 'Two Sky Fireflies'], prompt: ['مرّ على اليراعتين، ثم أضئ النجمة.', 'Visit both fireflies, then light the star.'],
      win: ['أعدت استخدام بطاقة التكرار في جزأين من الطريق.', 'You reused the repeat card on two parts of the path.'] },
    { id: 'big-light', world: 2, size: 4, start: [1, 3, 0], goal: [3, 0], keys: ['f', 'l', 'r', 'twice'], answer: ['twice', 'r', 'twice', 'l', 'f'], lights: [[1, 1], [2, 1]], walls: [[1, 0], [2, 2], [2, 3], [2, 0]], requiresRepeat: true, checkpoint: true,
      title: ['أضئ الجزيرة', 'Light Up the Island'], prompt: ['ابنِ خطتك حول الصخور ومرّ على اليراعتين.', 'Build a plan around the rocks and visit both fireflies.'],
      win: ['أضأت العوالم الثلاثة بأوامرك!', 'Your commands lit up all three worlds!'] }
  ];

  var studio = { id: 'free-lights', world: 2, size: 4, start: [0, 3, 1], goal: [3, 0], keys: ['f', 'l', 'r', 'twice'], answer: [], lights: [[1, 3], [2, 2], [3, 1], [0, 1]], mode: 'studio',
    title: ['سماء من صنعك', 'A Sky of Your Own'], prompt: ['اختر أي طريق وأضئ ما شئت من اليراعات.', 'Make any path and light as many fireflies as you like.'] };

  return { worlds: worlds, cards: cards, studio: studio };
}));
