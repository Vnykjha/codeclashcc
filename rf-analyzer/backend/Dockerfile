FROM python:3.11-slim

WORKDIR /app

# Install deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY main.py simulator.py classifier.py scorer.py train.py ./
COPY scenarios/ ./scenarios/

# Pre-train and bake model.pkl into the image
RUN python train.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
