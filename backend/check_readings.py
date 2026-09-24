import sqlite3

conn = sqlite3.connect('mine_monitor.db')
count = conn.execute("SELECT COUNT(*) FROM sensor_readings;").fetchone()
print("Total readings stored:", count[0])
conn.close()