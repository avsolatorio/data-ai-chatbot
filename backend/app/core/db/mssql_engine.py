"""
MSSQL engine factory.

Creates SQLAlchemy async engine for MSSQL using aioodbc driver with
Azure Entra ID authentication support.
"""

import struct

import aioodbc
from azure.identity import DefaultAzureCredential
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config import settings


def get_access_token_struct() -> bytes:
    """
    Get an Entra ID access token using the current logged-in identity
    (Azure CLI / VS Code / Managed Identity).

    Returns:
        bytes: Token encoded as length-prefixed bytes for ODBC
    """
    credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-8")

    # ODBC requires token as length-prefixed bytes
    return struct.pack("<I", len(token_bytes)) + token_bytes


def create_mssql_engine() -> AsyncEngine:
    """
    Create an async MSSQL engine with Azure Entra ID authentication.

    Returns:
        AsyncEngine: Configured async engine for MSSQL

    Raises:
        ValueError: If required Azure SQL settings are not configured
    """
    azure_sql = settings.AZURE_SQL

    if not azure_sql.SERVER or not azure_sql.DATABASE:
        raise ValueError(
            "AZURE_SQL_SERVER and AZURE_SQL_DATABASE are required when DATABASE_TYPE=mssql. "
            "Please set these in your environment variables."
        )

    # Build ODBC connection string
    odbc_driver = azure_sql.ODBC_DRIVER
    server = azure_sql.SERVER
    database = azure_sql.DATABASE
    port = azure_sql.PORT

    if azure_sql.USE_ENTRA_ID:
        # Use Entra ID authentication with token
        async def async_creator() -> aioodbc.Connection:
            token_struct = get_access_token_struct()
            conn_str = (
                f"Driver={{{odbc_driver}}};"
                "Encrypt=yes;"
                "TrustServerCertificate=no;"
                f"Server=tcp:{server},{port};"
                f"Database={database};"
            )

            conn = await aioodbc.connect(
                dsn=conn_str,
                autocommit=False,
                attrs_before={1256: token_struct},  # SQL_COPT_SS_ACCESS_TOKEN
            )
            return conn

        return create_async_engine(
            "mssql+aioodbc://",
            async_creator=async_creator,
            pool_pre_ping=True,
            echo=settings.ENVIRONMENT == "development",
        )
    else:
        # Use username/password authentication
        if not azure_sql.USERNAME or not azure_sql.PASSWORD:
            raise ValueError(
                "AZURE_SQL_USERNAME and AZURE_SQL_PASSWORD are required when "
                "AZURE_SQL_USE_ENTRA_ID=false. Please set these in your environment variables."
            )

        async def async_creator() -> aioodbc.Connection:
            conn_str = (
                f"Driver={{{odbc_driver}}};"
                "Encrypt=yes;"
                "TrustServerCertificate=no;"
                f"Server=tcp:{server},{port};"
                f"Database={database};"
                f"UID={azure_sql.USERNAME};"
                f"PWD={azure_sql.PASSWORD};"
                "Authentication=ActiveDirectoryPassword;"
            )

            return await aioodbc.connect(
                dsn=conn_str,
                autocommit=False,
            )

        return create_async_engine(
            "mssql+aioodbc://",
            async_creator=async_creator,
            pool_pre_ping=True,
            echo=settings.ENVIRONMENT == "development",
        )
