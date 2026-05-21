# Base Python Image
FROM python:3.11-slim

# Prevent Python from writing .pyc files to disk and ensure console logging isn't buffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UPLOAD_DIR=/app/uploads

# Set working directory inside container
WORKDIR /app

# Install compilation essentials (useful for cryptography/bcrypt if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . /app/

# Ensure the upload directory exists
RUN mkdir -p /app/uploads

# Expose FastAPI default port
EXPOSE 8000

# Start Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
