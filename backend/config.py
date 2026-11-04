from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    environment: str = "prod"
    spark_swarm_api_url: str = "https://sparkswarm.com/api/v1"


settings = Settings()
