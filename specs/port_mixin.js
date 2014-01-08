module.exports = function(m,s,a){

    var inv = a.invokable, enums = a.enums;

    m.scoped('sparkflow port mixin');
    
    var inv = a.invokable, 
        enums = a.enums,
        piz = s.Port('piz'),
        piw = s.Port('piw'),
        piv = s.Port('piv');
        
    // var groupMatch = m.groupMatcher([['matching data item to be 3',0,'is',3],
    //   ['matching beginGroup item ',1,'is',1],
    //   ['matching endGroup item ',3,'is','</saranghae>']]);
    
    piw.connect(piz);
    
    piv.enableMultipleSockets();

    piv.connect(piw);
    piv.connect(piz);
    
    piw.data(1);
    piv.data(2);

};
