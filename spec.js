var em = require('em'),
as = em('as-contrib'),
spkfl = em('./lib/sparkflow.js');

require('./specs/stream_mixin.js')(as.AppStack.Matchers,spkfl,as);
require('./specs/socket_mixin.js')(as.AppStack.Matchers,spkfl,as);
require('./specs/port_mixin.js')(as.AppStack.Matchers,spkfl,as);
require('./specs/component_mixin.js')(as.AppStack.Matchers,spkfl,as);
require('./specs/network_mixin.js')(as.AppStack.Matchers,spkfl,as);
