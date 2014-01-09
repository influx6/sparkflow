//SparkSparkFlow.js very simple,elegant fpb implementation geared for performance,games and ui
require('em.js')('sparkflow',function(em){

  var sf = this.exports = {}, 
      as = em('as-contrib'),
      streams = as.Streams,
      enums = as.enums,
      notify = as.notifiers,
      inv = as.invokable,
      validators = as.validators;

  sf.Name ="SparkFlow";

  // Components:
    // SparkFlow.Components
    // SparkFlow.Graph
    // SparkFlow.Network
    // SparkFlow.Port
    // SparkFlow.Socket
    // SparkFlow.Inspector
    // SparkFlow


  var mixins = sf.Mixins = {},
      utils = sf.Utils = {},
      types = sf.Types = {},
      idleSocketFilter = function(state){
        return (this.elem.connected() === state && this.elem);
      },
      filter = function(socket){
        return (this.elem.binder === socket  && this.elem);
      };
  

  mixins.StreamMixin = function(){
    
      var es = streams.newEventStream('socketStream'),
          ready = as.AppStack.StateManager.Manager({},['ready']),
          bg = es.stream('beginGroup'),
          data = es.stream('data'),
          eg = es.stream('endGroup'),
          grouped =  streams.combineUnOrderByStreams(function(streams,recieved){
              return ready.ready();
          },function(received){
              this.stream._massAdd(received);
          })(bg,data,eg);

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

          grouped.transformer.add(function(){
              grouped.connected = true;
          });

          grouped.drain.add(function(){
              grouped.connected = false;
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

  utils.socketListPicker =  enums.pickWith(filter);
  utils.socketListRemove =  enums.removeWith(filter);
  utils.idleSockets =  enums.pickWith(idleSocketFilter);

  mixins.SocketMixin = function(){
      var socketSubscribers = as.AppStack.ArrayDecorator([]);
      var remover,finder,to,from;

      socketSubscribers.unsafe(function(target){
        remover = utils.socketListRemove(target);
        finder = utils.socketListPicker(target);
      });

      return {
        init: function(frm){
           if(validators.exists(frm)) from = frm;
           return this;
        },
        from: function(){
          return from;
        },
        to: function(t){
           if(t === -1) to = null;
           if(t && t !== -1) to = t;
           return to;
        },
        disconnectAll: function(){
          socketSubscribers.cascade(function(e){
            e.off();
          });
        },
        hasSocket: function(socket){
          return finder(socket).length > 0;
        },
        streaming: function(){
          return this.streams('group').connected;
        },
        disconnected: function(){
          return validators.notExist(to);
        },
        connected: function(){
          return validators.exists(to);
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
        listen: function(fn){
          this.streams('group').tell(fn);
        },
        subscribe: function(fn){
          return this.streams('group').subscribe(fn);
        },
        connect: function(socket){
          if(this.hasSocket(socket)) return;

          var group =  socket.streams('group'),
              emitter = enums.bind(group.emit,group),
              sub = this.streams('group').subscribe(emitter);
          
          sub.binder = socket;
          
          sub.whenClosed(function(){
              sub.binder = null;
          });

          socketSubscribers.add(sub);

          return sub;
        },
        disconnect: function(socket){
          return enums.each(remover(socket),function(e){ 
            e.off(); 
          });
        },
        close: function(){
          socketSubscribers.cascade(function(e){ e.off(); });
          this.streams('group').flushListeners();
          socketSubscribers.explode();
          from = to = null;
        },
        ID: function(){
           return [from.ID(),this.id].join('->');
        }
      }
  };

  mixins.PortMixin = function(){
    var finder,filter,initd = false,
    aliases = as.AppStack.HashHelpers({}),
    sockets = as.AppStack.ArrayDecorator([]);

    sockets.unsafe(function(target){
      filter = utils.idleSockets(target);
    });

    var tagName = function(name){
      return name+':'+(sockets.length() - 1);
    }

    return {
      init: function(){
        if(initd) return this;
        this.createSocket();
        sockets.limit(1);
        initd = true;
      },
      sockets: function(){
        return sockets.clone();
      },
      enableMultipleSockets: function(){
        sockets.limit(null);
      },
      disableMultipleSockets: function(){
         sockets.limit(1);
      },
      allowsMultipleSockets: function(){
        return !sockets.limited();
      },
      ownSocket: function(socket){
        return sockets.has(socket) !== -1;
      },
      createSocket: function(alias){
          var id,newSocks = sf.Socket(tagName(this.id),this);
          sockets.add(newSocks);
          id = sockets.has(newSocks);
          alias = (alias !== null ? alias : id);
          aliases.add(alias,id);
          return newSocks;
      },
      connect: function(Port,socket,alias){
        if(this.allowsMultipleSockets()){
        
          var available = filter(false),
          socks = socks = (socket && Port.ownSocket(socket) ? socket : Port.socket()),
          newSocks;

          if((this.allowsMultipleSockets() && (available && available.length > 0))){
            available[0].connect(socks);
            available[0].to(Port);
            return;
          }
          
          newSocks = this.createSocket(alias);
          newSocks.connect(socks);
          newSocks.to(Port);


        }else{
          
          var first = this.socket(), socks = (socket && Port.ownSocket(socket) ? socket : Port.socket());
          if(!first.connected()){
            first.connect(socks);
            first.to(Port);
          }
        
        }
        
        return;
      },
      disconnect: function(Port,socket,socketId){
        var socks = (socket && Port.ownSocket(socket) ? socket : Port.socket());
        if(this.allowsMultipleSockets()){

          var idd = this.socket(socketId);
          if(idd) return (!!idd && idd.disconnect(socket));

          return sockets.cascade(function(e){
             e.disconnect(socks);
             if(e.to() === Port) e.to(-1);
          });
        
        }else{
           this.socket().disconnect(socks);
           e.to(-1);
        }
      },
      disconnectAll: function(){
          return sockets.cascade(function(e){
             e.disconnectAll();
             if(e.to()) e.to(-1);
          });
      },
      leechSocket: function(Port,socket,socketId){
        if(!socket || !Port.ownSocket(socket)) return;
        
        var socks = (socketId && this.socket(socketId));
        if(!validators.exists(socks)) socks = this.socket();

        socks.connect(socket);
        return;
      },
      unleechSocket: function(Port,eSocket,socketId){
        if(!socket || !Port.ownSocket(socket)) return;
        
        var socks = (socketId && this.socket(socketId));
        if(!validators.exists(socks)) socks = this.socket();

        socks.disconnect(socket);
        return;
      },
      socket: function(n){
        if(!this.allowsMultipleSockets()) return sockets.nth(0);
        return (!!n && sockets.nth(aliases.get(n)));
      },
      beingGroup: function(data,socketID){
        if(socketID){
          var soc = sockets.nth(socketID);
          if(soc) soc.beingGroup(data);
          return;
        }
        sockets.cascade(function(e){
          if(e) e.beginGroup(data);
        });
      },
      endGroup: function(data,socketID){
        if(socketID){
          var soc = sockets.nth(socketID);
          if(soc) soc.beingGroup(data);
          return;
        }
        sockets.cascade(function(e){
          if(e) e.endGroup(data);
        });
      },
      data: function(data,socketID){
        if(socketID){
          var soc = sockets.nth(aliases.get(socketID));
          if(soc) soc.beingGroup(data);
          return;
        }
        sockets.cascade(function(e){
          if(e) e.data(data);
        });
      },
      socketId: function(socket){
        var ind = sockets.has(socket),
            g = sockets.KV(),
            gind = g[1].indexOf(ind);

        return g[0][gind];
      },
      ID: function(){
        return [this.componentID,this.id].join('#');
      },
      listen: function(id,fn){ 
        if(!this.allowsMultipleSockets()) return this.socket().listen(fn);
        this.socket(id).listen(fn);
      },
      subscribe: function(id,fn){
        if(!this.allowsMultipleSockets()) return this.socket().subscribe(fn);
        return this.socket(id).subscribe(fn);
      },
      close: function(){
        sockets.cascade(function(e){
          e.close();
        });
      },
    };
  };
  
  mixins.ComponentMixin = function(){
    var cmeta, pmeta, 
      // lists = as.ds.List.make(),
      // itr = lists.iterator(),
     _meta = { 
       componentMeta:{}, 
       ports:{}, 
       portIds:{} 
     };

     cmeta = as.AppStack.HashHelpers(_meta.componentMeta);
     pmeta = as.AppStack.HashHelpers(_meta.ports);
     idMeta = as.AppStack.HashHelpers(_meta.portIds);

    return {
      init: function(){
         var self = this,optionSocket = as.Streams.Streamable.make();

         pmeta.add('options',optionSocket);
         
         optionSocket.id = "OptionStreams";
         optionSocket.ID = function(){
           return self.ID()+'->'+this.id;
         };

         pmeta.add('in',sf.Port('in',this));
         pmeta.add('out',sf.Port('out',this));
         pmeta.add('err',sf.Port('err',this));

         idMeta.add('options','options');
         idMeta.add('in','in');
         idMeta.add('out','out');
         idMeta.add('err','err');
        
         this.subgraph = sf.Network(this.name + ':SubgraphNetwork',true);

         return this;
      },
      meta: function(){
        return cmeta;
      },
      port: function(name){
        return pmeta.get(idMeta.get(name));
      },
      createPort: function(name){
        if(!pmeta.exists(name)) return;
        pmeta.add(name,sf.Port(name,this));
      },
      renamePort: function(oldName,newName){
        var old = idMeta.get(oldName);
        idMeta.add(newName,old);
        pmeta.get(old).id = newName;
        delete idMeta.get(oldName);
      },
      disconnectPorts: function(name){
        if(name){
          return pmeta.get(idMeta.get(name)).disconnectAll();
        }
        pmeta.cascade(function(e){
          e.disconnectAll();
        });
      },
      connect: function(myPort,component,toPort,mySocketId,toSocketId){
        //if(itr.find(component)) return;

        var inport = this.port(myPort),
        insocket = inport ? inport.socket(mySocketId) : null,
        extport = component.port(toPort), 
        extsocket = extport ? extport.socket(toSocketId) : null;
        
        if(!inport || !extport) return;
        
        if(insocket && extsocket) extport.leechSocket(inport,insocket,toSocketId);

        return extport.connect(inport,insocket,mySocketId);
        
        // connectPorts.add(component.id,{ 
        //   ports:{ from: fromId, toPort}, 
        //   sockets:{ from:fromSocketId, to:toSocketId }
        // });

        //lists.append(component);
        
      },
      disconnect: function(myPort,component,toPort,mySocketId,toSocketId){
        // var mayhave = itr.remove(component);
        // if(!mayhave) return;

        var inport = this.port(myPort),
        insocket = inport ? inport.socket(mySocketId) : null,
        extport = component.port(toPort), 
        extsocket = extport ? extport.socket(toSocketId) : null;
        
        if(!inport || !extport) return;
        
        if(insocket && extsocket) extport.unleechSocket(inport,insocket,toSocketId);

        return extport.disconnect(inport,insocket,mySocketId);
      },
      ID: function(){
        return  this.id;
      },
      loopInternalPorts: function(fp,tp){
        var from = this.port(fp), to = this.port(tp);

        if(!from || !to) return false;
        from.connect(tp);
      },
      unloopInternalPorts: function(fp,tp){
        var from = this.port(fp), to = this.port(tp);

        if(!from || !to) return false;
        from.disconnect(tp);
      }
    };
  };

  mixins.NetworkMixin = function(){
    var startTimeStamp,
    inSocket = sf.Socket('networkInport'),
    outSocket = sf.Socket('networkOutport'),
    errSocket = sf.Socket('networkErrorport'),
    graph = as.ds.Graph.make(),
    iip = as.ds.List.make(),
    uuids = as.AppStack.HashHelpers({}),
    gfilters = function(key,node,arc,ob){
      return (node.data.uuid === key && node);
    },
    filters = function(it,n){
       return (it.current().uuid === n && it.current());
    };
    
    var centriNode = graph.node({ uuid: 'placeHolder'}),
        uuidMatrix = function(itr,uuid){
          var dt = itr.current();
          return dt.data.uuid === uuid ? dt : null;
        },
        filterator = as.ds.ListFilter(filters),
        IIPFilter = filterator(iip),
        unbindfn = function(from,to,fp,tp){

          if(!to || !from) return;

          var toPort = to.port(toport), fromPort = from.port(fromport);

          if(!toPort || !fromPort) return;
          
          fromPort.disconnect(toPort);
        
        },
        bindfn = function(from,to,fp,tp){
          var toPort = to.port(toport), fromPort = from.port(fromport);

          if(!toPort || !fromPort) return;
          
          var toNode = graph.node(to), fromNode = graph.node(from);

          fromPort.connect(toPort);
        };
    
    
    return {
      init: function(id){
        //graph.dataMatrix = uuidMatrix;
        this.dfilter = as.ds.GF.DepthFirst(gfilters);
        this.bfilter = as.ds.GF.BreadthFirst(gfilters);

        this.inputStream = inSocket;
        this.OutStream = outSocket;
        this.errStream = errSocket;
      },
      graph: function(){ return graph; },
      IIP: function(uuid,iip){
        if(!iip) return IIPFilter(uuid);
        return iip.add({uuid:uuid, iip: iip});
      },
      component: function(component,alias){
        if(alias && uuids.exists(alias)) throw "Alias "+alias+" already exists";

        var node = graph.node(component);
        uuids.add(alias || componenet.uuid, component.uuid);
        graph.connectNodes(centriNode,node,0,true);
        graph.connectNodes(node,centriNode,1,true);

        return node;
      },
      getAliasUUID: function(alias){
        return uuids.get(alias);
      },
      hasAlias: function(alias){
        return uuids.exists(alias);
      },
      eject: function(alias,bf){
        if(!alias || !uuids.exists(alias)) return;
         
        var uuid = uuids.get(alias);
        var filter = (!bf ? this.filterDF(uuid) : this.filterBF(uuid));

        return filter.done(function(n){
          n.data.disconnectAll();
          graph.unNode(n);
        });

      },
      filterDF: function(uuid){
        return this.dfilter.filter(uuid).fail(function(n){
          errSocket.data({ uuid: uuid, res:n, message: 'uuid '+uuid+' not found (depthfirst filter)!'});
        });
      },
      filterBF: function(uuid){
        return this.bfilter.filter(uuid).fail(function(n){
          errSocket.data({ uuid: uuid, res:n, message: 'uuid '+uuid+' not found (breadthfirst filter)!'});
        });
      },
      bind: function(tuuid,toport,fuuid,fromport,bf){
        return ((!bf ? this.bindDF(tuuid,toport,fuuid,fromport) :
                this.bindBF(tuuid,toport,fuuid,fromport)).fail(function(){
                  errSocket.data({ 
                    type:'bind', 
                    fromUUID: fuuid,
                    toUUID: tuuid,
                    message: 'unable to bind ports'+tuuid+':'+fuuid+'!'
                  });
            }));
      },
      unbind: function(tuuid,toport,fuuid,fromport,bf){
        return ((!bf ? this.unbindDF(tuuid,toport,fuuid,fromport) :
                this.unbindBF(tuuid,toport,fuuid,fromport)).fail(function(){
                  errSocket.data({ 
                    type:'bind', 
                    fromUUID: fuuid,
                    toUUID: tuuid,
                    message: 'unable to unbind ports'+tuuid+':'+fuuid+'!'
                  });
            }));
      },
      bindDF: function(tuuid,toport,fuuid,fromport){
        return as.AppStack.Promise.when(this.filterDF(tuuid),this.filterDF(fuuid)).done(function(to,from){
            return bindfn(to.data,from.data,fromport,toport);
        });
      },
      unbindDF: function(tuuid,toport,fuuid,fromport){
        return as.AppStack.Promise.when(this.filterDF(tuuid),this.filterDF(fuuid)).done(function(to,from){
            return unbindfn(to.data,from.data,fromport,toport);
        });
      },
      bindBF: function(tuuid,toport,fuuid,fromport){
        return as.AppStack.Promise.when(this.filterBF(tuuid),this.filterBF(fuuid)).done(function(to,from){
            return bindfn(to.data,from.data,fromport,toport);
        });
      },
      unbindBF: function(tuuid,toport,fuuid,fromport){
        return as.AppStack.Promise.when(this.filterBF(tuuid),this.filterBF(fuuid)).done(function(to,from){
            return unbindfn(to.data,from.data,fromport,toport);
        });
      },
    };
  };


  types.Base = function(id){
    this.id = id;
  };

  types.Socket = function(id,from,to){
    types.Base.call(this,id);
    if(from) this.init(from);
    if(to) this.to(to);
  };

  types.Port = function(id,Component){
    types.Base.call(this,id);
    this.uuid = enums.someString(5);
    if(Component){
      this.owner = Component;
      this.componentID = Component.id;
    }
    this.init();
  };

  types.Component = function(id){
    this.uuid = enums.someString(7);
    this.name = id;
    types.Base.call(this,(id+'-'+this.uuid));
    this.init();
  };

  types.Network = function(id,subgraph){
    this.uuid = enums.someString(16);
    this.isSubgraph = !!subgraph ? true : false;
    types.Base.call(this,id);
  };
  
  sf.Socket = inv.MixinCreator(types.Socket,mixins.StreamMixin,mixins.SocketMixin);
  sf.Port = inv.MixinCreator(types.Port,mixins.PortMixin);
  sf.Component = inv.MixinCreator(types.Component,mixins.ComponentMixin);
  sf.Network = inv.MixinCreator(types.Network,mixins.NetworkMixin);


},this);


