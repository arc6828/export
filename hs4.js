const Nightmare = require('nightmare')
const nightmare = Nightmare({ 
    show: true,
    waitTimeout: 30000, // in ms or 1 minute 
    gotoTimeout: 30000, // in ms or 1 minute 
 })
const global_delay_ms = 20000;
const mode = "import"; // import or export
const fs = require('fs');
var hs2 = [];
var hs4 = [];
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
    //CHOOSE MODE         
    console.log("Config : "+(mode=="export"?"E":"I"));
    await nightmare
        .select('#ctl00_NavigationControl_DropDownList_TradeType', ""+(mode=="export"?"E":"I"))
        // .select('#ctl00_NavigationControl_DropDownList_TradeType', "I")
        .wait(global_delay_ms)  
        //.wait('#ctl00_PageContent_MyGridView1')
        .evaluate(() => {                    
            let title = document.querySelector('#ctl00_TitleContent');
            //PACK NEEDED DATA 
            return  title.textContent.trim();
        })
        .then(function(data){           
            if(data.includes(mode)){    
                console.log("Select Trade Type : " ,data);
            }else{            
                console.log('Wrong page : 404 : ',data)
                success = false;
            }
        })
        .catch(error => {
            console.error('Select Trade Type :', error)
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
    let status = JSON.parse(fs.readFileSync(mode+"_hs2_status.json").toString('utf8'));
    console.log(status);

    remaining_hs2 = [...hs2].filter(code => !status[code]);
    console.log("Remaining HS2 : ", remaining_hs2);
}

async function getHS4(hs2code){
    let success = true;
    await nightmare
        .select('#ctl00_NavigationControl_DropDownList_Product', hs2code)                     
        .wait(global_delay_ms)     
        .wait('#ctl00_PageContent_MyGridView1') 
        .evaluate(() => {        
            let product = document.querySelector('#ctl00_NavigationControl_DropDownList_Product');
            let indexes = [];
            for (let i = 0; i < product.length; i++) {
                if(Number(product.options[i].value)>100){
                    indexes.push(""+product.options[i].value);
                }
            }
            return indexes;
        })
        .then(function(product_indexes){       
            hs4 = product_indexes;
            console.log("Get HS4" , hs4);
        })
        .catch(error => {
            console.error('Get HS4 failed:', error)
            success = false;
        });
    return success;
}

async function extract(code){
    let success = true;
    if(code.length != 4 ) {
        console.error('Select HS4 failed:')
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
                let filename = "html_hs4/"+mode+"/"+data[0] + ".json";
                fs.writeFileSync(filename, JSON.stringify(data));

                console.error('Extract HS4 : ', data[0])
            }

            if(data[4] != 300 || data[5] != 20){

            }

        })
        .catch(error => {
            console.error('Extract HS4 failed:', error)
            success = false;
        });
    return success;
}

(async function (){
    //1. Get HS2
    while(true){
        let s = await getHS2();
        if(s) break;
    }

    //2. Config
    await config();

    //UNTIL FINISH
    while(true){
        //3. Load Status
        await loadStatus();
        //4. SELECT unfinished HS2 and get HS4
        if(remaining_hs2.length > 0){
            let selected_hs = remaining_hs2[0];
            await getHS4(selected_hs);
            let count=0;

            for(let item of hs4){
                if( await extract(item) ) count++;
            }
            //UPDATE STATUS
            if(count == hs4.length){
                //LOAD
                let filename = mode+"_hs4_status.json";
                let data  = JSON.parse(fs.readFileSync(filename));            
                //UPDATE
                data[selected_hs]  = true;
                //save            
                fs.writeFileSync(filename, JSON.stringify(data));
                console.error('SUCCESS : ', selected_hs);
                
                await getHS4(selected_hs);
            }

        }else{
            //FINISHED ALL
            break;
        }
    }

    
    //5.
})();