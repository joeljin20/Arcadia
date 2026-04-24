# Key Model Training (TensorFlow + TFJS)

This project supports a custom **key vs not_key** classifier for Arcadia initiation.

## 1) Prepare dataset

Create image folders:

```text
ml/datasets/
  key/
  not_key/
```

Guidelines:

- Minimum: 40 images per class (recommended 150+ each).
- Include variations: lighting, distance, background, hand positions, multiple key types.
- Add hard negatives in `not_key` (phones, remotes, metallic objects, wallets, tools).
- Keep a roughly balanced class count.

## 2) Install training deps

```bash
python3 -m venv .venv-ml
source .venv-ml/bin/activate
pip install -r ml/requirements.txt
```

Note: this stack is pinned for **Python 3.11**. If your system Python is newer (for example 3.13), use Docker mode below.

## 3) Train and export model

```bash
python3 ml/train_key_classifier.py
```

Docker alternative (recommended for reproducibility):

```bash
bash ml/train_key_classifier_docker.sh
```

Outputs:

- `ml/output/key_classifier.keras`
- `ml/output/key_classifier_metrics.json`
- `public/models/key_classifier/model.json` (+ shards)
- `public/models/key_classifier/labels.json`

## 4) Run app with custom model

The initiation flow auto-loads `/models/key_classifier/model.json` if present.
If unavailable, it falls back to heuristic TF detection.

## 5) Quality targets

Before demo, aim for validation metrics in `ml/output/key_classifier_metrics.json`:

- `val_auc >= 0.93`
- `val_precision >= 0.90`
- `val_recall >= 0.90`

If metrics are below target:

- Add more diverse `not_key` negatives.
- Add low-light and motion-blur key positives.
- Retrain with more epochs (`--epochs 24`) or lower LR (`--learning-rate 5e-5`).
