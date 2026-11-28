/* Shared praise selection for app and automatic-coach milestones. ES5. */
(function (w) {
  'use strict';
  function create() {
    var owner = null;
    return {
      play: function (options, done) {
        var service = w.APP360_TEACHER_ENCOURAGEMENT;
        if (!service || options.enabled === false || !service.profile()) return false;
        owner = service;
        var accepted = service.play(options, function () {
          owner = null;
          if (done) done();
        });
        if (!accepted) owner = null;
        return accepted;
      },
      stop: function () {
        if (owner) owner.stop();
        owner = null;
      }
    };
  }
  w.APP360_SCHOOL_VOICE_FEEDBACK = { create: create };
})(window);
