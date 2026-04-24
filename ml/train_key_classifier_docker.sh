#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

docker build -f ml/Dockerfile -t arcadia-key-trainer .
docker run --rm -it -v "$ROOT_DIR:/workspace" arcadia-key-trainer python ml/train_key_classifier.py "$@"
