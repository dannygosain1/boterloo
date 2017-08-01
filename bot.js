const builder = require('botbuilder'); // provides access to BotBuilder
const https = require('https'); // use HTTPS module
const connector = new builder.ConsoleConnector().listen(); // connect to console
const bot = new builder.UniversalBot(connector); // use UniversalBot
const intents = new builder.IntentDialog();
var apiToken = '9093618ad7a132a5664d6aebe52c8499'; // public key
var api = 'https://api.uwaterloo.ca/v2/';

console.log("Say Hi to get me started!");
bot.dialog('/', new builder.IntentDialog()
    .matches(/^Hi/i, '/intro')
    .onDefault(builder.DialogAction.send("Say Hi to me to get started."))
);

bot.dialog('/intro', [ // perform text matching
  function(session) {
    console.log("Hi! I am here to help you get aquianted with University of Waterloo!");
    session.beginDialog('/menu');
  }
]);

bot.dialog('/menu',[
  function(session) {
    builder.Prompts.choice(session,"Please choose one of the following options:", "Buildings|Info Sessions|FEDS Events|Weather");
  },

  function(session,results) {
    if(results.response.entity === "Buildings") {
      session.userData.path = "Buildings";
      builder.Prompts.text(session, "How many results would you like to see? You can also leave it blank to see the entire list. To go back to the options list, simply type in 'menu'");
    }

    else if(results.response.entity === "Info Sessions") {
      session.userData.path = "info";
      var url = api + "resources/infosessions.json?key=" + apiToken;
      https.get(url,function(data){
        var info = '';
        data.on('data',function(item) {
          info += item;
        });
        data.on('error', function (e) {
          console.log('Errors:', e);
        });
        data.on('end', function() {
          var res = JSON.parse(info);
          var employer = [];
          for (var i = 0; i < res.data.length; i++) {
            employer.push(res.data[i].employer);
          }
          employer.push("Go back to Menu");
          console.log("These are all the companies with info sessions")
          builder.Prompts.choice(session, "Please select an employer you are interested in", employer);
        });
      });
    }

    else if(results.response.entity === "FEDS Events") {
      session.userData.path = "feds";
      var url = api + "feds/events.json?key=" + apiToken;
      https.get(url,function(data){
        var info = '';
        data.on('data',function(item) {
          info += item;
        });
        data.on('error', function (e) {
          console.log('Errors:', e);
        });
        data.on('end', function() {
          var res = JSON.parse(info);
          var events = [];
          for (var i = 0; i < res.data.length; i++) {
            events.push(res.data[i].title);
          }
          events.push("Go back to Menu");
          console.log("These are all the scheduled FEDS events")
          builder.Prompts.choice(session, "Please select an event you are interested in", events);
        });
      });
    }

    else if(results.response.entity === "Weather") {
      var url = api + "weather/current.json?key=" + apiToken;
      session.userData.path = results.response.entity;
      https.get(url,function(data){
        var info = '';
        data.on('data',function(item) {
          info += item;
        });
        data.on('error', function (e) {
          console.log('Errors:', e);
        });
        data.on('end', function() {
          var res = JSON.parse(info);
          var str = "00B0";
          var degreeSign = String.fromCharCode(parseInt(str, 16));
          console.log("Observation Time: " + res.data.observation_time);
          console.log("Max: " + res.data.temperature_24hr_max_c + degreeSign + "C");
          console.log("Min: " + res.data.temperature_24hr_min_c + degreeSign + "C");
          console.log("Windchill: " + res.data.windchill_c + degreeSign + "C");
          console.log("Wind Speed: " + res.data.wind_speed_kph + "kph");
          console.log("Pressure: " + res.data.pressure_kpa + "KPa");
          console.log("Pressure Trend: " + res.data.pressure_trend);
          console.log("Precipitation(24hrs): " + res.data.precipitation_24hr_mm);
          console.log("Dew Point: " + res.data.dew_point_c + degreeSign + "C");
          builder.Prompts.text(session,"Type 'exit' to exit the bot! Type anything else to see the menu again");
        });
      });
    }

    else {
      console.log("error");
    }
  },

  function(session,results) {
    if(session.userData.path === "Buildings") {
      var url = api + "buildings/list.json?key=" + apiToken;
      https.get(url,function(data){
        var info = '';
        data.on('data',function(item) {
          info += item;
        });
        data.on('error', function (e) {
          console.log('Errors:', e);
        });
        data.on('end', function() {
          var response = results.response;
          var res = JSON.parse(info);
          var building = [];
          if (results.response === 'menu') {
            session.beginDialog('/menu');
          }
          else if (results.response == '') {
            for (var i = 0; i < res.data.length; i++) {
              building.push(res.data[i].building_name);
            }
            building.push("Go back to Menu");
            builder.Prompts.choice(session, "Select the building to know more about it", building);
          }
          else {
            var limit = results.response;
            for (var i = 0; i < limit; i++) {
              building.push(res.data[i].building_name);
            }
            building.push("Go back to Menu");
            builder.Prompts.choice(session, "Select the building to know more about it", building);
            //builder.Prompts.choice(session, "Which color?", ["red","green","blue"]);
          }
        });
      });
    }

    else if(session.userData.path === "info") {
      if (results.response.entity === "Go back to Menu") {
        session.beginDialog('/menu');
      }
      else {
        var selection = results.response.entity;
        var url = api + "resources/infosessions.json?key=" + apiToken;
        https.get(url,function(data){
          var info = '';
          data.on('data',function(item) {
            info += item;
          });
          data.on('error', function (e) {
            console.log('Errors:', e);
          });
          data.on('end', function() {
            var res = JSON.parse(info);
            var companyName = false;
            var i = 0;
            while (!companyName && i < res.data.length){
              if (res.data[i].employer == selection) {
                console.log("Company: " + res.data[i].employer);
                console.log("Description: " + res.data[i].description);
                console.log("Date: " + res.data[i].date);
                console.log("Day: " + res.data[i].day);
                console.log("Time: " + res.data[i].start_time + " to " + res.data[i].end_time);
                companyName = true;
              }
              i++;
            }
            builder.Prompts.text(session,"Type 'exit' to exit the bot! Type anything else to see the menu again");
          });
        });
      }
    }

    else if(session.userData.path === "feds") {
      if (results.response.entity === "Go back to Menu") {
        session.beginDialog('/menu');
      }
      else {
        var selection = results.response.entity;
        var url = api + "feds/events.json?key=" + apiToken;
        https.get(url,function(data){
          var info = '';
          data.on('data',function(item) {
            info += item;
          });
          data.on('error', function (e) {
            console.log('Errors:', e);
          });
          data.on('end', function() {
            var res = JSON.parse(info);
            var eventName = false;
            var i = 0;
            while (!eventName && i < res.data.length){
              if (res.data[i].title == selection) {
                console.log("Event: " + res.data[i].title);
                console.log("Location: " + res.data[i].location);
                var startDate = res.data[i].start.substr(0,res.data[i].start.indexOf('T'));
                var startTime = res.data[i].start.substr(res.data[i].start.indexOf('T')+1,8);
                console.log("Start: " + startDate + " at " + startTime);
                var endDate = res.data[i].end.substr(0,res.data[i].end.indexOf('T'));
                var endTime = res.data[i].end.substr(res.data[i].end.indexOf('T')+1,8);
                console.log("End: " + endDate + " at " + endTime);
                var updatedDate = res.data[i].updated.substr(0,res.data[i].updated.indexOf('T'));
                var updatedTime = res.data[i].updated.substr(res.data[i].updated.indexOf('T')+1,8);
                console.log("Last Updated: " + updatedDate + " at " + updatedTime);
                console.log("Url: " + res.data[i].url);
                eventName = true;
              }
              i++;
            }
            builder.Prompts.text(session,"Type 'exit' to exit the bot! Type anything else to see the menu again");
          });
        });
      }
    }

    else if (session.userData.path === "Weather") {
      if (results.response == "exit") {
        process.exit();
      }
      session.beginDialog('/menu');
    }

    else {
      console.log("error");
      // builder.Prompts.choice(session, "What would you like to search for?", "track|artist|album");
    }
  },

  function(session,results) {
    if(session.userData.path === "Buildings") {
      if (results.response.entity === "Go back to Menu") {
        session.beginDialog('/menu');
      }
      else {
        var name = results.response.entity;
        var url = api + "buildings/list.json?key=" + apiToken;
        https.get(url,function(data){
          var info = '';
          data.on('data',function(item) {
            info += item;
          });
          data.on('error', function (e) {
            console.log('Errors:', e);
          });
          data.on('end', function() {
            var res = JSON.parse(info);
            var buildingName = false;
            var i = 0;
            while (!buildingName && i < res.data.length){
              if (res.data[i].building_name == name) {
                console.log("Building Name: " + res.data[i].building_name);
                console.log("Building Code: " + res.data[i].building_code);
                console.log("Building ID: " + res.data[i].building_id);
                console.log("Latitude: " + res.data[i].latitude);
                console.log("Longitude: " + res.data[i].longitude);
                buildingName = true;
              }
              i++;
            }
            builder.Prompts.text(session,"Type 'exit' to exit the bot! Type anything else to see the menu again");
          });
        });
      }
    }
    else if (session.userData.path === "info") {
      if (results.response == "exit") {
        process.exit();
      }
      session.beginDialog('/menu');
    }
    else if (session.userData.path === "feds") {
      if (results.response == "exit") {
        process.exit();
      }
      session.beginDialog('/menu');
    }
    else {
      console.log("error");
      // builder.Prompts.choice(session, "What would you like to search for?", "track|artist|album");
    }
  },
  function(session, results) {
    if (session.userData.path === "Buildings") {
      if (results.response == "exit")
        process.exit();
      session.beginDialog('/menu');
    }
  }
]);
