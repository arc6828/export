const Nightmare = require('nightmare')
const nightmare = Nightmare({ 
    show: true,
    waitTimeout: 60000, // in ms or 1 minute 
    gotoTimeout: 60000, // in ms or 1 minute 
 })
const global_delay_ms = 20000;
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "159.65.128.190",
    user: "export",
    password: "export_123456",
    database: "export"
});
connection.connect();
console.log("Connected!");
const fs = require('fs');

//ACCESS TARGET
(async function (){        
    console.log("BEGIN Access Target");
    await nightmare
        .goto('https://www.trademap.org/Country_SelProduct_TS.aspx')
        .wait('#ctl00_PageContent_MyGridView1')
        .evaluate(() => {        
            let product = document.querySelector('#ctl00_NavigationControl_DropDownList_Product');
            let product_indexes = [];
            for (let i = 0; i < product.length; i++) {
                if(Number(product.options[i].value)<100){
                    product_indexes.push(""+product.options[i].value);
                }
            }
            return product_indexes;
        })
        .then(async (product_indexes) => {      
            //console.log("ALL : " , product_indexes);
            console.log("Get all product indexes ");
            //ADJUST PARAMETERS        
            
            //CHOOSE TIMEPEROIDS PER PAGE     
            await nightmare
                .select('#ctl00_PageContent_GridViewPanelControl_DropDownList_NumTimePeriod', '20')      
                .wait(global_delay_ms)  
                .wait('#ctl00_PageContent_MyGridView1')
                .then(function(){            
                    console.log("Select time period 20 months");
                })
                .catch(error => {
                    console.error('Search failed:', error)
                });
            //CHOOSE ROWS PER PAGE
            await nightmare
                .select('#ctl00_PageContent_GridViewPanelControl_DropDownList_PageSize', '300')  
                .wait(global_delay_ms)     
                .wait('#ctl00_PageContent_MyGridView1') 
                .then(function(){            
                    console.log("Select 300 rows per page");
                })
                .catch(error => {
                    console.error('Search failed:', error)
                });
                
            //PUSH INDEXES INTO QUEUE
            connection.query("SELECT hscode FROM `export_2hs` group by `hscode`", async function (err, results, fields) {
                //if (err) throw err;
                console.log("Results", results);
                //GET BLACKLIST
                results = results.map(function(e){ return e.hscode; });
                //FILTER OUT BLACKLIST and save in queue
                let queue = product_indexes.filter(function(e) {
                    return this.indexOf(e) < 0;
                },  results);
                
                console.log("queue : ",queue.join(","));
                for(let p of queue){                    
                    await extract(p);
                }
                //SUCCESS
                success();
            });
        })  
        .catch(error => {
            console.error('Search failed:', error)
        })
})();

//EXTRACT EACH PAGE
async function extract(product_index){
    console.log("START EXTRACT : ", product_index);
    
    //CHOOSE PRODUCT         
    await nightmare
        .select('#ctl00_NavigationControl_DropDownList_Product',  product_index) 
        .wait(global_delay_ms)
        .wait('#ctl00_PageContent_MyGridView1')
        .evaluate(() => {        
            let product = document.querySelector('#ctl00_NavigationControl_DropDownList_Product');
            let table = document.querySelector('#ctl00_PageContent_MyGridView1');
            let title = document.querySelector('#ctl00_TitleContent');
            //PACK NEEDED DATA 
            return  [
                product.value.trim(),
                product[product.selectedIndex].text.trim(),
                title.textContent.trim(),
                table.parentElement.innerHTML.trim(),
            ];
        })
        
        .then(async (data)=>{
            console.log("THEN : ", data[0], data[1]);
            //INSERTION
            let count = (data[3].match(/table/g) || []).length;
            if(count == 2){
                let sql = "INSERT INTO export_2hs (hscode, product,html_title, html_data) VALUES ( ?, ?, ? , ? )";        
                connection.query(sql, data, function (err, result) {
                    if (err) throw err;
                });
            }
        })
        .catch(error => {
            console.error('Search failed:', error)
        })
}

//WHEN DONE
async function success(){
    console.log("SUCCESS!!!");
    
    connection.end();
    await nightmare.end()
}
