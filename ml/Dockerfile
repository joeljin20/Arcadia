FROM python:3.11-slim

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential git \
  && rm -rf /var/lib/apt/lists/*

COPY ml/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

CMD ["python", "ml/train_key_classifier.py"]
