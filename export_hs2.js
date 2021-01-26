const Nightmare = require('nightmare')
const nightmare = Nightmare({ 
    show: true,
    waitTimeout: 60000, // in ms or 1 minute 
    gotoTimeout: 60000, // in ms or 1 minute 
 })
const global_delay_ms = 20000;
// const mysql = require('mysql');
// const connection = mysql.createConnection({
//     host: "127.0.0.1",
//     user: "export",
//     password: "export",
//     database: "export"
// });
// connection.connect();
// console.log("Connected!");
const fs = require('fs');
var hs2 = [];
var remaining_hs2 = [];

async function getHS2(){            
    let success = true;
    await nightmare
        .goto('https://www.trademap.org/Country_SelProduct_TS.aspx')
        .wait('#ctl00_PageContent_MyGridView1')
        .evaluate(() => {        
            let product = document.querySelector('#ctl00_NavigationControl_DropDownList_Product');
            let indexes = [];
            for (let i = 0; i < product.length; i++) {
                if(Number(product.options[i].value)<100){
                    indexes.push(""+product.options[i].value);
                }
            }
            return indexes;
        })
        .then(function(product_indexes){       
            hs2 = product_indexes;
            console.log("Get HS2" );
        })
        .catch(error => {
            console.error('Get HS2 failed:', error)
            success = false;
        });
    return success;
}
async function config(){       
    let success = true;
    //CHOOSE TIMEPEROIDS PER PAGE     
    await nightmare
        .select('#ctl00_PageContent_GridViewPanelControl_DropDownList_NumTimePeriod', '20')      
        .wait(global_delay_ms)  
        .wait('#ctl00_PageContent_MyGridView1')
        .then(function(){            
            console.log("Select time period 20 months");
        })
        .catch(error => {
            console.error('Select time period 20 months failed:', error)
            success = false;
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
            console.error('Select 300 rows per page failed:', error)
            success = false;
        });
    return success;
}

async function loadStatus(){
    let status = JSON.parse(fs.readFileSync("export_hs2_status.json").toString('utf8'));
    console.log(status);

    remaining_hs2 = [...hs2].filter(code => !status[code]);
    console.log("Remaining HS2 : ", remaining_hs2);
}

async function extract(code){
    let success = true;
    if(code.length != 2 ) {
        console.error('Select HS2 failed:')
        return false;
    }
    await nightmare
        .select('#ctl00_NavigationControl_DropDownList_Product', code)                     
        .wait(global_delay_ms)     
        .wait('#ctl00_PageContent_MyGridView1') 
        .evaluate(() => {        
            let row_per_pages = document.querySelector("#ctl00_PageContent_GridViewPanelControl_DropDownList_PageSize").value;
            let time_peroid =  document.querySelector("#ctl00_PageContent_GridViewPanelControl_DropDownList_NumTimePeriod").value;
            let product = document.querySelector('#ctl00_NavigationControl_DropDownList_Product');
            let table = document.querySelector('#ctl00_PageContent_MyGridView1');
            let title = document.querySelector('#ctl00_TitleContent');
            //PACK NEEDED DATA 
            return  [
                product.value.trim(),
                product[product.selectedIndex].text.trim(),
                title.textContent.trim(),
                table.parentElement.innerHTML.trim(),
                row_per_pages,
                time_peroid
            ];
        })
        .then(async function(data){       
            console.log("THEN : ", data[0], data[1]);
            //INSERTION
            let count = (data[3].match(/table/g) || []).length;
            if(count == 2){
                // let sql = "INSERT INTO export_2hs (hscode, product,html_title, html_data) VALUES ( ?, ?, ? , ? )";        
                // connection.query(sql, data, function (err, result) {
                //     if (err) throw err;
                // });                
                let filename = "html_hs2/"+data[0] + ".json";
                fs.writeFileSync(filename, JSON.stringify(data));

                console.error('Extract HS2 : ', data[0])
            }

            if(data[4] != 300 || data[5] != 20){

            }

        })
        .catch(error => {
            console.error('Extract HS2 failed:', error)
            success = false;
        });
    return success;
}

(async function (){
    //1. Get HS2
    await getHS2();

    //2. Config
    await config();

    //UNTIL FINISH
    while(true){
        //3. Load Status
        await loadStatus();
        //4. SELECT unfinished HS2 and get HS2
        if(remaining_hs2.length > 0){
            let selected_hs = remaining_hs2[0];


            // await getHS4(selected_hs);
            // let count=0;

            // for(let item of hs4){
            //     if( await extract(item) ) count++;
            // }            

            //UPDATE STATUS
            if(await extract(selected_hs)){
                //LOAD
                let filename = "export_hs2_status.json";
                let data  = JSON.parse(fs.readFileSync(filename));            
                //UPDATE
                data[selected_hs]  = true;
                //save            
                fs.writeFileSync(filename, JSON.stringify(data));
                console.error('SUCCESS : ', selected_hs);
                
                // await getHS4(selected_hs);
            }

        }else{
            //FINISHED ALL
            break;
        }
    }

    
    //5.
})();