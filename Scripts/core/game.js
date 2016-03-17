/// <reference path="_reference.ts"/>
// MAIN GAME FILE
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var AxisHelper = THREE.AxisHelper;
var LambertMaterial = THREE.MeshLambertMaterial;
var MeshBasicMaterial = THREE.MeshBasicMaterial;
var LineBasicMaterial = THREE.LineBasicMaterial;
var Material = THREE.Material;
var Line = THREE.Line;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var PointLight = THREE.PointLight;
var AmbientLight = THREE.AmbientLight;
var Control = objects.Control;
var GUI = dat.GUI;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var Face3 = THREE.Face3;
var Point = objects.Point;
var CScreen = config.Screen;
var Clock = THREE.Clock;
//Custom Game Objects
var gameObject = objects.gameObject;
// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";
// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (function () {
    // declare game objects
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var control;
    var gui;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var groundPhysicsMaterial;
    var groundMaterial;
    var groundTextureNormal;
    var groundTexture;
    var ground;
    var clock;
    var playerGeometry;
    var playerMaterial;
    var player;
    var sphereGeometry;
    var sphereMaterial;
    var sphere;
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    var directionLineMaterial;
    var directionLineGeometry;
    var directionLine;
    var grounds;
    var directions;
    function init() {
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        //check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        // Instantiate Game Controls
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;
            instructions.addEventListener('click', function () {
                // Ask the user for pointer lock
                console.log("Requesting PointerLock");
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
                element.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -10, 0));
        scene.addEventListener('update', function () {
            scene.simulate(undefined, 2);
        });
        // setup a THREE.JS Clock object
        clock = new Clock();
        setupRenderer(); // setup the default renderer
        setupCamera(); // setup the camera
        // Spot Light
        spotLight = new SpotLight(0xffffff);
        spotLight.position.set(20, 40, -15);
        spotLight.castShadow = true;
        spotLight.intensity = 2;
        spotLight.lookAt(new Vector3(0, 0, 0));
        spotLight.shadowCameraNear = 2;
        spotLight.shadowCameraFar = 200;
        spotLight.shadowCameraLeft = -5;
        spotLight.shadowCameraRight = 5;
        spotLight.shadowCameraTop = 5;
        spotLight.shadowCameraBottom = -5;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 0.5;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        console.log("Added spotLight to scene");
        // Burnt Ground
        groundTexture = new THREE.TextureLoader().load('../../Assets/grass_top.png');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(20, 20);
        groundMaterial = new THREE.MeshPhongMaterial();
        groundMaterial.map = groundTexture;
        groundMaterial.bumpScale = 0.2;
        //build main areas
        grounds = [];
        directions = [];
        var currentPos = new Vector3();
        var ready = true;
        var levels = 10;
        while (ready) {
            groundGeometry = new BoxGeometry(20, 1, 20);
            groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
            ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
            ground.position.set(currentPos.x, currentPos.y, currentPos.z);
            ground.receiveShadow = true;
            ground.name = "Ground";
            grounds.push(ground);
            console.log("Added Ground");
            if (grounds.length >= levels)
                ready = false;
            else {
                var found = true;
                while (found) {
                    var bang = false;
                    var dir = Math.floor(Math.random() * 4);
                    var newPos = grounds[grounds.length - 1].position.clone();
                    if (dir == 0)
                        newPos.x += 25;
                    else if (dir == 1)
                        newPos.z += 25;
                    else if (dir == 2)
                        newPos.x -= 25;
                    else if (dir == 3)
                        newPos.z -= 25;
                    for (var gnd = 0; gnd < grounds.length; gnd++) {
                        if (grounds[gnd].position.equals(newPos)) {
                            console.log("Equals");
                            bang = true;
                        }
                    }
                    if (bang == false) {
                        directions.push(dir);
                        console.log("Adding: " + currentPos.x + currentPos.y + currentPos.z);
                        currentPos = newPos;
                        console.log(currentPos);
                        found = false;
                    }
                    else {
                    }
                }
            }
        }
        for (var g = 0; g < grounds.length; g++) {
            scene.add(grounds[g]);
        }
        //build pathways
        for (var h = 0; h < grounds.length; h++) {
            if (h + 1 != grounds.length) {
                var tmpv3 = grounds[h].position.clone();
                tmpv3.add(grounds[h + 1].position.clone());
                tmpv3.multiplyScalar(0.5);
                console.log(tmpv3);
                groundTexture.repeat.set(5, 5);
                groundMaterial.map = groundTexture;
                groundGeometry = new BoxGeometry(5, 1, 5);
                groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
                ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
                ground.position.add(tmpv3.clone());
                console.log(ground.position);
                ground.receiveShadow = true;
                ground.name = "Pathway";
                scene.add(ground);
            }
        }
        for (var k = 0; k < directions.length; k++) {
            console.log(directions[k]);
            switch (directions[k]) {
                case 0:
                    buildBadPathway(new Vector3(-1, 0, 0), k);
                    buildBadPathway(new Vector3(0, 0, 1), k);
                    buildBadPathway(new Vector3(0, 0, -1), k);
                    break;
                case 1:
                    buildBadPathway(new Vector3(0, 0, -1), k);
                    buildBadPathway(new Vector3(1, 0, 0), k);
                    buildBadPathway(new Vector3(-1, 0, 0), k);
                    break;
                case 2:
                    buildBadPathway(new Vector3(1, 0, 0), k);
                    buildBadPathway(new Vector3(0, 0, 1), k);
                    buildBadPathway(new Vector3(0, 0, -1), k);
                    break;
                case 3:
                    buildBadPathway(new Vector3(0, 0, 1), k);
                    buildBadPathway(new Vector3(-1, 0, 0), k);
                    buildBadPathway(new Vector3(1, 0, 0), k);
                    break;
            }
        }
        // Player Object
        playerGeometry = new BoxGeometry(2, 2, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 30, 0);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        player.add(camera);
        console.log("Added Player to Scene");
        // Collision Check
        player.addEventListener('collision', function (event) {
            if (event.name === "Ground" || event.name === "Pathway") {
                console.log("player hit the ground");
                isGrounded = true;
            }
            if (event.name === "BadPath") {
                console.log("player hit the BadPath");
                player.position = new Vector3(0, 0, 0);
            }
        });
        // Add DirectionLine
        directionLineMaterial = new LineBasicMaterial({ color: 0xffff00 });
        directionLineGeometry = new Geometry();
        directionLineGeometry.vertices.push(new Vector3(0, 0, 0)); // line origin
        directionLineGeometry.vertices.push(new Vector3(0, 0, -50)); // end of the line
        directionLine = new Line(directionLineGeometry, directionLineMaterial);
        player.add(directionLine);
        console.log("Added DirectionLine to the Player");
        // add controls
        gui = new GUI();
        control = new Control();
        addControl(control);
        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");
        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();
        window.addEventListener('resize', onWindowResize, false);
    }
    function buildBadPathway(v3, par) {
        var path = new BoxGeometry(5, 1, 5);
        var pathMat = Physijs.createMaterial(groundMaterial, 0, 0);
        var gnd = new Physijs.ConvexMesh(path, pathMat, 0);
        gnd.position.add(grounds[par].position.clone().add(v3.multiplyScalar(12.5)));
        gnd.receiveShadow = true;
        gnd.name = "BadPath";
        scene.add(gnd);
    }
    //PointerLockChange Event Handler
    function pointerLockChange(event) {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        }
        else {
            // disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
            console.log("PointerLock disabled");
        }
    }
    //PointerLockError Event Handler
    function pointerLockError(event) {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }
    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function addControl(controlObject) {
        /* ENTER CODE for the GUI CONTROL HERE */
    }
    // Add Frame Rate Stats to the Scene
    function addStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }
    // Setup main game loop
    function gameLoop() {
        stats.update();
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                var direction = new Vector3(0, 0, 0);
                if (keyboardControls.moveForward) {
                    console.log("Moving Forward");
                    velocity.z -= 400.0 * delta;
                }
                if (keyboardControls.moveLeft) {
                    console.log("Moving left");
                    velocity.x -= 400.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                    console.log("Moving Backward");
                    velocity.z += 400.0 * delta;
                }
                if (keyboardControls.moveRight) {
                    console.log("Moving Right");
                    velocity.x += 400.0 * delta;
                }
                if (keyboardControls.jump) {
                    console.log("Jumping");
                    velocity.y += 4000.0 * delta;
                    if (player.position.y > 4) {
                        isGrounded = false;
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                player.setAngularVelocity(new Vector3(0, -mouseControls.yaw, 0));
                direction.addVectors(direction, velocity);
                direction.applyQuaternion(player.quaternion);
                if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                    player.applyCentralForce(direction);
                }
            } // isGrounded ends
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
        //cameraLook();
        prevTime = time;
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        player.__dirtyPosition = true;
        // render the scene
        renderer.render(scene, camera);
    }
    function cameraLook() {
        var zenith = THREE.Math.degToRad(60);
        var nadir = THREE.Math.degToRad(-60);
        var cameraPitch = camera.rotation.x + mouseControls.pitch;
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
    }
    // Setup default renderer
    function setupRenderer() {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        //camera.position.set(0, 10, 30);
        //camera.lookAt(new Vector3(0, 0, 0));
        console.log("Finished setting up Camera...");
    }
    window.onload = init;
    return {
        scene: scene
    };
})();
//# sourceMappingURL=game.js.map