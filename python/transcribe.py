import sys
import json
import whisper

def transcribe(file_path, model_name="base"):
    model = whisper.load_model(model_name)
    result = model.transcribe(file_path, word_timestamps=True)

    output = {
        "text": result["text"],
        "language": result.get("language", ""),
        "segments": []
    }

    for segment in result["segments"]:
        seg_data = {
            "id": segment["id"],
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"],
            "words": []
        }
        if "words" in segment:
            for word_info in segment["words"]:
                seg_data["words"].append({
                    "word": word_info["word"],
                    "start": round(word_info["start"], 3),
                    "end": round(word_info["end"], 3)
                })
        output["segments"].append(seg_data)

    return output

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"

    try:
        result = transcribe(file_path, model_name)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
