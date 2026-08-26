import io
import json
import os
import threading
from datetime import datetime, timezone

import numpy as np
from PIL import Image, UnidentifiedImageError

from flask import Flask, request, jsonify, render_template
from keras.models import load_model
from keras.preprocessing import image


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEMPLATE_FOLDER = os.path.join(BASE_DIR, "templates")
STATIC_FOLDER = os.path.join(BASE_DIR, "static")


# ============================================================
# MODEL REGISTRY
#
# Each entry describes one trained model: where its file lives, what input
# size/preprocessing it expects (must match what its own notebook used when
# training it), and its measured validation accuracy so the API can flag
# a "best" model instead of just dumping three raw numbers on the client.
#
# known_val_accuracy sources (all measured directly, not estimated):
#   - vgg16:        best epoch (17/20) of this session's training run in
#                    Lung_Cancer_Dataset_IQ_OTHNCCD_VGG_16_.ipynb, on its own
#                    854-image held-out validation split.
#   - cnn:           measured directly against Split_data_CNN_0/validation
#                    (860 images) after training — the model barely trained
#                    at all (~50%, i.e. random guessing for a binary task).
#   - inception_v3:  this model's own validation split folder was empty, so
#                    it was measured against a freshly rebuilt 20% holdout
#                    (480 images) from the raw dataset instead. Because the
#                    original split used to train Inception_v3.hdf5 is
#                    unknown/lost, some of this holdout may overlap with
#                    what it was originally trained on — flagged via `note`
#                    below so the number is shown with that caveat attached.
# ============================================================

MODEL_REGISTRY = {
    "vgg16": {
        "label": "VGG16",
        "path": os.path.join(BASE_DIR, "Models", "VGG16_lung_cancer.keras"),
        "target_size": (224, 224),
        "known_val_accuracy": 0.9871,
        "accuracy_verified": True,
        "note": None,
    },
    "inception_v3": {
        "label": "InceptionV3",
        "path": os.path.join(BASE_DIR, "Models", "Inception_v3.hdf5"),
        "target_size": (299, 299),
        "known_val_accuracy": 0.9854,
        "accuracy_verified": True,
        "note": (
            "Measured on a rebuilt holdout, not the original training split "
            "(which no longer exists) — small train/validation overlap is possible."
        ),
    },
    "cnn": {
        "label": "CNN (from scratch)",
        "path": os.path.join(BASE_DIR, "FINAL_CNN.keras"),
        "target_size": (224, 224),
        "known_val_accuracy": 0.5163,
        "accuracy_verified": True,
        "note": "This model failed to learn — accuracy is close to random guessing.",
    },
}

# Same binary class order for every model here — each notebook trained with
# 0 = Benign, 1 = Malignant.
CLASS_NAMES = ["Benign", "Malignant"]


# ============================================================
# FLASK APP
# ============================================================

app = Flask(
    __name__,
    template_folder=TEMPLATE_FOLDER,
    static_folder=STATIC_FOLDER,
)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
    return response


# ============================================================
# SCAN HISTORY
#
# The frontend's dashboard used to show a hardcoded sample list that never
# changed, no matter what was actually checked. Every successful /api/predict
# call now appends a record here, persisted to a JSON file so history
# survives server restarts, and GET /api/scans serves it back so the
# dashboard's stat cards ("Total scans", "Malignant", ...) and "Recent
# scans" table reflect real, current data.
# ============================================================

SCANS_FILE = os.path.join(BASE_DIR, "scans_history.json")
_scans_lock = threading.Lock()


