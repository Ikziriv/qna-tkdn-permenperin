
import pypdf
import json

def extract_qna(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

if __name__ == "__main__":
    files = ["assets/qna/qna-01.pdf", "assets/qna/qna-02.pdf"]
    results = {}
    for f in files:
        try:
            results[f] = extract_qna(f)
        except Exception as e:
            results[f] = f"Error: {e}"
    
    print(json.dumps(results, indent=2))
