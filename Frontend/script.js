const API = "https://0smauednve.execute-api.ap-south-1.amazonaws.com/prod";


function getToken() {
  return localStorage.getItem("token");
}


function logout() {

    // Remove token from local storage
    localStorage.removeItem("token");

    // Redirect to login page
    window.location.href = "login.html";
}


// Upload
async function upload() {

    try {

        const file = document.getElementById("file").files[0];

        if (!file) {
            alert("Select file first");
            return;
        }

        // Get upload URL
        const res = await fetch(
            API + "/upload-url?name=" + encodeURIComponent(file.name) + "&tags=" + encodeURIComponent(document.getElementById("tags").value),
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        const data = await res.json();

        if (!data.uploadUrl) {
            alert("Failed to get upload URL");
            console.log(data);
            return;
        }

        // Upload to S3
        await fetch(data.uploadUrl, {
            method: "PUT",
            body: file
        });

        alert("Upload successful");

        loadFiles();

    } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed");
    }
}


// Load files
async function loadFiles() {

    try {

        const filter = (document.getElementById("filterTag")?.value || "").trim();

        const res = await fetch(
            API + "/list?tag=" + encodeURIComponent(filter),
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        if (!res.ok) {
            console.error("API error:", res.status);
            alert("Failed to load files");
            return;
        }

        const data = await res.json();

        const list = document.getElementById("fileList");
        list.innerHTML = "";

        if (!data.files || data.files.length === 0) {

            const emptyMsg = document.createElement("li");
            emptyMsg.innerText = "No files found.";
            emptyMsg.style.color = "gray";
            list.appendChild(emptyMsg);

            return;
        }

        data.files.forEach(file => {

            const li = document.createElement("li");

            // LEFT SIDE (File Info)
            const left = document.createElement("div");

            const name = document.createElement("span");
            name.className = "file-name";
            name.innerText = file.name;

            const tag = document.createElement("span");
            tag.className = "tag";
            tag.innerText = file.tags || "No Tags";

            const downloads = document.createElement("small");
            downloads.style.marginLeft = "10px";
            downloads.innerText = "Downloads: " + (file.downloadCount || 0);

            left.appendChild(name);
            left.appendChild(tag);
            left.appendChild(downloads);

            // RIGHT SIDE (Buttons)
            const right = document.createElement("div");

            const downloadBtn = document.createElement("button");
            downloadBtn.innerText = "Download";
            downloadBtn.onclick = () => downloadFile(file.key, file.name);

            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "Delete";
            deleteBtn.style.backgroundColor = "red";
            deleteBtn.style.marginLeft = "8px";
            deleteBtn.onclick = () => deleteFile(file.key, file.name);

            right.appendChild(downloadBtn);
            right.appendChild(deleteBtn);

            li.appendChild(left);
            li.appendChild(right);

            list.appendChild(li);
        });

    } catch (err) {

        console.error("Load error:", err);
        alert("Load failed");
    }
}



// Download
async function downloadFile(key, name) {

    try {

        const res = await fetch(
            API + "/download?key=" + encodeURIComponent(key) +
            "&name=" + encodeURIComponent(name),
            {
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        const data = await res.json();

        if (!data.url) {
            alert(data.error || "Download failed");
            return;
        }

        window.open(data.url, "_blank");

    } catch (err) {
        console.error("Download error:", err);
        alert("Download failed");
    }
}


// Delete file
async function deleteFile(key, name) {

    if (!confirm("Are you sure you want to delete this file?")) {
        return;
    }

    try {

        const res = await fetch(
            API + "/delete?key=" + encodeURIComponent(key) +
            "&name=" + encodeURIComponent(name),
            {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + getToken()
                }
            }
        );

        const data = await res.json();

        alert(data.message || data.error);

        // Reload file list
        loadFiles();

    } catch (err) {

        console.error("Delete error:", err);
        alert("Delete failed");
    }
}

function showUserInfo() {

    const token = getToken();

    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));

    const email = payload.email;
    const groups = payload["cognito:groups"] || [];

    document.getElementById("userEmail").innerText = email;
    document.getElementById("userRole").innerText =
        groups.length ? groups.join(", ") : "User";
}

document.addEventListener("DOMContentLoaded", function() {
    showUserInfo();
    loadFiles();
});

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}