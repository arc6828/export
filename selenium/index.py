from selenium import webdriver

browser = webdriver.Chrome()
browser.get('https://www.trademap.org/Country_SelProduct_TS.aspx')

print(browser.title);
# assert 'Yahoo' in browser.title

# elem = browser.find_element(By.NAME, 'p')  # Find the search box
# elem.send_keys('seleniumhq' + Keys.RETURN)

browser.quit()