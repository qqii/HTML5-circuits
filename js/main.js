//One object to rule them all
(function(window, undefined) {
	$(".linescontainer").svg()
	Board={};
	Board.components=[];
	Board.components.get=function(name){
		for(var i=0;i<Board.components.length;i++){
			if(Board.components[i].name=name){
				return Board.components[i];
			}
		}
	}
	//holds positions of components
	Board.circuit=function(components){
		this.parts=[];
		if(typeof(components)=="object"&&components.toString!="[object Object]"){
			for(var i=0;i<components.length;i++){
				this.parts[i]=components[i];
			}
		}
		return this;
	};
	Board.circuit.prototype.addComponent=function(component){
		this.parts.push(component);
		component.parent=this;
	};
	Board.circuit.prototype.addConnector=function(from,to){
		//check from and to
		if(from.type==to.type){
			//can't draw that line
			return false;
		}
		from.connect(to);
	};
	//doesn't let the value go below minimum
	function minimum(min,arg){
		return (min<arg)?arg:min;
	}
	Board.circuit.prototype.Draw=function(domElement){
		this.drawIteration++
		var components=$(domElement).find("div");
		this.componentsDom=components;
		var lines=$(".linescontainer").svg("get");
		this.lines=lines;
		components.html("");
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Draw(components,lines,this.drawIteration);
		}
	};
	Board.circuit.prototype.drawIteration=0;
	componentProperties={
		symbol:"path/to/img.png",
		name:"name",
		components:new Board.circuit(),
		numberOfInputs:2,
		numberOfOutputs:1,
		x:0,
		y:0,
		output:function(){
			
		}
	}
	Board.component=function(){}
	Board.component=function(properties){
		var propertyKeys=Object.keys(componentProperties);
		for(var i=0;i<propertyKeys.length;i++){
			this[propertyKeys[i]]=componentProperties[propertyKeys[i]];
			if(typeof(properties[propertyKeys[i]])==typeof(this[propertyKeys[i]])){
				this[propertyKeys[i]]=properties[propertyKeys[i]];
			}
			else{
				this[propertyKeys[i]]=componentProperties[propertyKeys[i]];
			}
		}
		this.inputs=[];
		for(var i=0;i<this.numberOfInputs;i++){
			this.inputs.push(new Board.input(this));
		}
		this.inputs.Draw=function(lines,componentDom,drawNo){
			if(this.lastDraw==drawNo)return;
			this.lastDraw=drawNo;
			//draw node
			var connectionNodes=$("<div/>").addClass("inputNodes");
			componentDom.append(connectionNodes);
			for(var i=0;i<this.length;i++){
				this[i].Draw(lines,componentDom,connectionNodes,drawNo);
			}
		}
		this.inputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		}
		this.outputs=[];
		for(var i=0;i<this.numberOfOutputs;i++){
			this.outputs.push(new Board.output(this));
		}
		this.outputs.Draw=function(lines,componentDom,drawNo){
			//draw node
			var connectionNodes=$("<div/>").addClass("outputNodes");
			componentDom.append(connectionNodes);
			for(var i=0;i<this.length;i++){
				this[i].Draw(lines,componentDom,connectionNodes,drawNo);
			}
		}
		this.outputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		}
		return this;
	}
	Board.component.prototype.Draw=function(boxes,lines,drawNo){
		if(this.lastDraw==drawNo)return;
		this.lastDraw=drawNo;
		this.dom=$("<div/>").addClass("component").css({
			"left":this.x,
			"top":this.y
		});
		boxes.append(this.dom);
		this.dom.mousedown(this,function(e){
			var obj=e.data;
			boxesOffset=obj.parent.componentsDom.offset();
			obj.clickOffsetX=e.clientX-boxesOffset.left-obj.x;
			obj.clickOffsetY=e.clientY-boxesOffset.top-obj.y;
			obj.parent.componentsDom.parent().mousemove(obj,function(e) {
				var obj=e.data;
				boxesOffset=obj.parent.componentsDom.offset();
				obj.x=e.clientX-obj.clickOffsetX-boxesOffset.left;
				obj.y=e.clientY-obj.clickOffsetY-boxesOffset.top;
				obj.Update();
			});
		});
		this.parent.componentsDom.parent().mouseup(this,function(e){
			var obj=e.data;
			$(this).unbind("mousemove");
			obj.clickOffsetX=undefined;
			obj.clickOffsetY=undefined;
		});
		this.inputs.Draw(lines,this.dom,drawNo);
		this.outputs.Draw(lines,this.dom,drawNo);
	};
	Board.component.prototype.lastDraw=0;
	Board.component.prototype.Update=function(lastDraw){
		if(lastDraw!=undefined&&this.lastDraw==lastDraw)return;
		if(lastDraw!=undefined)this.parent.drawIteration++;
		this.lastDraw=this.parent.drawIteration;
		this.dom.css({
			"left":this.x,
			"top":this.y
		})
		this.inputs.Update(this.lastDraw);
		this.outputs.Update(this.lastDraw);
	};
	
	Board.pointer={};
	Board.pointer.connect=function(from){
		this.pair=from;
		if(this.pair.__proto__==Board.input.prototype){
			from.connect(Board.pointer);
		}
	}
	Board.pointer.x=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.clientX-boxesOffset.left;
	}
	Board.pointer.y=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.clientY-boxesOffset.top;
	}
	Board.pointer.Draw=function(e){
		//draw connection
		if(Board.pointer.pair.__proto__==Board.output.prototype){
			var lines=Board.pointer.pair.parent.parent.lines,
				componentsDom=Board.pointer.pair.parent.parent.componentsDom,
				drawNo=(Board.pointer.pair.parent.parent.drawIteration++);
			
			
			//draw line from this to other component
			var fromX=Board.pointer.pair.x(),
				fromY=Board.pointer.pair.y(),
				toX=Board.pointer.x(e,componentsDom),
				toY=Board.pointer.y(e,componentsDom);
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.dom=lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
		}
		else{
			Board.pointer.pair.Draw();
		}
	}
	Board.pointer.Update=function(e){
		//draw connection
		if(Board.pointer.pair.__proto__==Board.output.prototype){
			var lines=Board.pointer.pair.parent.parent.lines,
				componentsDom=Board.pointer.pair.parent.parent.componentsDom,
				drawNo=Board.pointer.pair.parent.parent.drawIteration++;
			
			
			//draw line from this to other component
			var fromX=Board.pointer.pair.x(),
				fromY=Board.pointer.pair.y(),
				toX=Board.pointer.x(e,componentsDom),
				toY=Board.pointer.y(e,componentsDom);
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.dom.setAttribute("d",line._path);
		}
	}
	
	//output port of component
	Board.output=function(parent){
		this.parent=parent;
		this.length=0;
		return this;
	}
	Board.output.prototype.connect=function(to){
		to.connect(this);
		this[this.length]=to;
		this.length++;
	}
	Board.output.prototype.x=function(){
		return this.parent.x+100;
	}
	Board.output.prototype.y=function(){
		var outputNo=this.parent.outputs.indexOf(this);
		return this.parent.y+20+outputNo*20;
	}
	Board.output.prototype.Draw=function(lines,componentDom,outputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("outputNode");
		outputsDom.append(connectionNode);
		connectionNode.mousedown(this,function(e){
			obj=e.data;
			e.stopPropagation();
			obj.connect(Board.pointer);
			Board.pointer.Draw(e);
			obj.parent.parent.componentsDom.parent().mousemove(this,function(e){
				obj=e.data;
				e.stopPropagation();
				Board.pointer.Update(e);
			});
		});
		componentDom.mouseup(function(){
			$(this).unbind("mousemove");
		})
	}
	Board.output.prototype.Update=function(lastDraw){
		for(var i=0;i<this.length;i++){
			this[i].Update(lastDraw);
		}
	}
	
	//input port of component
	Board.input=function(parent){
		this.parent=parent;
		return this;
	}
	Board.input.prototype.connect=function(from){
		this.pair=from;
	}
	Board.input.prototype.x=function(){
		return this.parent.x+20;
	}
	Board.input.prototype.y=function(){
		var inputNo=this.parent.inputs.indexOf(this);
		return this.parent.y+20+inputNo*20;
	}
	Board.input.prototype.Draw=function(lines,componentDom,inputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("inputNode");
		inputsDom.append(connectionNode);
		
		//draw connection
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			//init draw of other component
			this.pair.parent.Draw(lines,componentDom,drawNo);
			
			//draw line from this to other component
			var fromX=this.pair.x(),
				fromY=this.pair.y(),
				toX=this.x(),
				toY=this.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			this.dom=lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
		}
	}
	Board.input.prototype.Update=function(lastDraw){
		//update connection
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			//init draw of other component
			this.pair.parent.Update(lastDraw);
			
			//draw line from this to other component
			var fromX=this.pair.x(),
				fromY=this.pair.y(),
				toX=this.x(),
				toY=this.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=this.parent.parent.lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			this.dom.setAttribute("d",line._path);
		}
	};
	Board.input.prototype.lastDraw=0;
	
	//define basic gates
	//
	Board.components.push(new Board.component({
		name:"not",
		numberOfInputs:1,
		output:function(input){
			return !input;
		}
	}));
	Board.components.push(new Board.component({
		name:"and",
		numberOfInputs:2,
		output:function(input,input2){
			if(input&&input2)return true;
			return false;
		}
	}));
	Board.components.push(new Board.component({
		name:"or",
		numberOfInputs:2,
		output:function(input,input2){
			if(input|input2)return true;
			return false;
		}
	}));
	
	
	
	
	var testCircuit=new Board.circuit();
	var test1=new Board.component({
			name:"test1",
			x:30,
			y:50
		}),
		test2=new Board.component({
			name:"test2",
			x:300,
			y:250
		}),
		test3=new Board.component({
			name:"test3",
			x:250,
			y:400,
			numberOfInputs:1
		}),
		test4=new Board.components.get("or");
	testCircuit.addComponent(test1);
	testCircuit.addComponent(test2);
	testCircuit.addComponent(test3);
	testCircuit.addComponent(test4);
	test1.outputs[0].connect(test2.inputs[0]);
	test2.outputs[0].connect(test3.inputs[0]);
	testCircuit.Draw($(".board")[0]);
	
})(window);