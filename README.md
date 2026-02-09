<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# TKDN & BMP Compliance Navigator
### Regulatory Readiness Tool for Permenperin 35/2025
</div>

---

## 🏛️ Context & Mission
In early 2025, the **Ministry of Industry (Kementerian Perindustrian)** issued **Regulation No. 35 Year 2025**, introducing updated parameters for **TKDN (Domestic Component Level)** and **BMP (Company Benefit Weight)** certification. 

This navigator is designed to help industrial stakeholders evaluate their understanding of these new rules, simulate technical audit documents, and identify gaps in compliance before engaging with Independent Verification Agencies (LVI).

## 🚀 Key Features
- **Interactive Readiness Assessment**: 10+ technical questions covering specific Articles (Pasal) and Clauses (Ayat) of the new regulation.
- **Competency Architecture**: Real-time visual breakdown of regulatory mastery across categories like Goods Calculation, Labor (WNI), and BMP Rules.
- **Technical Audit Simulation**: Generate and print exportable A4 reports following standard industrial reporting formats.
- **Multilingual Support**: Fully localized interface in **Bahasa Indonesia** and **English**.

## 💻 Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Engine**: [Vite](https://vitejs.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Gemini API Key**: Required for AI integration features.

### Installation
1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd qna-tkdn-permenperin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📄 License
This project is for educational and regulatory readiness purposes. Detailed legal compliance should still be verified through official Ministry channels.

