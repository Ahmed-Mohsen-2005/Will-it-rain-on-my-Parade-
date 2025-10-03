from sqlalchemy import MetaData
from database import engine

metadata = MetaData()
metadata.reflect(bind=engine)

# Example: access a table by name
# Weather = metadata.tables.get("weather")
