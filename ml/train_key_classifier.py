#!/usr/bin/env python3
"""Train a key-vs-not_key classifier and export to TensorFlow.js.

Dataset layout:
  ml/datasets/
    key/
      *.jpg|*.png|...
    not_key/
      *.jpg|*.png|...

Output:
  public/models/key_classifier/model.json (+ shard files)
  ml/output/key_classifier.keras
  public/models/key_classifier/labels.json
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass
class TrainConfig:
    dataset_dir: Path
    output_dir: Path
    tfjs_dir: Path
    image_size: int
    batch_size: int
    epochs: int
    learning_rate: float
    val_split: float
    seed: int


def parse_args() -> TrainConfig:
    parser = argparse.ArgumentParser(description="Train key classifier and export to TFJS")
    parser.add_argument("--dataset-dir", default="ml/datasets", help="Dataset root with key/ and not_key/")
    parser.add_argument("--output-dir", default="ml/output", help="Directory to save .keras model")
    parser.add_argument("--tfjs-dir", default="public/models/key_classifier", help="Directory for tfjs model")
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=18)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--val-split", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    return TrainConfig(
        dataset_dir=Path(args.dataset_dir),
        output_dir=Path(args.output_dir),
        tfjs_dir=Path(args.tfjs_dir),
        image_size=args.image_size,
        batch_size=args.batch_size,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        val_split=args.val_split,
        seed=args.seed,
    )


def fail(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def ensure_dataset(dataset_dir: Path) -> None:
    for cls in ("key", "not_key"):
        folder = dataset_dir / cls
        if not folder.exists() or not folder.is_dir():
            fail(f"Missing dataset folder: {folder}")
        files = [
            p
            for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in ALLOWED_EXTENSIONS
        ]
        if len(files) < 40:
            fail(
                f"Need at least 40 images in {folder} for a stable demo model. "
                f"Found {len(files)}"
            )


def train(cfg: TrainConfig) -> None:
    try:
        import tensorflow as tf
    except Exception as exc:  # pragma: no cover
        fail(
            "TensorFlow is not installed. Run: pip install -r ml/requirements.txt\n"
            f"Original error: {exc}"
        )

    ensure_dataset(cfg.dataset_dir)
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    cfg.tfjs_dir.mkdir(parents=True, exist_ok=True)

    tf.keras.utils.set_random_seed(cfg.seed)

    train_ds = tf.keras.utils.image_dataset_from_directory(
        cfg.dataset_dir,
        labels="inferred",
        label_mode="binary",
        class_names=["not_key", "key"],
        validation_split=cfg.val_split,
        subset="training",
        seed=cfg.seed,
        image_size=(cfg.image_size, cfg.image_size),
        batch_size=cfg.batch_size,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        cfg.dataset_dir,
        labels="inferred",
        label_mode="binary",
        class_names=["not_key", "key"],
        validation_split=cfg.val_split,
        subset="validation",
        seed=cfg.seed,
        image_size=(cfg.image_size, cfg.image_size),
        batch_size=cfg.batch_size,
    )

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(512).prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)

    data_aug = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.12),
            tf.keras.layers.RandomContrast(0.12),
        ],
        name="augmentation",
    )

    base = tf.keras.applications.MobileNetV2(
        input_shape=(cfg.image_size, cfg.image_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(cfg.image_size, cfg.image_size, 3))
    x = data_aug(inputs)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.22)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="key_probability")(x)
    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=cfg.learning_rate),
        loss="binary_crossentropy",
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_auc",
            mode="max",
            patience=4,
            restore_best_weights=True,
        )
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=cfg.epochs,
        callbacks=callbacks,
        verbose=2,
    )

    metrics = model.evaluate(val_ds, verbose=0)
    metric_names = model.metrics_names
    metric_report = dict(zip(metric_names, [float(v) for v in metrics]))

    keras_model_path = cfg.output_dir / "key_classifier.keras"
    model.save(keras_model_path)

    labels_path = cfg.tfjs_dir / "labels.json"
    labels_path.write_text(json.dumps({"0": "not_key", "1": "key"}, indent=2), encoding="utf-8")

    report_path = cfg.output_dir / "key_classifier_metrics.json"
    report_path.write_text(
        json.dumps(
            {
                "config": {
                    "image_size": cfg.image_size,
                    "batch_size": cfg.batch_size,
                    "epochs": cfg.epochs,
                    "learning_rate": cfg.learning_rate,
                    "val_split": cfg.val_split,
                },
                "history": {k: [float(x) for x in v] for k, v in history.history.items()},
                "validation_metrics": metric_report,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    converter_cmd = [
        "tensorflowjs_converter",
        "--input_format=keras",
        "--output_format=tfjs_layers_model",
        str(keras_model_path),
        str(cfg.tfjs_dir),
    ]

    try:
        subprocess.run(converter_cmd, check=True)
    except FileNotFoundError:
        fail(
            "tensorflowjs_converter not found. Install tensorflowjs with:\n"
            "pip install tensorflowjs"
        )

    print("Training complete.")
    print(f"Saved Keras model: {keras_model_path}")
    print(f"Saved TFJS model: {cfg.tfjs_dir / 'model.json'}")
    print(f"Validation metrics: {metric_report}")


if __name__ == "__main__":
    config = parse_args()
    train(config)
