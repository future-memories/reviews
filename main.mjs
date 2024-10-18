import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let $ = (id) => document.getElementById(id);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();

console.log('Loaded imports');

const firebaseConfig = {
  apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
  authDomain: "patr-3a75e.firebaseapp.com",
  projectId: "patr-3a75e",
  storageBucket: "patr-3a75e.appspot.com",
  messagingSenderId: "1067533396497",
  appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
  measurementId: "G-Y2ZJ3SMS32"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const volume = 12;

console.log('Initialized firestore');

let allDocuments = [];
let q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'), limit(volume));
(await getDocs(q)).forEach((doc) => {
  allDocuments.push(doc.data());
});
console.log(allDocuments[0]);

let memoryElements = [];
allDocuments.forEach(data => {
  let memory = document.createElement('div');
  memory.className = 'memory';

  let img = document.createElement('img');
  img.src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  memory.appendChild(img);

  let text = document.createElement('p');
  text.className = 'memory-text';
  let date = new Date(data.timestamp.seconds * 1000).toISOString();
  text.innerHTML = `
  <span class="userId float-l">${fm(data.userId)}</span>
  <span class="type float-r">${data.type == 'Uploaded' ? 'U' : (console.log('type is not Uploaded', data), '?')}</span>
  <br>
  <span class="country">${data.country}</span>
  `;
  // <span class="date float-l">${date.split('T')[0]}</span>
  // <span class="time float-r">${date.split('T')[1].split('.')[0]}</span>

  // TODO: keywords
  memory.appendChild(text);

  memoryElements.push(memory);
});

let main = $('memory-container');
memoryElements.forEach(element => {
  main.appendChild(element);
});