def _load_scans():
    if not os.path.exists(SCANS_FILE):
        return []
    try:
        with open(SCANS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save_scans(scans):
    with open(SCANS_FILE, "w", encoding="utf-8") as f:
        json.dump(scans, f, indent=2)


def _next_scan_id(existing_scans):
    max_n = 10000
    for s in existing_scans:
        try:
            max_n = max(max_n, int(str(s.get("id", "")).replace("CT-", "")))
        except ValueError:
            continue
    return f"CT-{max_n + 1}"


@app.route("/api/scans", methods=["GET"])
def get_scans():
    with _scans_lock:
        scans = _load_scans()
    scans_sorted = sorted(scans, key=lambda s: s.get("timestamp", ""), reverse=True)
    return jsonify({"success": True, "scans": scans_sorted})


@app.route("/api/scans", methods=["DELETE"])
def clear_scans():
    with _scans_lock:
        _save_scans([])
    return jsonify({"success": True})


@app.route("/api/scans/<scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    with _scans_lock:
        scans = _load_scans()
        remaining = [s for s in scans if s.get("id") != scan_id]
        if len(remaining) == len(scans):
            return jsonify({"success": False, "error": f"No scan found with id {scan_id}."}), 404
        _save_scans(remaining)
    return jsonify({"success": True})


# Reject uploads over 10 MB before they hit the handler.
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp"}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# ============================================================
# INPUT GATE — reject images that aren't grayscale CT slices
#
# All three models were trained only on lung CT scans (grayscale, 0=Benign
# vs 1=Malignant) and have no "not a CT scan" class — handed a photo of
# anything else, they will still confidently output Benign or Malignant
# because that's the only vocabulary they have. There's no separate
# "is this a chest CT" classifier trained here, so this is a heuristic,
# not a learned check: a real chest CT slice is essentially grayscale
# (equal R/G/B per pixel, give or take compression noise), while an
# ordinary photo has real, visible color somewhere in it.
#
# A single whole-image mean saturation isn't reliable — a portrait shot
# against a large dark background averages out to a low number even
# though the subject is clearly colorful, letting it slide right through.
# Instead this measures the *fraction of pixels that are unambiguously
# colorful*: for each pixel, chroma = max(R,G,B) - min(R,G,B) (raw channel
# spread, not normalized by brightness the way HSV saturation is — that
# normalization is what makes near-black noise register as "100% saturated"
# and is what breaks a simple mean-saturation check). Near-black and
# near-white pixels are excluded first since compression noise there is
# unreliable and CT scans are dominated by exactly those (black background,
# bright bone). If more than ~10% of the remaining pixels are clearly
# colorful, the image is rejected. A grayscale non-CT image (e.g. a B&W
# photo) can still slip through — chroma alone can't tell "CT scan" from
# "any grayscale picture" — but that's a real limitation to know about,
# not something silently pretended away.
# ============================================================

COLORFUL_PIXEL_FRACTION_MAX = 0.10
CHROMA_THRESHOLD = 30       # 0-255 max-min channel spread counted as "colorful"
DARK_PIXEL_MAX = 25         # pixels this dark are excluded (background noise)
NEAR_WHITE_MIN = 235        # pixels this bright *and* desaturated are excluded (blown highlights)


def check_looks_like_ct_scan(img_bytes):
    """Returns (ok, colorful_fraction). ok=False means too many pixels are
    clearly colorful for this to plausibly be a grayscale CT slice."""
    with Image.open(io.BytesIO(img_bytes)) as img:
        img = img.convert("RGB")
        img.thumbnail((200, 200))
        arr = np.asarray(img, dtype=np.float32)

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    chroma = maxc - minc

    considered = (maxc > DARK_PIXEL_MAX) & (minc < NEAR_WHITE_MIN)
    total_considered = int(considered.sum())
    if total_considered < 0.02 * considered.size:
        # Almost entirely near-black/near-white — not enough signal either
        # way, so don't block on it.
        return True, 0.0

    colorful_fraction = float((considered & (chroma > CHROMA_THRESHOLD)).sum()) / total_considered
    return colorful_fraction <= COLORFUL_PIXEL_FRACTION_MAX, round(colorful_fraction, 4)


# ============================================================
# LOAD MODELS
#
# Each model loads independently — if one file is missing or fails to
# load, the other two still work and /health reports which are up.
# ============================================================

print("=" * 60)
print("Loading Lung Cancer Detection models")
print("=" * 60)

loaded_models = {}

for key, cfg in MODEL_REGISTRY.items():
    print(f"[{cfg['label']}] loading from {cfg['path']}")
    if not os.path.exists(cfg["path"]):
        print(f"[{cfg['label']}] SKIPPED — file not found")
        continue
    try:
        loaded_models[key] = load_model(cfg["path"], compile=False)
        print(f"[{cfg['label']}] loaded OK — input shape {loaded_models[key].input_shape}")
    except Exception as exc:
        print(f"[{cfg['label']}] FAILED to load: {exc}")

print("=" * 60)
print(f"{len(loaded_models)}/{len(MODEL_REGISTRY)} models loaded")
print("=" * 60)


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if loaded_models else "degraded",
        "models": {
            key: {
                "label": cfg["label"],
                "loaded": key in loaded_models,
                "known_val_accuracy": cfg["known_val_accuracy"],
                "accuracy_verified": cfg["accuracy_verified"],
                "note": cfg["note"],
            }
            for key, cfg in MODEL_REGISTRY.items()
        },
    })


