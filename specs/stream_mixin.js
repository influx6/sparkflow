//contains the basic test suite for the mixins.StreamMixin
module.exports = function(m,sk,as){
    
    var inv = as.invokable;

    m.scoped('sparkflow stream mixin');
    var stream = sk.Mixins.StreamMixin();

    var groupMatch = m.groupMatcher([['sample from group begintag',0,'is','<number>'],
    ,['sample from group data',1,'is',1],['sample from group endtag',2,'is','</number>']]);
    
    m.obj(stream).isValid();
    m.obj(stream.streams()).isValid().isInstanceOf(as.Streams.EventStreams);
    m.obj(stream.streams('beginGroup')).isValid().isInstanceOf(as.Streams.Streamable);
    m.obj(stream.streams('endGroup')).isValid().isInstanceOf(as.Streams.Streamable);
    m.obj(stream.streams('data')).isValid().isInstanceOf(as.Streams.Streamable);
    m.obj(stream.streams('group')).isValid().isInstanceOf(as.Streams.Streamable);
    
    stream.streams('data').tell(function(n){
        m.scoped('sample data').obj(n).isNumber();
    });
    

    stream.streams('group').tell(function(n){
      groupMatch(n);
    });

    stream.streams('beginGroup').emit('<number>');
    stream.streams('data').emit(1);
    stream.streams('endGroup').emit('</number>');
    
    //will exist and be sent to stream but matchers wont catch it,due to count restriction
    stream.streams('beginGroup').emit('<untag>');
    stream.streams('data').emit(2);
    stream.streams('endGroup').emit('</untag>');
};
