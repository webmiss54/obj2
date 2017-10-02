var Particle = require('particle-api-js');
const express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Devices = require('./models/devices.js');
var EventsObj = require('./models/eventsObj.js');


const app = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var particle = new Particle();
var token;

// j'instance la connection mongo 
var promise = mongoose.connect('mongodb://localhost:27017/OBJ', {
    useMongoClient: true,
});
// quand la connection est réussie
promise.then(
    () => {
        console.log('db.connected');
        // je démarre mon serveur node sur le port 3000
        server.listen(3000, function() {
            console.log('Example app listening on port 3000!')
        });
    },
    err => {
        console.log('MONGO ERROR');
        console.log(err);
    }

);


// prends en charge les requetes du type ("Content-type", "application/x-www-form-urlencoded")
app.use(bodyParser.urlencoded({
    extended: true
}));
// prends en charge les requetes du type ("Content-type", "application/json")
app.use(bodyParser.json());

// serveur web
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html')
});
app.post('/particle', function(req, res) {
    console.log("une requete est arrivée");
    console.log(req);
});



particle.login({
    username: 'webmiss54@gmail.com',
    password: ''
}).then(
    function(data) {
        token = data.body.access_token;
        console.log(token);
        console.log('success');
        var devicesPr = particle.listDevices({
            auth: token
        });
        devicesPr.then(
            function(devices) {
                console.log('Devices: ', devices);
                // devices = JSON.parse(devices);
                console.log(devices.body);
                devices.body.forEach(function(device){
                	var toSave = new Devices(device);
                	

                	toSave.save(function(err, success){
                		if(err){
                			console.log(err);
                		}
                		else{
                			console.log('device saved');
                            // ecouter les evenements
                                        io.sockets.on('connection', function (socket) {
                                            console.log("un client est connecté");
                                             console.log(socket);

                                            socket.emit('monsocket', { hello: "world" });
                                          // socket.on('vote', function(msg){
                                          //   votes[msg.vote-1].votes++;
                                          //   io.sockets.emit('votes', { votes: votes });
                                          // })
                                        });
                		}
                	})
                });
            },
            function(err) {
                console.log('List devices call failed: ', err);
            }
        );
        //Get your devices events
        particle.getEventStream({
            deviceId: '200036001847343438323536',
            auth: token
        }).then(function(stream) {
            stream.on('event', function(data) {
                console.log("Event: " + JSON.stringify(data));
            });
        });

    },
    function(err) {
        console.log('Could not log in.', err);
    }

);

