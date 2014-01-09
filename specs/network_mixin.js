module.exports = function(m,s,a){

    var inv = a.invokable, enums = a.enums;

    m.scoped('sparkflow network mixin');
    
    var inv = a.invokable, 
        enums = a.enums,
        presocket = {},
        socket = {};
        
    var groupMatch = m.groupMatcher([['matching data item to be 3',0,'is',3],
      ['matching beginGroup item ',1,'is','<saranghae>'],
      ['matching endGroup item ',3,'is','</saranghae>']]);

    var enk = s.Network('exampleNK');
    m.obj(enk.uuid).length(16);
    m.obj(enk.id).is('exampleNK');
    m.obj(enk.isSubgraph).is(false);

    var com1 = s.Component('compo-one');
    var com2 = s.Component('compo-two');

    enk.component(com1,'com1');
    enk.component(com2,'com2');

    m.scoped('asserting network components alias');

    m.obj(enk.hasAlias('com1')).isTrue();
    m.obj(enk.hasAlias('com2')).isTrue();

    m.obj(enk.getAliasUUID('com1')).is(com1.uuid);
    m.obj(enk.getAliasUUID('com2')).is(com2.uuid);


};
