const Nightmare = require('nightmare')
const nightmare = Nightmare({ 
    show: true,
    waitTimeout: 60000, // in ms or 1 minute 
    gotoTimeout: 60000, // in ms or 1 minute 
 })

nightmare
    .goto('https://www.google.com')
    //   .type('#search_form_input_homepage', 'github nightmare')
    //   .click('#search_button_homepage')
    
    .end()
    .catch(error => {
        console.error('Search failed:', error)
    })


//update user set authentication_string=null, plugin='mysql_native_password' where user='export';

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "159.65.128.190",
    user: "viicheck2",
    password: "viicheck",
    database: "viicheck"
  });
  connection.query("SELECT * FROM `users`", async function (err, results, fields) {
    if (err) throw err;
    console.log(results);
    
    
    
});


    