//download.js v4.2, by dandavis; 2008-2017. [MIT] see http://danml.com/download.html for tests/usage
(function(r,l){"function"==typeof define&&define.amd?define([],l):"object"==typeof exports?module.exports=l():r.download=l()})(this,function(){return function l(a,e,k){function q(a){var h=a.split(/[:;,]/);a=h[1];var h=("base64"==h[2]?atob:decodeURIComponent)(h.pop()),d=h.length,b=0,c=new Uint8Array(d);for(b;b<d;++b)c[b]=h.charCodeAt(b);return new f([c],{type:a})}function m(a,b){if("download"in d)return d.href=a,d.setAttribute("download",n),d.className="download-js-link",d.innerHTML="downloading...",d.style.display="none",document.body.appendChild(d),setTimeout(function(){d.click(),document.body.removeChild(d),!0===b&&setTimeout(function(){g.URL.revokeObjectURL(d.href)},250)},66),!0;if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent))return/^data:/.test(a)&&(a="data:"+a.replace(/^data:([\w\/\-\+]+)/,"application/octet-stream")),!window.open(a)&&confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")&&(location.href=a),!0;var c=document.createElement("iframe");document.body.appendChild(c),!b&&/^data:/.test(a)&&(a="data:"+a.replace(/^data:([\w\/\-\+]+)/,"application/octet-stream")),c.src=a,setTimeout(function(){document.body.removeChild(c)},333)}var g=window,b=k||"application/octet-stream",c=!e&&!k&&a,d=document.createElement("a");k=function(a){return String(a)};var f=g.Blob||g.MozBlob||g.WebKitBlob||k,n=e||"download",f=f.call?f.bind(g):Blob;"true"===String(this)&&(a=[a,b],b=a[0],a=a[1]);if(c&&2048>c.length&&(n=c.split("/").pop().split("?")[0],d.href=c,-1!==d.href.indexOf(c))){var p=new XMLHttpRequest;return p.open("GET",c,!0),p.responseType="blob",p.onload=function(a){l(a.target.response,n,"application/octet-stream")},setTimeout(function(){p.send()},0),p}if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(a)){if(!(2096103.424<a.length&&f!==k))return navigator.msSaveBlob?navigator.msSaveBlob(q(a),n):m(a);a=q(a),b=a.type||"application/octet-stream"}else if(/([\x80-\xff])/.test(a)){e=0;var c=new Uint8Array(a.length),t=c.length;for(e;e<t;++e)c[e]=a.charCodeAt(e);a=new f([c],{type:b})}a=a instanceof f?a:new f([a],{type:b});if(navigator.msSaveBlob)return navigator.msSaveBlob(a,n);if(g.URL)m(g.URL.createObjectURL(a),!0);else{if("string"==typeof a||a.constructor===k)try{return m("data:"+b+";base64,"+g.btoa(a))}catch(h){return m("data:"+b+","+encodeURIComponent(a))}b=new FileReader,b.onload=function(a){m(this.result)},b.readAsDataURL(a)}return!0}});

function init() {
  RK.GLTFExporter = function () {};

  RK.GLTFExporter.prototype = {
    constructor: THREE.GLTFExporter,
    
    parse: function (scenes, options) {
      const gltf = {
        asset: {
          version: "2.0",
          generator: "RK GLTFExporter"
        },
        scenes: [],
        nodes: [],
        meshes: [],
        materials: [],
        animations: []
      };

      // Process scenes
      scenes.forEach((scene, index) => {
        const sceneData = {
          nodes: []
        };
        
        scene.traverse((object) => {
          if (object instanceof RK.Mesh) {
            const nodeIndex = this.processNode(object, gltf);
            sceneData.nodes.push(nodeIndex);
          }
        });

        gltf.scenes.push(sceneData);
      });

      // Set default scene
      gltf.scene = 0;

      return JSON.stringify(gltf);
    },

    processNode: function (object, gltf) {
      const nodeData = {
        name: object.name,
        mesh: this.processMesh(object.geometry, object.material, gltf)
      };

      // Add transform if not identity
      if (!object.matrix.equals(new THREE.Matrix4())) {
        nodeData.matrix = object.matrix.elements;
      }

      gltf.nodes.push(nodeData);
      return gltf.nodes.length - 1;
    },

    processMesh: function (geometry, material, gltf) {
      const meshData = {
        primitives: [{
          attributes: {},
          material: this.processMaterial(material, gltf)
        }]
      };

      // Process geometry attributes
      if (geometry instanceof RK.BufferGeometry) {
        for (const name in geometry.attributes) {
          const attribute = geometry.attributes[name];
          meshData.primitives[0].attributes[name] = this.processAccessor(attribute, gltf);
        }

        if (geometry.index) {
          meshData.primitives[0].indices = this.processAccessor(geometry.index, gltf);
        }
      }

      gltf.meshes.push(meshData);
      return gltf.meshes.length - 1;
    },

    processMaterial: function (material, gltf) {
      const materialData = {
        pbrMetallicRoughness: {
          baseColorFactor: material.color.toArray(),
          metallicFactor: material.metalness,
          roughnessFactor: material.roughness
        }
      };

      gltf.materials.push(materialData);
      return gltf.materials.length - 1;
    },

    processAccessor: function (attribute, gltf) {
      const accessorData = {
        bufferView: this.processBufferView(attribute, gltf),
        componentType: this.getComponentType(attribute.array),
        count: attribute.count,
        type: this.getType(attribute)
      };

      gltf.accessors.push(accessorData);
      return gltf.accessors.length - 1;
    },

    processBufferView: function (attribute, gltf) {
      const array = attribute.array;
      const bufferViewData = {
        buffer: 0, // Assuming single buffer for simplicity
        byteLength: array.byteLength,
        byteOffset: gltf.buffers ? gltf.buffers[0].byteLength : 0
      };

      if (!gltf.buffers) {
        gltf.buffers = [{
          byteLength: 0,
          uri: "data:application/octet-stream;base64,"
        }];
      }

      gltf.buffers[0].byteLength += array.byteLength;
      gltf.buffers[0].uri += this.arrayToBase64(array);

      gltf.bufferViews.push(bufferViewData);
      return gltf.bufferViews.length - 1;
    },

    getComponentType: function (array) {
      if (array instanceof Float32Array) return 5126;
      if (array instanceof Uint16Array) return 5123;
      if (array instanceof Uint32Array) return 5125;
    },

    getType: function (attribute) {
      const itemSize = attribute.itemSize;
      switch (itemSize) {
        case 1: return "SCALAR";
        case 2: return "VEC2";
        case 3: return "VEC3";
        case 4: return "VEC4";
      }
    },

    arrayToBase64: function (array) {
      const bytes = new Uint8Array(array.buffer);
      return btoa(String.fromCharCode.apply(null, bytes));
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RK.GLTFExporter;
  } else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
    define([], function() { return RK.GLTFExporter; });
  }
}

	var characterArea_hook = ".leftWrap-0-2-13";
	var menu_style = { "margin-left": "20px", "width": "80px" };
	
    var character_area, stl_base, sjson, ljson, labeljson;
    
	stl_base = 			jQuery("<a class='jss7 jss9 jss10' />").css(menu_style).text("Export STL");
	sjson = 			jQuery("<a class='jss7 jss9 jss10' />").css(menu_style).text("Export JSON");
	ljson  = 			jQuery("<input/>").attr({"type": "file", "id": "ljson"}).css({"display":"none"}).text("Import (JSON)");
	labeljson  = 		jQuery("<label class='jss7 jss9 jss10' />").attr({"for": "ljson"}).css(menu_style).text("Import (JSON)");
	
    character_area = 	jQuery(".headerMenu-container").first();
    character_area.css({"display": "flex", "justify-content": "center", "align-content": "center"});
    
    character_area.append(stl_base);
    character_area.append(sjson);
    character_area.append(ljson);
    character_area.append(labeljson);

    stl_base.click(function(e) {
        e.preventDefault(); 
        var exporter = new RK.STLExporter();    
        var stlString = exporter.parse([CK.character])
        var name = get_name();
        download(stlString, name + '.stl', 'application/sla');
    });


    sjson.click(function(e) {
        e.preventDefault();
        var char_json = JSON.stringify(CK.data);
        var name = get_name();
        download(char_json, name + ".json", "text/plain");
    });

    ljson.on('change', function(e) {
        e.preventDefault();
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                e.preventDefault();
                CK.change(JSON.parse(e.target.result));
            };
        })(file);
        reader.readAsText(file);
    });


function inject_script(url, callback) {
  var head = document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  script.src = url; 
  script.onload = function(e) { 
      callback() };
  head.appendChild(script);
}

inject_script("//code.jquery.com/jquery-3.3.1.min.js", function () {
    inject_script("//cdnjs.cloudflare.com/ajax/libs/three.js/100/three.js", function () { init() })
});

function get_name() {
  var timestamp = new Date().getUTCMilliseconds();
  var uqID = timestamp.toString(36);
  var name = "Character " + uqID; 
  try {
    var getName = CK.character.data.meta.character_name
    name = getName === "" ? name : getName;
  } catch (e) {
    if (e instanceof ReferenceError) {
        console.log("Name of character data location has changed");
        console.log(e);
    } else {
        console.log("Other Error");
        console.log(e);
    }
  }
  return name;
}