const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: false })

nightmare
    .goto('https://www.trademap.org/Country_SelProduct_TS.aspx')
    //   .type('#search_form_input_homepage', 'github nightmare')
    //   .click('#search_button_homepage')
    .wait('#ctl00_PageContent_MyGridView1')
    .evaluate(() => {
        let table = document.querySelector('#ctl00_PageContent_MyGridView1');
        let title = document.querySelector('#ctl00_TitleContent');
        //console.log("Hello", table.innerHTML);
        let text = "<div>";
        text += title.innerHTML;
        text += "</div>";
        text += table.parentElement.innerHTML;
        return  text;
    })
    .end()
    .then(console.log)
    .catch(error => {
        console.error('Search failed:', error)
    })
    