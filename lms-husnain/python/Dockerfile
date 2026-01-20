# Multi-stage build for smaller image size and better caching
# Stage 1: Builder stage for dependencies
FROM python:3.12-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies required for building
# Combine RUN commands to reduce layers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    gcc \
    g++ \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy only dependency files first (for better layer caching)
COPY requirements.txt pyproject.toml ./

# Install Python dependencies
# Split into two steps: first install compiled packages, then pure Python
RUN pip install --no-cache-dir \
    numpy==2.3.4 \
    opencv-python-headless==4.11.0.86 \
    && pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage (smaller final image)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install only runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser ./app ./app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run the application with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
