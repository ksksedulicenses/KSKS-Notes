/* ----------------------------
   KSKS-Notes app.js
   Voll funktionsfähig mit Supabase
---------------------------- */

/* --- Supabase Setup --- */
const supabaseUrl = "DEINE_SUPABASE_URL";
const supabaseKey = "DEIN_SUPABASE_ANON_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/* --- Auth Check --- */
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) window.location = "login.html";
    else document.getElementById("welcome").innerText = "Hallo " + user.email;
}
checkAuth();

/* --- Logout --- */
async function logout() {
    await supabase.auth.signOut();
    window.location = "login.html";
}

/* --- Navigation --- */
function showSection(id) {
    ["dashboard","notizen","chat","videocall","premium","licenses","materials","admin"]
        .forEach(s => document.getElementById(s).style.display = "none");
    document.getElementById(id).style.display = "block";
}

/* --- Notizen & Ordner --- */
async function addFolder() {
    const name = document.getElementById("folderName").value;
    if(!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("folders").insert([{ user_id: user.id, name: name }]);
    loadFolders();
}

async function loadFolders() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: folders } = await supabase.from("folders").select("*").eq("user_id", user.id);
    const div = document.getElementById("folders");
    div.innerHTML = "";
    folders.forEach(f => div.innerHTML += "<p>"+f.name+"</p>");
}

async function saveNote() {
    const { data: { user } } = await supabase.auth.getUser();
    const content = document.getElementById("noteArea").innerHTML;
    await supabase.from("notes").insert([{ user_id: user.id, content: content }]);
    alert("Notiz gespeichert!");
}

/* --- Chat --- */
async function sendChat() {
    const { data: { user } } = await supabase.auth.getUser();
    const text = document.getElementById("chatMsg").value;
    if(!text) return;
    await supabase.from("messages").insert([{ user_id: user.id, text: text }]);
    document.getElementById("chatMsg").value = "";
}

async function loadChat() {
    supabase.from("messages").on("INSERT", payload => {
        const chatArea = document.getElementById("chatArea");
        chatArea.innerHTML += payload.new.text + "<br>";
        chatArea.scrollTop = chatArea.scrollHeight;
    }).subscribe();
}
loadChat();

/* --- Videocall --- */
function startCall() {
    const room = Math.random().toString(36).substring(2,10);
    window.open("https://meet.jit.si/"+room, "_blank");
}

/* --- Premium --- */
async function activatePremium() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ premium: true }).eq("id", user.id);
    alert("Premium aktiviert!");
}

/* --- E-Lizenzen --- */
async function createLicense() {
    const title = prompt("Lizenz Titel");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("licenses").insert([{ title: title, owner_id: user.id }]);
    loadLicenses();
}

async function loadLicenses() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: licenses } = await supabase.from("licenses").select("*").eq("owner_id", user.id);
    const div = document.getElementById("licenseList");
    div.innerHTML = "";
    licenses.forEach(l => div.innerHTML += "<p>"+l.title+"</p>");
}
loadLicenses();

/* --- Materialien Upload --- */
async function uploadMaterial() {
    const file = document.getElementById("materialFile").files[0];
    if(!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.storage.from("materials").upload(user.id+"/"+file.name, file);
    if(error) alert(error.message);
    else loadMaterials();
}

async function loadMaterials() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: files } = await supabase.storage.from("materials").list(user.id);
    const div = document.getElementById("materialList");
    div.innerHTML = "";
    files.forEach(f => div.innerHTML += "<p>"+f.name+"</p>");
}
loadMaterials();

/* --- Admin-Bereich --- */
async function loadUsers() {
    const { data: users } = await supabase.from("profiles").select("*");
    const div = document.getElementById("userList");
    div.innerHTML = "";
    users.forEach(u => div.innerHTML += "<p>"+u.email+" | "+(u.premium?"Premium":"Free")+" | "+u.role+"</p>");
}

/* --- PWA Offline Cache --- */
if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service-worker.js");
}
