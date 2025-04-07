FROM python:3.10

# Set workdir
WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy backend & utils
COPY app ./app
COPY utils ./utils

# Copy React frontend build
COPY client/build ./client/build

# Download model at runtime via your app

# Run the FastAPI app
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000"]
