module.exports = function(m,s,a){

    var inv = a.invokable, enums = a.enums;

    m.scoped('sparkflow socket mixin');
    
    var inv = a.invokable, 
        enums = a.enums,
        presocket = {},
        socket = {};
        
    var groupMatch = m.groupMatcher([['matching data item to be 3',0,'is',3],
      ['matching beginGroup item ',1,'is','<saranghae>'],
      ['matching endGroup item ',3,'is','</saranghae>']]);

    enums.extends(socket,s.Mixins.StreamMixin(),s.Mixins.SocketMixin());
    enums.extends(presocket,s.Mixins.StreamMixin(),s.Mixins.SocketMixin());
   
    // socket.connect(presocket);

    presocket.listen(function(n){
      groupMatch(n);
    });

    socket.data(3);
    socket.beginGroup('<saranghae>');
    socket.data('i love you!');
    socket.endGroup('</saranghae>');
};
