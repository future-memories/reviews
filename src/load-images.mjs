import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, doc, setDoc, getDocs, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();
const url = new URLSearchParams(new URL(window.location.href).search);

console.log('DBG: Loaded imports');

let cats = [
  'https://cdn2.thecatapi.com/images/100.jpg',
  'https://cdn2.thecatapi.com/images/101.jpg',
  'https://cdn2.thecatapi.com/images/102.jpg',
  'https://cdn2.thecatapi.com/images/103.jpg',
  'https://cdn2.thecatapi.com/images/104.jpg',
  'https://cdn2.thecatapi.com/images/105.jpg',
  'https://cdn2.thecatapi.com/images/106.jpg',
  'https://cdn2.thecatapi.com/images/107.jpg',
  'https://cdn2.thecatapi.com/images/108.jpg',
  'https://cdn2.thecatapi.com/images/109.jpg',
];

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
const volume = 100;

console.log('DBG: Initialized firestore');

let imageId = "uWTyDtW9JcCLWckP5sfS";

let qCat = query(collection(db, 'memory'), where('imageId', '==', imageId));
let targetMems = [];
(await getDocs(qCat)).forEach((doc) => targetMems.push(doc));
console.log(targetMems[0]);
// let mem = targetMems[0].data();

// console.log(mem);

// mem.oldImageUrl = mem.imageUrl;
// mem.imageUrl = cats[0];
// console.log(mem);

// const memRef = doc(db, "memory", imageId);

// await updateDoc(targetMems[0], mem);

// q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'), limit(500));
// q = query(collection(db, 'memory'), where('userId', '==', 'xQdHrPyQIIWaf8ismq0d3CZYZ992'), orderBy('timestamp', 'desc'), limit(100));
// q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'), limit(volume));
// q = query(collection(db, 'users'), orderBy('timestamp', 'desc'), limit(volume));
// q = query(collection(db, 'reviews'), limit(volume));

// await setDoc(doc(db, "reviews", "demo-LA"), {
  //   name: "Los Angeles",
  //   state: "CA",
  //   country: "USA"
  // });
  // let a = doc(db, 'reviews', 'alovelace');

let memoryData = [];
let memoryElements = [];

let sq = query(collection(db, 'memory'), where('imageId', '==', imageId), limit(1));
// let sq = query(collection(db, 'memory'), orderBy('timestamp', 'desc'), limit(10));

(await getDocs(sq)).forEach((doc) => {
  let data = doc.data();
  memoryData.push(data);
  console.log(data);

  let memory = document.createElement('div');
  memory.className = 'memory';

  let img = document.createElement('img');
  img.src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  img.setAttribute('data-imageId', data.imageId);
  memory.appendChild(img);

  memoryElements.push(memory);
});

let main = $('#memory-container');
memoryElements.forEach(element => {
  main.appendChild(element);
});

window.memoryData = memoryData;
window.memoryElements = memoryElements;
