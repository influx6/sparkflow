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

    console.log(example,example.id.split('-'));
};
