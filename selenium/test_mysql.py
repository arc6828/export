import mysql.connector
mydb = mysql.connector.connect(
  host="159.65.128.190",
  user="viicheck",
  password="viicheck",
  database="viicheck"
)
mycursor = mydb.cursor()
mycursor.execute("SELECT * FROM details")
myresult = mycursor.fetchall()
for x in myresult:
  print(x)