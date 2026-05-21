from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Base properties shared across schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)

# Properties to receive on user creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

# Properties to return in API response
class UserResponse(UserBase):
    id: str
    created_at: datetime

    # Pydantic v2 configuration to read data from SQLAlchemy ORM models
    model_config = ConfigDict(from_attributes=True)

# Login response containing authentication tokens
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Schema representing JWT decoded contents
class TokenPayload(BaseModel):
    sub: Optional[str] = None
