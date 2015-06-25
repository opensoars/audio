var app = {

  audio: {},

  stats: {},
  renderer: {},
  scene: {},
  mats: {},
  geos: {},
  meshes: [],
  lights: {},
  cams: {},

  cubes: [],

  paused: true,

  elems: {},

  resize: function (){
    var a_r = window.innerWidth/window.innerHeight;

    app.cams.main.aspect = a_r;
    app.cams.main.updateProjectionMatrix();
    app.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  addCube: function (x, y, z){
    var mat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    var cube = new THREE.Mesh(this.geos.cube, mat);

    cube.position.set(x || 0, y || 0, z || 0);
    cube.castShadow = true;
    cube.receiveShadow = true;

    this.meshes.push(cube);
    this.cubes.push(cube);
    this.scene.add(cube);
  },

  initialize: function (){
    var app = this;

    /**
     * Loader img
     */
    app.elems.loader = document.getElementById('loader');

    /**
     * Audio 
     */
    var ctx = new AudioContext(),
        elem = document.getElementById('song'),
        src = ctx.createMediaElementSource(elem),
        analyser = ctx.createAnalyser(),
        freq_data = new Uint8Array(analyser.frequencyBinCount);

    src.connect(analyser);
    analyser.connect(ctx.destination);

    app.audio = {
      ctx: ctx,
      elem: elem,
      src: src,
      analyser: analyser,
      freq_data: freq_data
    };

    /**
     * Upload
     */
    app.upload = document.getElementById('upload');

    app.upload.onchange = function (evt){
      var file = this.files[0],
          reader = new FileReader();

      reader.onloadend = function (){
        app.audio.elem.src = this.result;
        app.play();
      };

      app.pause();
      reader.readAsDataURL(file);
    };


    /**
     * Stats
     */
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    app.stats = stats;
    document.body.appendChild(app.stats.domElement);

    /**
     * Renderer
     */
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    app.renderer = renderer;
    document.body.appendChild(app.renderer.domElement);
    
    /**
     * Scene
     */
    app.scene = new THREE.Scene();

    /**
     * Cams
     */
    var a_r = window.innerWidth/window.innerHeight;
    app.cams.main = new THREE.PerspectiveCamera(75, a_r, 0.1, 5000);
    app.cams.main.position.set(0, 0, 300);

    /**
     * Geometries
     */
    app.geos.cube = new THREE.BoxGeometry(5, 5, 5);
    app.geos.plane = new THREE.PlaneGeometry(5000, 5000),

    /**
     * Materials
     */
    app.mats.plane = new THREE.MeshPhongMaterial({ color: 0xffffff });

    /**
     * Meshes
     */
    var cube_count = Math.round(app.audio.freq_data.length/32);
    for(var i=-cube_count/2; i<cube_count/2; i+=1)
      app.addCube(i*30+75, 0, 0);

    var plane = new THREE.Mesh(app.geos.plane, app.mats.plane);
    plane.position.z = -75;
    plane.receiveShadow = true;
    plane.castShadow = true;
    app.meshes.push(plane);
    app.scene.add(plane);

    /**
     * Lights
     */
    var light1 = new THREE.DirectionalLight(0x999999);
    light1.castShadow = true;
    //light1.shadowCameraVisible = true
    light1.shadowCameraNear = 0;
    light1.shadowCameraFar = 256;
    light1.shadowCameraWidth = 2048;
    light1.shadowCameraHeight = 2048;
    light1.shadowCameraLeft = -1000;
    light1.shadowCameraRight = 1000;
    light1.shadowMapWidth = 2048;
    light1.shadowMapHeight = 2048;
    light1.position.set(0, 0, 100);
    app.lights[1] = light1
    app.scene.add(app.lights[1]);


    function render(){
      if(app.paused) return;
      app.stats.begin();

      var delta = new Date().getTime(),
          light1 = app.lights[1];

      app.audio.analyser.getByteFrequencyData(app.audio.freq_data);

      var freq_data = app.audio.freq_data,
          freq_total = 0,
          freq_avg;

      for(var i=0; i<freq_data.length; i+=1)
        freq_total += freq_data[i];

      freq_avg = freq_total / freq_data.length;

      /**
       * Cubes
       */
      app.cubes.forEach(function (cube, i){
        var cube_scale = Math.round((freq_data[i*16]/20) + 1),
            cube_y = (Math.round(freq_data[i*16])*1.5)-175,
            cube_rot = (freq_data[i*16]/255)/8,
            cube_color_intensity = (freq_data[i*16]/255);

        cube.scale.set(cube_scale, cube_scale, cube_scale)
        cube.position.y = cube_y;
        cube.rotation.x += cube_rot;
        cube.rotation.y += cube_rot;

        cube.material.color.r = cube_color_intensity * Math.sin(delta*0.0005);
        cube.material.color.g = cube_color_intensity * Math.sin(delta*0.0007);
        cube.material.color.b = cube_color_intensity * Math.sin(delta*0.0008);
      });

      /**
       * Lights
       */
      light1.color.r = (freq_avg/255)*Math.sin(delta*0.0005)+0.1;
      light1.color.b = (freq_avg/255)*Math.sin(delta*0.0007)+0.1;
      light1.color.g = (freq_avg/255)*Math.sin(delta*0.0008)+0.1;

      /**
       * Cams
       */
      app.cams.main.lookAt(app.scene.position);
      app.cams.main.position.x = Math.sin(delta * 0.00035) * 800;
      app.cams.main.position.z = (Math.cos(delta * 0.00035)+1.4) * 200;

      app.renderer.render(app.scene, app.cams.main);
      app.stats.end();
      requestAnimationFrame(render);
    }


    app.play = function (){
      this.paused = !this.paused;
      this.audio.elem.play();

      this.elems.loader.style.display = 'none';

      render();
    };

    app.pause = function (){
      this.paused = !this.paused;
      this.audio.elem.pause();

      app.elems.loader.style.display = 'block';
    };
  
    return app;
  }

};

window.onload = function (){
  app.initialize().play();
};

window.onresize = app.resize;