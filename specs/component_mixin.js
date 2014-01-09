module.exports = function(m,s,a){

    var inv = a.invokable, enums = a.enums;

    m.scoped('sparkflow component mixin');
    
    var inv = a.invokable, 
        enums = a.enums,
        presocket = {},
        socket = {};
        
    var groupMatch = m.groupMatcher([['matching data item to be 3',0,'is',3],
      ['matching beginGroup item ',1,'is','<saranghae>'],
      ['matching endGroup item ',3,'is','</saranghae>']]);

    var example = s.Component('example');
    var dummy = s.Component('dummy');
    
    m.scoped('component:example');
    m.obj(example.uuid).isString().length(7);
    m.obj(example.id.split('-')).isArray().length(2);
    
    m.scoped('component out port to dummy inport');
    //connect example in port to dummy in port with example 'exampleIn' alias socket
    dummy.connect('in',example,'out','exampleOut');
    
    m.obj(dummy.port('in').sockets().length).is(1);
    m.obj(dummy.port('in').totalSockets()).is(1);

    example.loopInternalPorts('in','out');

    example.port('in').listen(null,function(n){
      console.log('example in port pushing:',n);
    });

    example.port('out').listen(null,function(n){
      console.log('example out port:',n);
    });

    dummy.port('in').listen(null,function(n){
      console.log('dummy in port pushing:',n);
    });

    example.port('in').beginGroup('<number>');
    example.port('in').data('1');
    example.port('in').endGroup('</number>');

    // m.obj(example.port('in').isDelimiterEnabledForAllSockets()).isTrue();
    example.port('in').enableDelimiterForAllSockets('%');
    
    example.port('in').beginGroup('<tag>');
    example.port('in').data('tagandDelimited');
    example.port('in').endGroup('</tag>');
};
