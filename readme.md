```markdown
# Website Cloner CLI

A simple, powerful command-line tool to **clone the UI of any website** (HTML, CSS, JS) by providing the site link. Built with Node.js, Puppeteer, OpenAI, and Cloudinary.

---

## ✨ Features

- **Easy to Use:**  
  Run a single command with the website link to clone its HTML, CSS, and JS!

- **Automation Powered:**  
  Utilizes Puppeteer for browser automation and OpenAI for smart content processing.

- **Media Handling:**  
  Seamless support for fetching and storing media assets via Cloudinary.

---

## 🛠 Tech Stack

- **JavaScript (Node.js)**
- **Puppeteer**
- **OpenAI API**
- **Cloudinary API**

---

## 🚀 Setup & Usage

1. **Clone the repository:**
    ```
    git clone https://github.com/Yasho321/Website-cloner-CLI-.git
    cd Website-cloner-CLI-
    ```

2. **Install dependencies:**
    ```
    npm install
    ```

3. **Setup your environment variables:**  
   Create a `.env` file in the root folder and add the required API keys (OpenAI, Cloudinary, etc.)

4. **Clone any website UI:**
    ```
    node websiteCloner.js "URL_OF_SITE_TO_CLONE"
    ```
    Example:
    ```
    node websiteCloner.js "https://www.example.com"
    ```

---

## 🎥 Demo Video

Watch how it works step-by-step:

<video width="1920" height="1080" controls>
  <source src="./assets/Website cloner.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

## 📦 Files

- `websiteCloner.js` — Main CLI utility script
- `package.json` — Project and dependencies
- `.gitignore`, `.env` — Environment setup
- `screenshot.png` — Example output

---

## 📢 Notes

- Only use for educational purposes or with websites you own/have permission to clone.
- Make sure to setup your own `.env` for API keys.

---

Pull requests and feedback are welcome!
```

