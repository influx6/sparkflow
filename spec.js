var em = require('em'),
as = em('as-contrib'),
spkfl = em('./lib/sparkflow.js');

require('./specs/stream_mixin.js')(as.AppStack.Matchers,spkfl,as);