# ============================================================
# PREDICTION — runs the uploaded image through every loaded model
# ============================================================

def predict_with_model(model, img_bytes, target_size):
    # Keras 3's load_img only accepts a path or an io.BytesIO — a Werkzeug
    # FileStorage (what request.files gives us) doesn't qualify, so read the
    # upload into memory once per request and hand each model its own
    # BytesIO view of the same bytes.
    img = image.load_img(io.BytesIO(img_bytes), target_size=target_size)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    # All three models here were trained with ImageDataGenerator(rescale=1./255)
    # — plain rescaling, no model-specific mean/variance preprocessing.
    img_array = img_array / 255.0

    prediction = model.predict(img_array, verbose=0)
    probability = float(prediction[0][0])

    if probability >= 0.5:
        label = CLASS_NAMES[1]
        confidence = probability
    else:
        label = CLASS_NAMES[0]
        confidence = 1.0 - probability

    return label, confidence, probability


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "error": "No image file was uploaded."}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"success": False, "error": "No image was selected."}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "Unsupported file type. Please upload a PNG, JPG, JPEG, or BMP image.",
            }), 400

        if not loaded_models:
            return jsonify({"success": False, "error": "No models are currently loaded on the server."}), 503

        img_bytes = file.read()

        try:
            looks_like_ct, colorful_fraction = check_looks_like_ct_scan(img_bytes)
        except UnidentifiedImageError:
            return jsonify({
                "success": False,
                "error_code": "UNREADABLE_IMAGE",
                "error": "That file couldn't be read as an image.",
            }), 400

        if not looks_like_ct:
            return jsonify({
                "success": False,
                "error_code": "NOT_A_CT_SCAN",
                "error": (
                    "This doesn't look like a chest CT scan — it looks like a "
                    "regular color photo. Please upload a grayscale chest CT slice "
                    "(jpg, png, jpeg, or bmp)."
                ),
                "colorful_pixel_fraction": colorful_fraction,
            }), 422

        results = []
        for key, cfg in MODEL_REGISTRY.items():
            model = loaded_models.get(key)
            if model is None:
                results.append({
                    "model": cfg["label"],
                    "available": False,
                    "known_val_accuracy": cfg["known_val_accuracy"],
                    "accuracy_verified": cfg["accuracy_verified"],
                    "note": cfg["note"],
                })
                continue

            label, confidence, probability = predict_with_model(model, img_bytes, cfg["target_size"])
            results.append({
                "model": cfg["label"],
                "available": True,
                "label": label,
                "confidence": round(confidence * 100, 2),
                "probability": round(probability, 6),
                "known_val_accuracy": (
                    round(cfg["known_val_accuracy"] * 100, 2)
                    if cfg["known_val_accuracy"] is not None
                    else None
                ),
                "accuracy_verified": cfg["accuracy_verified"],
                "note": cfg["note"],
            })

        # "Best" = highest verified validation accuracy among models that
        # actually ran for this image. Unverified accuracy never wins, since
        # we can't stand behind that number.
        candidates = [
            r for r in results
            if r.get("available") and r.get("accuracy_verified") and r.get("known_val_accuracy") is not None
        ]
        best = max(candidates, key=lambda r: r["known_val_accuracy"]) if candidates else None

        # Fall back to the first available model's call when none of the
        # results have a verified accuracy to crown a "best" — the scan
        # still gets recorded with whatever label we do have.
        first_available = next((r for r in results if r.get("available")), None)
        record_label = best["label"] if best else (first_available["label"] if first_available else None)
        record_confidence = best["confidence"] if best else (first_available["confidence"] if first_available else None)

        now = datetime.now(timezone.utc)
        with _scans_lock:
            existing = _load_scans()
            scan_record = {
                "id": _next_scan_id(existing),
                "date": now.strftime("%Y-%m-%d"),
                "timestamp": now.isoformat(),
                "label": record_label,
                "confidence": record_confidence,
                "best_model": best["model"] if best else None,
                "results": results,
            }
            existing.append(scan_record)
            _save_scans(existing)

        return jsonify({
            "success": True,
            "results": results,
            "best": (
                {
                    "model": best["model"],
                    "label": best["label"],
                    "confidence": best["confidence"],
                    "known_val_accuracy": best["known_val_accuracy"],
                }
                if best is not None
                else None
            ),
            "scan": scan_record,
        })

    except Exception as e:
        print("=" * 60)
        print("PREDICTION ERROR")
        print(str(e))
        print("=" * 60)
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
