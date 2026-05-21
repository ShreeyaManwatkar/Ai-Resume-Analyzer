from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Determine if we're using SQLite to apply specific config
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# SQLite needs connect_args={"check_same_thread": False} in sync, but let's pass it for completeness 
# if needed. For async engines, it's generally fine, but we'll include it conditionally.
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for SQL logging during debugging
    connect_args=connect_args if is_sqlite else {}
)

# Async session maker
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency to get db session
async def get_db():
    """
    Dependency generator for database sessions.
    Yields an active AsyncSession and guarantees rollback on failure and final closure.
    """
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
