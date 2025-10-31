# Dockerfile for Python-based YouTube transcript fetching
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies and verify
RUN pip install --no-cache-dir -r requirements.txt && \
    echo "=== Installed packages ===" && \
    pip list && \
    echo "=== Testing imports ===" && \
    python -c "import flask; print('✓ Flask:', flask.__version__)" && \
    python -c "import youtube_transcript_api; print('✓ youtube_transcript_api installed')" && \
    python -c "import gunicorn; print('✓ Gunicorn:', gunicorn.__version__)" && \
    echo "=== All imports successful ==="

# Copy application files
COPY app.py .

# Verify app.py syntax and imports
RUN echo "=== Verifying app.py ===" && \
    python -m py_compile app.py && \
    echo "✓ app.py syntax valid" && \
    python -c "import app; print('✓ app.py imports successfully'); print('✓ Flask app object:', app.app)"

# Set environment
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "-u", "app.py"]

