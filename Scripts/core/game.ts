/// <reference path="_reference.ts"/>

// MAIN GAME FILE

// THREEJS Aliases
import Scene = Physijs.Scene;
import Renderer = THREE.WebGLRenderer;
import PerspectiveCamera = THREE.PerspectiveCamera;
import BoxGeometry = THREE.BoxGeometry;
import CubeGeometry = THREE.CubeGeometry;
import PlaneGeometry = THREE.PlaneGeometry;
import SphereGeometry = THREE.SphereGeometry;
import Geometry = THREE.Geometry;
import AxisHelper = THREE.AxisHelper;
import LambertMaterial = THREE.MeshLambertMaterial;
import MeshBasicMaterial = THREE.MeshBasicMaterial;
import LineBasicMaterial = THREE.LineBasicMaterial;
import Material = THREE.Material;
import Line = THREE.Line;
import Mesh = THREE.Mesh;
import Object3D = THREE.Object3D;
import SpotLight = THREE.SpotLight;
import PointLight = THREE.PointLight;
import AmbientLight = THREE.AmbientLight;
import Control = objects.Control;
import GUI = dat.GUI;
import Color = THREE.Color;
import Vector3 = THREE.Vector3;
import Face3 = THREE.Face3;
import Point = objects.Point;
import CScreen = config.Screen;
import Clock = THREE.Clock;

//Custom Game Objects
import gameObject = objects.gameObject;

// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";


// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (() => {

    // declare game objects
    var havePointerLock: boolean;
    var element: any;
    var scene: Scene = new Scene(); // Instantiate Scene Object
    var renderer: Renderer;
    var camera: PerspectiveCamera;
    var control: Control;
    var gui: GUI;
    var stats: Stats;
    var blocker: HTMLElement;
    var instructions: HTMLElement;
    var spotLight: SpotLight;
    var groundGeometry: CubeGeometry;
    var groundPhysicsMaterial: Physijs.Material;
    var groundMaterial: THREE.MeshPhongMaterial;
    var groundTextureNormal: THREE.Texture;
    var groundTexture: THREE.Texture;
    var ground: Physijs.Mesh;
    var clock: Clock;
    var playerGeometry: CubeGeometry;
    var playerMaterial: Physijs.Material;
    var player: Physijs.Mesh;
    var sphereGeometry: SphereGeometry;
    var sphereMaterial: Physijs.Material;
    var sphere: Physijs.BoxMesh;
    var keyboardControls: objects.KeyboardControls;
    var mouseControls: objects.MouseControls;
    var isGrounded: boolean;
    var velocity: Vector3 = new Vector3(0, 0, 0);
    var prevTime: number = 0;
    var directionLineMaterial: LineBasicMaterial;
    var directionLineGeometry: Geometry;
    var directionLine: Line;
    var grounds: Physijs.Mesh[];
    var directions: number[];

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

            instructions.addEventListener('click', () => {

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

        scene.addEventListener('update', () => {
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
        var currentPos:Vector3 = new Vector3();
        var ready = true;
        var levels:number = 3;
        while (ready)
        {
            
            groundGeometry = new BoxGeometry(20, 0.1, 20);
            groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
            ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
            ground.position.set(currentPos.x, currentPos.y, currentPos.z);
            ground.receiveShadow = true;
            ground.name = "Ground";
            grounds.push(ground);
            console.log("Added Ground");
            
            var roof = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
            roof.position.add(new Vector3(0, 4.5, 0));
            scene.add(roof);
                        
            if (grounds.length >= levels)
                ready = false;
            else
            {
                var found = true;
                while (found)
                {
                    var bang = false;
                    var dir = Math.floor(Math.random() * 4);
                    var newPos: Vector3 = grounds[grounds.length-1].position.clone();
                    if (dir == 0)
                        newPos.x += 25;
                    else if (dir == 1)
                        newPos.z +=25;
                    else if (dir == 2)
                        newPos.x -= 25;
                    else if (dir == 3)
                        newPos.z -= 25;

                    for (var gnd = 0; gnd < grounds.length; gnd++)
                    {
                        if (grounds[gnd].position.equals(newPos))
                        {
                            console.log("Equals");
                            bang = true;
                        }
                    }
                    
                    if (bang == false)
                    {
                        directions.push(dir);
                        console.log("Adding: " + currentPos.x + currentPos.y + currentPos.z);
                        currentPos = newPos;
                        console.log(currentPos);
                        found = false;
                    }
                    else
                    {
                    }
                }
            }
            
        }
        for (var g = 0; g < grounds.length; g++)
        {
            scene.add(grounds[g]);
        }
        
        //build pathways
        for (var h = 0; h < grounds.length; h++)
        {
            if (h + 1 != grounds.length)
            {
                var tmpv3:Vector3 = grounds[h].position.clone();
                tmpv3.add(grounds[h+1].position.clone());
                tmpv3.multiplyScalar(0.5);
                console.log(tmpv3);
                groundTexture.repeat.set(5, 5);
                groundMaterial.map = groundTexture;
                groundGeometry = new BoxGeometry(5, 0.1, 5);
                groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
                ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
                ground.position.add(tmpv3.clone());
                console.log(ground.position);
                ground.receiveShadow = true;
                ground.name = "Pathway";
                
                var roof = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
                roof.position.add(new Vector3(0, 4.5, 0));
                scene.add(roof);
                scene.add(ground);
                
                var v1:Vector3 = grounds[h].position.clone();
                var v2:Vector3 = grounds[h+1].position.clone();
                var wall;
                if (v1.x != v2.x)
                     wall = new BoxGeometry(0.1,10,5);
                else if (v1.z != v2.z)
                    wall = new BoxGeometry(5, 10, 0.1);
                var material = new LambertMaterial({color:0x000000});
                var mesh = new gameObject(wall, material, tmpv3.x, tmpv3.y, tmpv3.z);
                
                scene.add(mesh);
            }
        }
        
        for (var k = 0; k < directions.length; k++)
        {
                //console.log(directions[k]);
                if (k == 0 || k == directions.length)
                {
                    console.log(directions[k]);
                    switch (directions[k])
                    {
                        case 0:
                            buildBadPathway(new Vector3(-1,0,0), k);
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(0,0,-1), k);
                            break;
                        case 1:
                            buildBadPathway(new Vector3(0,0,-1), k);
                            buildBadPathway(new Vector3(1,0,0), k);
                            buildBadPathway(new Vector3(-1,0,0), k);
                            break;
                        case 2:
                            buildBadPathway(new Vector3(1,0,0), k);
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(0,0,-1), k);
                            break;
                        case 3:
                            buildBadPathway(new Vector3(0,0, 1), k);
                            buildBadPathway(new Vector3(-1,0, 0), k);
                            buildBadPathway(new Vector3(1,0, 0), k);
                            break;
                    }
                }
                else
                {
                    var cur = directions[k];
                    var prev = directions[k-1];
                    
                    console.log("cur: " + cur + ", prev: " + prev);
                    if (cur == 0)
                    {
                        console.log("Using cur = 0");
                        if (prev == 1)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(1,0,0), k);
                        }
                        else if (prev == 0)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(0,0,-1), k);
                        }
                        else if (prev == 3)
                        {
                            buildBadPathway(new Vector3(0,0,-1), k);            
                            buildBadPathway(new Vector3(-1,0, 0), k);
                        }
                    }
                    if (cur == 1)
                    {
                        console.log("Using cur = 1");
                        if (prev == 1)
                        {
                            buildBadPathway(new Vector3(-1,0,0), k);
                            buildBadPathway(new Vector3(1,0,0), k);
                        }
                        else if (prev == 0)
                        {
                            buildBadPathway(new Vector3(1,0,0), k);
                            buildBadPathway(new Vector3(0,0,-1), k);
                        }
                        else if (prev == 2)
                        {
                            buildBadPathway(new Vector3(0,0,-1), k);            
                            buildBadPathway(new Vector3(-1,0, 0), k);
                        }
                    }
                    if (cur == 2)
                    {
                        console.log("using cur = 2");
                        if (prev == 1)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(-1,0,0), k);
                        }
                        else if (prev == 2)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(0,0,-1), k);
                        }
                        else if (prev == 3)
                        {
                            buildBadPathway(new Vector3(0,0,-1), k);            
                            buildBadPathway(new Vector3(1,0, 0), k);
                        }
                    }
                    
                    if (cur == 3)
                    {
                        console.log("using cur = 3");
                        if (prev == 0)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(1,0,0), k);
                        }
                        else if (prev == 2)
                        {
                            buildBadPathway(new Vector3(0,0,1), k);
                            buildBadPathway(new Vector3(-1,0,0), k);
                        }
                        else if (prev == 3)
                        {
                            buildBadPathway(new Vector3(-1,0,0), k);            
                            buildBadPathway(new Vector3(1,0, 0), k);
                        }
                    }
                    
                }
            }
        
        
        // Player Object
        playerGeometry = new BoxGeometry(2, 2, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);

        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 2.5, 0);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        player.add(camera);
        console.log("Added Player to Scene");

        // Collision Check
        player.addEventListener('collision', (event) => {
            if (event.name === "Ground" || event.name ==="Pathway") {
                console.log("player hit the ground");
                isGrounded = true;
            }
            if (event.name === "BadPath") {
                console.log("player hit the BadPath");
                player.position = new Vector3(0,0,0);
                
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

    function buildBadPathway(v3:Vector3, par:number): void
    {      
        var path = new BoxGeometry(5, 0.1, 5);
        var pathMat = Physijs.createMaterial(groundMaterial, 0, 0);
        var gnd = new Physijs.ConvexMesh(path, pathMat, 0);
        let v4 = grounds[par].position.clone().add(v3.multiplyScalar(12.5));
        gnd.position.add(v4);
        gnd.receiveShadow = true;
        gnd.name = "BadPath";
        
        let roof = new Physijs.ConvexMesh(groundGeometry, Physijs.createMaterial(new LambertMaterial({color:0x000000}), 0, 0), 0);
        roof.position.add(new Vector3(0, 4.5, 0));
        console.log("roof position: " + roof.position.x + ", " + roof.position.z);
        scene.add(roof);
                
        var wall;
        if (v3.x != 0)
        {
            wall = new BoxGeometry(0.1,10,5);
            console.log("Wall Z");
        }
        else if (v3.z != 0)
        {
            wall = new BoxGeometry(5, 10, 0.1);
            console.log("Wall X");
        }
                var material = Physijs.createMaterial(new LambertMaterial({color:0x000000}), 0, 0);
                var newgnd = new Physijs.ConvexMesh(wall, material, 0);

        newgnd.position.add(v4);
        console.log("getting ground position: " + newgnd.position.x + ", " + newgnd.position.z);
        scene.add(newgnd);
        
        scene.add(gnd);
    }

    //PointerLockChange Event Handler
    function pointerLockChange(event): void {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        } else {
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
    function pointerLockError(event): void {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }

    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function addControl(controlObject: Control): void {
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
    function gameLoop(): void {
        stats.update();

        if (keyboardControls.enabled) {
            velocity = new Vector3();

            var time: number = performance.now();
            var delta: number = (time - prevTime) / 1000;

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
            player.setAngularVelocity(new Vector3(0, 0 , 0));   
        }
        
        //cameraLook();
            

            prevTime = time;

        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);

        // render the scene
        renderer.render(scene, camera);
    }
    
    function cameraLook(): void {
        var zenith: number = THREE.Math.degToRad(60);
        var nadir: number = THREE.Math.degToRad(-60);
        
        var cameraPitch: number = camera.rotation.x + mouseControls.pitch;
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
    }

    // Setup default renderer
    function setupRenderer(): void {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }

    // Setup main camera for the scene
    function setupCamera(): void {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        //camera.position.set(0, 10, 30);
        //camera.lookAt(new Vector3(0, 0, 0));
        console.log("Finished setting up Camera...");
    }

    window.onload = init;

    return {
        scene: scene
    }

})();

