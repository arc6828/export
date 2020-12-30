import pandas as pd
import mysql.connector
mydb = mysql.connector.connect(
  host="159.65.128.190",
  user="export",
  password="export_123456",
  database="export"
)
mycursor = mydb.cursor()
mycursor.execute("SELECT hscode,product FROM export_2hs")
export_2hs = mycursor.fetchall()
for x in export_2hs:
    print(x)
    hscode= x[0]
    # print(x[0] + x[1])
    #mycursor = mydb.cursor()
    sql = "SELECT html_data FROM export_2hs WHERE hscode = %s"
    data = ("99",)
    mycursor.execute( sql , data )
    obj = mycursor.fetchone()
    # print(obj)
    html_data = obj[0]
    dfs = pd.read_html(html_data)

    


    break

