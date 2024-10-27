import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();
const url = new URLSearchParams(new URL(window.location.href).search);

const fmDB = getFirestore(initializeApp({
  projectId: "patr-3a75e",
  appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
  apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
  authDomain: "patr-3a75e.firebaseapp.com",
  storageBucket: "patr-3a75e.appspot.com",
  messagingSenderId: "1067533396497",
  measurementId: "G-Y2ZJ3SMS32"
}, "fm"));

let userId = url.get('userId');
if (userId == null) {
  alert('Required URL parameter `userId` is missing');
  throw new Error('Required URL parameter `userId` is missing');
}

let lastReviewedMemoryTimestamp = url.get('since');
if (lastReviewedMemoryTimestamp == null) {
  alert('Required URL parameter `since` is missing');
  throw new Error('Required URL parameter `since` is missing');
}

let memoryData = [];
try {
  let q = query(
    collection(fmDB, 'memory'),
    where('userId', '==', userId),
    where('timestamp', '>', new Date(lastReviewedMemoryTimestamp * 1000)),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  (await getDocs(q)).forEach((doc) => {
    let data = doc.data(); // client-side filtering, due to no index for type
    if (data.type == 'Uploaded') {
      memoryData.push(data);
    }
  });
} catch (error) {
  console.error("X-Error:", error);
  throw error;
}
window.memoryData = memoryData;

console.log('mem[0]', memoryData[0]);

let memoryElements = [];
memoryData.forEach(data => {
  let memory = document.createElement('div');
  memory.className = 'memory';

  let img = document.createElement('img');
  img.src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  memory.appendChild(img);

  let text = document.createElement('p');
  let type;
  switch (data.type) {
    case 'Uploaded': type = 'U'; break;
    case 'Saved': type = 'S'; break;
    default: type = '?'; console.warn('Unrecognized memory type', data); break;
  }
  text.innerHTML = `
  <span class="userId float-l">${fm(data.userId)}</span>
  <span class="type float-r">${type}</span>
  <br>
  <span class="country">${data.country}</span>
  `;
  memory.appendChild(text);

  memoryElements.push(memory);
});
window.memoryElements = memoryElements;

let main = $('#memory-container');
memoryElements.forEach(element => {
  main.appendChild(element);
});

document.dispatchEvent(new Event('x-memories-ready'));
