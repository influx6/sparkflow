//SparkSparkFlow.js very simple,elegant fpb implementation geared for performance,games and ui
require('em.js')('sparkflow',function(em){

  var sf = this.exports = {}, 
      as = em('as-contrib'),
      streams = as.Streams,
      enums = as.enums,
      validators = as.validators;

  sf.Name ="SparkFlow";

  // Components:
    // SparkFlow.Components
    // SparkFlow.Graph
    // SparkFlow.Network
    // SparkFlow.Port
    // SparkFlow.Socket
    // SparkFlow.Inspector


  var mixins = sf.Mixins = {},
      utils = sf.Utils = {},
      types = sf.Types = {};
  
  utils.massCombineUnOrder = function(fn,massAdd){
    return function(){
      var scope =  {},
      sets = enums.toArray(arguments),
      combine = streams.Streamable.make(),
      combineInjector = as.AppStack.ArrayInjector.make(function(set){
          return fn.call(scope,sets,set);
      });

      scope.stream = combine;
      scope.injector = combineInjector;

      combineInjector.on(function(set){
        combine._massAdd(set);
      });
      
      enums.each(sets,function(e,i,o){
        e.tell(function(){
            var args = enums.toArray(arguments);
            combineInjector.push.apply(combineInjector,args);
        });
      });

      return combine;
    };
  };

  mixins.StreamMixin = function(){
    
      var es = streams.newEventStream('socketStream'),
          ready = as.AppStack.StateManager.Manager({},['ready']),
          bg = es.stream('beginGroup'),
          data = es.stream('data'),
          eg = es.stream('endGroup'),
          grouped =  utils.massCombineUnOrder(function(streams,recieved){
              return ready.ready();
          },true)(bg,data,eg);

          ready.addState('unlock',{
            'ready': function(){ return true; }
          });
          
          ready.addState('lock',{
            'ready': function(){ return false; }
          });

          ready.setDefaultState('unlock');
        
          bg.transformer.add(function(n){
            if(!ready.ready()) data.resume();
            ready.switchState('lock');
            data.pause();
          });

          eg.transformer.add(function(n){
            data.resume();
            ready.switchState('unlock');
          });
        
        es.stream('group',null,grouped);

        return {
          create: function(id){
            if(es.map.exists(id)) return;
            return es.stream(id);
          },

          streams: function(id){
            if(!!es.map.exists(id)) return es.stream(id);
            return es;
          },
        };
  };

  mixins.SocketMixin = function(){
      var sockets = as.AppStack.ArrayDecorator([]);
      var socketSubscribers = as.AppStack.ArrayDecorator([]);

      return {
        connected: function(){
          
        },
        beginGroup:function(d){
          this.streams('beginGroup').emit(d);
        },
        endGroup: function(d){
          this.streams('endGroup').emit(d);
        },
        data: function(d){
          this.streams('data').emit(d);
        },
        connect: function(socket){
          this.sockets.add(socket);
          this.streams('group').bind(socket.streams('group'));

        },
        disconnect: function(socket){
          this.sockets.remove(socket);
        
        }
      }
  };

  mixins.PortMixin = {
    connect: function(Port){
      this.socket.connect(Port.socket(this));
    },
    socket: function(Port){
      return createSocket(Port,this);
    }
  };

  types.Base = function(id){
    this.id = id;
  };

  types.Socket = function(id,from,to){
    types.Base.call(this,id);
    this.toPort = to;
    this.fromPort = from;
  };

  var socketfn = types.Socket.prototype;

  enums.extends(socketfn,mixins.SocketMixin());
  
  types.Port = function(id){
    types.Base.call(this,id);
  };
  
},this);


